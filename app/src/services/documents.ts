import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { extractPrescription, extractReport } from '@/dev/mockReading';
import { newId, today } from '@/state/ids';
import { isSyncedSession } from '@/state/store';
import type { DraftReport, ExtractedPrescription, ReportSource, StoredMarker } from '@/state/types';
import { createUploadUrl, startReading, type FileKind } from './api';
import { JobError as ReadingError, waitForJob } from './jobs';

/**
 * Reading a lab report or prescription: each page is uploaded to S3 through a short-lived link,
 * then the backend reads them with Claude on Bedrock while the phone polls for the result.
 * Nothing is saved to the user's data until they check and confirm it.
 */

export type ExtractionStep = 'uploading' | 'reading' | 'checking';
type OnStep = (step: ExtractionStep, progress: number) => void;

/** Shown to the user as is. */
export { JobError as ReadingError } from './jobs';

/** Longest side sent for photos: enough to read small print, small enough to upload quickly. */
const MAX_SIDE = 2000;
const TIMEOUT_MS = 3 * 60 * 1000;

const cancelled = (signal?: AbortSignal) => {
  if (signal?.aborted) throw new Error('cancelled');
};

/** Photos become JPEGs no larger than MAX_SIDE (also converts HEIC); PDFs go as they are. */
async function prepare(uri: string, isPdf: boolean): Promise<{ uri: string; type: string }> {
  if (isPdf) return { uri, type: 'application/pdf' };
  let image = await ImageManipulator.manipulate(uri).renderAsync();
  const longest = Math.max(image.width, image.height);
  if (longest > MAX_SIDE) {
    const size = image.width >= image.height ? { width: MAX_SIDE } : { height: MAX_SIDE };
    image = await ImageManipulator.manipulate(image).resize(size).renderAsync();
  }
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: saved.uri, type: 'image/jpeg' };
}

async function upload(kind: FileKind, uri: string, isPdf: boolean): Promise<string> {
  const file = await prepare(uri, isPdf);
  const target = await createUploadUrl(kind, file.type);
  const body = await (await fetch(file.uri)).blob();
  const res = await fetch(target.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body });
  if (!res.ok) throw new ReadingError('The upload didn’t finish. Check your connection and try again.');
  return target.key;
}

async function read<R>(kind: FileKind, uris: string[], isPdf: boolean, onStep: OnStep, signal?: AbortSignal): Promise<{ result: R; fileKeys: string[] }> {
  onStep('uploading', 0.1);
  const fileKeys: string[] = [];
  for (const [i, uri] of uris.entries()) {
    cancelled(signal);
    fileKeys.push(await upload(kind, uri, isPdf));
    onStep('uploading', 0.1 + (0.3 * (i + 1)) / uris.length);
  }
  cancelled(signal);
  const jobId = await startReading(kind, fileKeys);
  onStep('reading', 0.45);
  const result = await waitForJob<R>(jobId, {
    timeoutMs: TIMEOUT_MS,
    fallbackError: 'We couldn’t read this document. Please try again.',
    signal,
    onTick: (ms) => onStep(ms > 15000 ? 'checking' : 'reading', Math.min(0.9, 0.45 + (0.45 * ms) / 30000)),
  });
  onStep('checking', 0.95);
  return { result, fileKeys };
}

interface ReportResult {
  labName: string;
  collectionDate: string;
  noLipidValues: boolean;
  markers: StoredMarker[];
  pageCount: number;
}

export async function readReport(input: { source: ReportSource; uris: string[]; existingReports: number }, onStep: OnStep, signal?: AbortSignal): Promise<DraftReport> {
  if (!isSyncedSession()) return extractReport({ source: input.source, fileUri: input.uris[0], pageCount: input.uris.length, existingReports: input.existingReports }, onStep, signal);
  const { result, fileKeys } = await read<ReportResult>('report', input.uris, input.source === 'pdf', onStep, signal);
  if (result.noLipidValues) throw new ReadingError('We couldn’t find cholesterol results in this document. Check it’s a lipid profile, or enter the values by hand.');
  return {
    id: newId('draft_'),
    labName: result.labName,
    collectionDate: result.collectionDate || today(),
    markers: result.markers,
    source: input.source,
    fileUri: input.uris[0],
    fileKeys,
    pageCount: input.source === 'pdf' ? 1 : input.uris.length,
  };
}

export async function readPrescription(input: { uris: string[]; isPdf: boolean }, onStep: OnStep, signal?: AbortSignal): Promise<ExtractedPrescription> {
  if (!isSyncedSession()) return extractPrescription(onStep, signal);
  const { result, fileKeys } = await read<ExtractedPrescription>('prescription', input.uris, input.isPdf, onStep, signal);
  if (!result.medicines.length) throw new ReadingError('We couldn’t find any medicines in this document. Try a clearer photo.');
  return { ...result, fileKeys };
}
