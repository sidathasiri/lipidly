import { toggleShoppingItem, type MealSlot } from '@lipidly/domain';
import { create } from 'zustand';
import { ApiError, OfflineError, serverOp, startMealPlan } from '@/services/api';
import { JobError, waitForJob } from '@/services/jobs';
import { flush, mergeRecords, syncNow } from '@/services/sync';
import { today } from '../ids';
import { getState, isSyncedSession, updateUser } from '../store';

/**
 * Meal plans (F13). The backend writes them with AI, so they need a connection: a week takes
 * about half a minute, one swapped meal a few seconds. Shopping ticks are saved on the phone and synced.
 */

const OFFLINE = 'No connection. Check your internet and try again.';
const userMessage = (e: unknown, fallback: string) =>
  e instanceof JobError || e instanceof ApiError ? e.message : e instanceof OfflineError ? OFFLINE : fallback;

/** Progress of the week being written, kept outside the screen so leaving it doesn't lose it. */
export const useMealJob = create<{ running: boolean; progress: number; error?: string }>(() => ({ running: false, progress: 0 }));

/** Starts writing a new week (once at a time); progress and errors land in `useMealJob`. */
export function startNewWeek() {
  if (useMealJob.getState().running) return;
  useMealJob.setState({ running: true, progress: 0, error: undefined });
  generateMealPlan((progress) => useMealJob.setState({ progress }))
    .then(() => useMealJob.setState({ running: false }))
    .catch((e: Error) => useMealJob.setState({ running: false, error: e.message }));
}

async function generateMealPlan(onProgress: (fraction: number) => void, signal?: AbortSignal) {
  if (!isSyncedSession()) throw new Error('Sign in to create meal plans.');
  try {
    // The planner reads the saved profile, so food preferences must reach the server first.
    if (!(await flush())) throw new OfflineError();
    onProgress(0.05);
    const jobId = await startMealPlan(today());
    await waitForJob(jobId, {
      timeoutMs: 4 * 60 * 1000,
      fallbackError: 'We couldn’t make your meal plan right now. Please try again.',
      signal,
      onTick: (ms) => onProgress(Math.min(0.92, 0.05 + ms / 40000)),
    });
    await syncNow();
    onProgress(1);
  } catch (e) {
    if ((e as Error).message === 'cancelled') throw e;
    throw new Error(userMessage(e, 'We couldn’t make your meal plan right now. Please try again.'));
  }
}

export async function swapMeal(planId: string, date: string, slot: MealSlot) {
  try {
    const res = await serverOp('swapMeal', {
      planId: { type: 'ID!', value: planId },
      date: { type: 'AWSDate!', value: date },
      slot: { type: 'String!', value: slot },
      today: { type: 'AWSDate!', value: today() },
    });
    mergeRecords(getState().session!.id, res.records);
  } catch (e) {
    throw new Error(userMessage(e, 'We couldn’t swap this meal. Please try again.'));
  }
}

export function toggleShopping(planId: string, key: string) {
  updateUser((d) => toggleShoppingItem(d, planId, key));
}
