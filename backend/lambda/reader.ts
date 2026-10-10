import AnthropicBedrock from '@anthropic-ai/bedrock-sdk';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ExtractedPrescription, StoredMarker } from '@lipidly/domain';
import { putJob } from './lib/db';

/**
 * The reader Lambda: reads an uploaded lab report or prescription with Claude on Bedrock and
 * stores the result on the job. Invoked asynchronously by startReading; the phone polls the job.
 * Nothing is saved to the user's data here: the user checks and confirms every value first.
 */

const s3 = new S3Client({});
const claude = new AnthropicBedrock({ awsRegion: process.env.AWS_REGION });
const MODEL = process.env.MODEL_ID ?? 'us.anthropic.claude-opus-5-5';
const BUCKET = process.env.BUCKET_NAME!;
/** Bedrock takes at most 20 MB per request; base64 adds a third. */
const MAX_BYTES = 14 * 1024 * 1024;

interface ReaderEvent {
  sub: string;
  jobId: string;
  kind: 'report' | 'prescription';
  fileKeys: string[];
}

const MARKERS = ['totalCholesterol', 'ldl', 'hdl', 'triglycerides', 'nonHdl', 'vldl', 'tcHdlRatio'];

const REPORT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['labName', 'collectionDate', 'noLipidValues', 'markers'],
  properties: {
    labName: { type: 'string' },
    collectionDate: { type: 'string', description: 'YYYY-MM-DD, or "" if not printed' },
    noLipidValues: { type: 'boolean' },
    markers: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['marker', 'value', 'unit'],
        properties: {
          marker: { type: 'string', enum: MARKERS },
          value: { type: 'number' },
          unit: { type: 'string', enum: ['mg/dL', 'mmol/L', 'none'] },
        },
      },
    },
  },
};

const REPORT_PROMPT = `You are reading a lab report for a cholesterol tracking app. Extract the lipid panel exactly as printed.

Rules:
- Only these markers: totalCholesterol, ldl (LDL cholesterol, direct or calculated), hdl, triglycerides, nonHdl (non-HDL cholesterol), vldl, tcHdlRatio (total cholesterol / HDL ratio).
- Copy each result value exactly as printed. Never compute, convert or guess a value. Skip a marker you cannot read clearly.
- unit: the unit printed for that result ("mg/dL" or "mmol/L"); "none" for the ratio or when no unit is printed.
- Ignore reference ranges, flags and previous results columns.
- labName: the laboratory or hospital name; "" if not printed.
- collectionDate: the sample collection date (else the report date) as YYYY-MM-DD; "" if not printed. Dates in Sri Lanka are usually day/month/year.
- noLipidValues: true when the document has no lipid panel results at all (then markers is empty).`;

const PRESCRIPTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['doctor', 'date', 'medicines', 'doctorInstruction', 'followUp'],
  properties: {
    doctor: { type: 'string' },
    date: { type: 'string', description: 'YYYY-MM-DD, or ""' },
    medicines: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'strength', 'dose', 'frequency', 'timing', 'duration', 'times'],
        properties: {
          name: { type: 'string' },
          strength: { type: 'string' },
          dose: { type: 'string' },
          frequency: { type: 'string' },
          timing: { type: 'string' },
          duration: { type: 'string' },
          times: { type: 'array', items: { type: 'string', description: 'HH:mm, 24-hour' } },
        },
      },
    },
    doctorInstruction: {
      type: 'object',
      additionalProperties: false,
      required: ['present', 'text', 'question', 'conflictKeys'],
      properties: {
        present: { type: 'boolean' },
        text: { type: 'string' },
        question: { type: 'string' },
        conflictKeys: { type: 'array', items: { type: 'string', enum: ['alcohol', 'smoking', 'walk'] } },
      },
    },
    followUp: { type: 'string', description: 'YYYY-MM-DDTHH:mm, or ""' },
  },
};

const PRESCRIPTION_PROMPT = `You are reading a doctor's prescription for a cholesterol tracking app. Extract it exactly as written.

Rules:
- doctor: the doctor's name as written; "" if not readable. date: the prescription date as YYYY-MM-DD; "" if not readable. Dates in Sri Lanka are usually day/month/year.
- medicines: one entry per medicine. name, strength (e.g. "10 mg"), dose (e.g. "1 tablet"), frequency (e.g. "Once daily"), timing (e.g. "At night", "After breakfast"), duration (e.g. "30 days").
- Use "" for any field you cannot read with confidence. Never guess: the patient checks every field.
- times: suggested dose times as HH:mm from the frequency and timing (morning 08:00, midday 13:00, evening 18:00, night 21:00). Empty when the frequency is unclear.
- doctorInstruction: one lifestyle instruction written by the doctor, if any (e.g. "No alcohol", "Walk 30 minutes daily"). present=false and empty fields when there is none. text: a short habit title, e.g. "Alcohol-free days". question: a yes/no daily check-in question, e.g. "Was today alcohol-free?". conflictKeys: which of alcohol, smoking, walk it covers.
- followUp: the next visit as YYYY-MM-DDTHH:mm (use 09:00 if no time is written); "" if none.`;

