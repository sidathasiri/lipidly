import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ExtractedPrescription, StoredMarker } from '@lipidly/domain';
import { putJob } from './lib/db';
import { chat, type ContentPart } from './lib/mantle';

/**
 * The reader Lambda: reads an uploaded lab report or prescription with a vision model on Bedrock
 * (Qwen3-VL through the OpenAI-compatible endpoint) and stores the result on the job. Invoked
 * asynchronously by startReading; the phone polls the job. Nothing is saved to the user's data
 * here: the user checks and confirms every value first.
 *
 * The model reads images only, so PDF pages are rendered to JPEGs first.
 */

const s3 = new S3Client({});
const MODEL = process.env.MODEL_ID ?? 'qwen.qwen3-vl-235b-a22b-instruct';
const BUCKET = process.env.BUCKET_NAME!;
/** Request size budget for all page images together (base64 adds a third). */
const MAX_BYTES = 14 * 1024 * 1024;
/** Pages sent to the model; lipid results and prescriptions fit on far fewer. */
const MAX_PAGES = 6;

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
- Copy each result value exactly as printed in the current result column. Never compute, convert or guess a value; skip a marker that isn't printed or that you cannot read clearly (for example, don't work out non-HDL yourself).
- unit: the unit printed for that result ("mg/dL" or "mmol/L"); "none" for the ratio or when no unit is printed.
- Ignore reference ranges, flags and previous results columns.
- labName: the laboratory or hospital name; "" if not printed.
- collectionDate: the sample collection date (else the report date) as YYYY-MM-DD; "" if not printed. Dates are written day/month/year (Sri Lanka): 05/10/2026 is 5 October 2026, so output 2026-10-05.
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
- doctor: the doctor's name as written; "" if not readable. date: the prescription date as YYYY-MM-DD; "" if not readable. Dates are written day/month/year (Sri Lanka): 05/10/2026 is 5 October 2026, so output 2026-10-05.
- medicines: one entry per medicine. name, strength (e.g. "10 mg"), dose (e.g. "1 tablet"), frequency (e.g. "Once daily"), timing (e.g. "At night", "After breakfast"), duration (e.g. "30 days").
- Use "" for any field you cannot read with confidence. Never guess: the patient checks every field.
- times: suggested dose times as HH:mm from the frequency and timing (morning 08:00, midday 13:00, evening 18:00, night 21:00). Empty when the frequency is unclear.
- doctorInstruction: one lifestyle instruction written by the doctor, if any (e.g. "No alcohol", "Walk 30 minutes daily"). present=false and empty fields when there is none. text: a short habit title, e.g. "Alcohol-free days". question: a yes/no daily check-in question, e.g. "Was today alcohol-free?". conflictKeys: which of alcohol, smoking, walk it covers.
- followUp: the next visit as YYYY-MM-DDTHH:mm, reading its date day/month/year too (use 09:00 if no time is written); "" if none.`;

type MuPdf = typeof import('mupdf');
let mupdf: Promise<MuPdf> | undefined;
/** mupdf is an ES module (WebAssembly), loaded on first use. */
const loadMupdf = () => (mupdf ??= import('mupdf'));

/** Every page of a PDF as a JPEG, at about 150 dpi (enough for small print). */
async function pdfPages(bytes: Uint8Array): Promise<Uint8Array[]> {
  const { Document, Matrix, ColorSpace } = await loadMupdf();
  const doc = Document.openDocument(bytes, 'application/pdf');
  const pages: Uint8Array[] = [];
  for (let i = 0; i < Math.min(doc.countPages(), MAX_PAGES); i++) {
    const pix = doc.loadPage(i).toPixmap(Matrix.scale(2, 2), ColorSpace.DeviceRGB, false, true);
    pages.push(pix.asJPEG(80));
  }
  return pages;
}

/** One uploaded file as image parts: a photo is one page, a PDF is one per page. */
async function imageParts(key: string): Promise<{ parts: ContentPart[]; size: number }> {
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = await obj.Body!.transformToByteArray();
  const type = obj.ContentType ?? '';
  const images =
    type === 'application/pdf'
      ? (await pdfPages(bytes)).map((b) => ({ b, mime: 'image/jpeg' }))
      : [{ b: bytes, mime: type === 'image/png' ? 'image/png' : 'image/jpeg' }];
  return {
    parts: images.map(({ b, mime }) => ({ type: 'image_url' as const, image_url: { url: `data:${mime};base64,${Buffer.from(b).toString('base64')}` } })),
    size: images.reduce((n, i) => n + i.b.byteLength, 0),
  };
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
    const files = await Promise.all(fileKeys.map(imageParts));
    const images = files.flatMap((f) => f.parts).slice(0, MAX_PAGES);
    if (files.reduce((n, f) => n + f.size, 0) > MAX_BYTES) return await fail('These files are too large. Try fewer pages or smaller photos.');

    const isReport = kind === 'report';
    const { text, finishReason } = await chat({
      model: MODEL,
      max_tokens: 4000,
      temperature: 0,
      response_format: { type: 'json_schema', json_schema: { name: kind, strict: true, schema: isReport ? REPORT_SCHEMA : PRESCRIPTION_SCHEMA } },
      messages: [{ role: 'user', content: [...images, { type: 'text', text: isReport ? REPORT_PROMPT : PRESCRIPTION_PROMPT }] }],
    });

    if (finishReason === 'refusal') return await fail('We couldn’t read this document. Please enter the values yourself.');
    if (finishReason === 'length') return await fail('This document was too long to read. Try fewer pages.');
    if (!text) return await fail('We couldn’t read this document. Please try again.');

    const raw = JSON.parse(text);
    const result = isReport ? { ...toReport(raw), pageCount: images.length, fileKeys } : { ...toPrescription(raw), fileKeys };
    await putJob(sub, { id: jobId, kind, status: 'done', result });
  } catch (e) {
    console.error('reading failed', e instanceof Error ? e.message : e);
    await fail('We couldn’t read this document right now. Please try again.');
  }
}
