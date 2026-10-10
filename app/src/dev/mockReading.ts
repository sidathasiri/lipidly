import { addDays, type IsoDate } from '@lipidly/rules';
import { newId, today } from '@/state/ids';
import type { ExtractionStep } from '@/services/documents';
import type { DraftReport, ExtractedPrescription, ReportSource, StoredMarker } from '@/state/types';

/**
 * Development only: sample reading results for the local developer account (dev/devBoot.ts),
 * which has no sign-in and so can't call the backend. Real accounts use services/documents.ts.
 */

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('cancelled'));
    });
  });

const mg = (marker: StoredMarker['marker'], value: number): StoredMarker => ({ marker, value, unit: 'mg/dL', extractedValue: value, edited: false });

/** First report reads like the June sample; later ones like September, with one misread to show the check. */
const SAMPLES: { daysAgo: number; markers: StoredMarker[] }[] = [
  {
    daysAgo: 118,
    markers: [mg('totalCholesterol', 232), mg('triglycerides', 342), mg('hdl', 36), mg('nonHdl', 196), mg('ldl', 131)],
  },
  {
    daysAgo: 18,
    markers: [mg('totalCholesterol', 222), mg('triglycerides', 286), mg('hdl', 38), mg('nonHdl', 148), mg('ldl', 127)],
  },
];

export async function extractReport(
  input: { source: ReportSource; fileUri?: string; pageCount?: number; existingReports: number },
  onStep: (step: ExtractionStep, progress: number) => void,
  signal?: AbortSignal,
): Promise<DraftReport> {
  onStep('uploading', 0.15);
  await wait(900, signal);
  onStep('reading', 0.55);
  await wait(1600, signal);
  onStep('checking', 0.9);
  await wait(800, signal);
  const sample = SAMPLES[Math.min(input.existingReports, SAMPLES.length - 1)]!;
  return {
    id: newId('draft_'),
    labName: 'Lanka Diagnostics',
    collectionDate: addDays(today(), -sample.daysAgo) as IsoDate,
    markers: sample.markers.map((m) => ({ ...m })),
    source: input.source,
    fileUri: input.fileUri,
    pageCount: input.pageCount ?? 2,
  };
}

export async function extractPrescription(onStep: (step: ExtractionStep, progress: number) => void, signal?: AbortSignal): Promise<ExtractedPrescription> {
  onStep('uploading', 0.2);
  await wait(800, signal);
  onStep('reading', 0.6);
  await wait(1400, signal);
  onStep('checking', 0.9);
  await wait(600, signal);
  return {
    doctor: 'Dr. S. Fernando',
    date: today(),
    medicines: [
      { name: 'Atorvastatin', strength: '10 mg', dose: '1 tablet', frequency: 'Once daily', timing: 'At night', duration: '', times: ['21:00'] },
      { name: 'Vitamin D3', strength: '1000 IU', dose: '1 capsule', frequency: 'Once daily', timing: 'After breakfast', duration: '30 days', times: ['08:00'] },
    ],
    doctorInstruction: { text: 'Alcohol-free days', question: 'Was today alcohol-free?', conflictKeys: ['alcohol'] },
    followUp: `${addDays(today(), 69)}T10:30`,
  };
}
