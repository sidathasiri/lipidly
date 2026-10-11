import { readingJob } from './api';

/** Waiting on a backend job (document reading, meal plan): poll until it's done or failed. */

/** Shown to the user as is. */
export class JobError extends Error {}

const POLL_MS = 2000;

export const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(new Error('cancelled'));
    const t = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new Error('cancelled'));
    });
  });

/** Resolves with the job's result; `onTick` gets the time waited so far (ms). */
export async function waitForJob<R>(jobId: string, opts: { timeoutMs: number; fallbackError: string; onTick?: (elapsedMs: number) => void; signal?: AbortSignal }): Promise<R> {
  const started = Date.now();
  for (;;) {
    await wait(POLL_MS, opts.signal);
    const job = await readingJob<R>(jobId);
    if (job?.status === 'done' && job.result) return job.result;
    if (!job || job.status === 'failed') throw new JobError(job?.error ?? opts.fallbackError);
    if (Date.now() - started > opts.timeoutMs) throw new JobError('This is taking too long. Please try again.');
    opts.onTick?.(Date.now() - started);
  }
}