async function fileBlock(key: string) {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await obj.Body!.transformToByteArray();
  const data = Buffer.from(bytes).toString('base64');
  const type = obj.ContentType ?? '';
  const block =
    type === 'application/pdf'
      ? { type: 'document' as const, source: { type: 'base64' as const, media_type: 'application/pdf' as const, data } }
      : { type: 'image' as const, source: { type: 'base64' as const, media_type: (type === 'image/png' ? 'image/png' : 'image/jpeg') as 'image/png' | 'image/jpeg', data } };
  return { block, size: bytes.byteLength };
}

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

function toReport(raw: { labName: string; collectionDate: string; noLipidValues: boolean; markers: { marker: string; value: number; unit: string }[] }) {
  const seen = new Set<string>();
  const markers: StoredMarker[] = [];
  for (const m of raw.markers) {
    if (seen.has(m.marker) || !Number.isFinite(m.value)) continue;
    seen.add(m.marker);
    markers.push({
      marker: m.marker as StoredMarker['marker'],
      value: m.value,
      unit: m.unit === 'none' ? undefined : (m.unit as StoredMarker['unit']),
      extractedValue: m.value,
      edited: false,
    });
  }
  return { labName: raw.labName, collectionDate: isDate(raw.collectionDate) ? raw.collectionDate : '', noLipidValues: raw.noLipidValues || markers.length === 0, markers };
}

function toPrescription(raw: {
  doctor: string;
  date: string;
  medicines: ExtractedPrescription['medicines'];
  doctorInstruction: { present: boolean; text: string; question: string; conflictKeys: string[] };
  followUp: string;
}): Omit<ExtractedPrescription, 'fileKeys'> {
  const i = raw.doctorInstruction;
  return {
    doctor: raw.doctor,
    date: isDate(raw.date) ? raw.date : '',
    medicines: raw.medicines.map((m) => ({ ...m, times: m.times.filter((t) => /^\d{2}:\d{2}$/.test(t)) })),
    doctorInstruction: i.present && i.text ? { text: i.text, question: i.question || `Did you follow "${i.text}" today?`, conflictKeys: i.conflictKeys } : undefined,
    followUp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw.followUp) ? raw.followUp : undefined,
  };
}

export async function handler(event: ReaderEvent) {
  const { sub, jobId, kind, fileKeys } = event;
  const fail = (error: string) => putJob(sub, { id: jobId, kind, status: 'failed', error });
  try {
    const files = await Promise.all(fileKeys.map(fileBlock));
    if (files.reduce((n, f) => n + f.size, 0) > MAX_BYTES) return await fail('These files are too large. Try fewer pages or smaller photos.');

    const isReport = kind === 'report';
    const message = await claude.messages
      .stream({
        model: MODEL,
        max_tokens: 16000,
        output_config: { effort: 'medium', format: { type: 'json_schema', schema: isReport ? REPORT_SCHEMA : PRESCRIPTION_SCHEMA } },
        messages: [{ role: 'user', content: [...files.map((f) => f.block), { type: 'text', text: isReport ? REPORT_PROMPT : PRESCRIPTION_PROMPT }] }],
      })
      .finalMessage();

    if (message.stop_reason === 'refusal') return await fail('We couldn’t read this document. Please enter the values yourself.');
    if (message.stop_reason === 'max_tokens') return await fail('This document was too long to read. Try fewer pages.');
    const text = message.content.find((b) => b.type === 'text');
    if (!text || text.type !== 'text') return await fail('We couldn’t read this document. Please try again.');

    const raw = JSON.parse(text.text);
    const result = isReport ? { ...toReport(raw), pageCount: fileKeys.length, fileKeys } : { ...toPrescription(raw), fileKeys };
    await putJob(sub, { id: jobId, kind, status: 'done', result });
  } catch (e) {
    console.error('reading failed', e instanceof Error ? e.message : e);
    await fail('We couldn’t read this document right now. Please try again.');
  }
}
