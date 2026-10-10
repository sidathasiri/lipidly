import { applyPlanAction, type PlanAction } from '@lipidly/domain';
import type { IsoDate } from '@lipidly/rules';
import { newId, today } from '../ids';
import { enqueue, updateUser } from '../store';

/**
 * Plan changes apply on the phone at once and are sent to the server as the same action, which
 * re-runs it with the same rules. Swaps pick the new habit's ID here so both sides match.
 */
function run(action: PlanAction): { ok: boolean; opensOn?: IsoDate } {
  const t = today();
  let result: { ok: boolean; opensOn?: IsoDate } = { ok: false };
  updateUser((d) => {
    result = applyPlanAction(d, action, t);
  });
  if (result.ok) enqueue({ id: newId('op_'), op: 'planAction', variables: { action, today: t } });
  return result;
}

/** "I can do this": a habit becomes active only after the user commits (F4.12). */
export const commitHabit = (planId: string, planHabitId: string) => run({ action: 'commit', planId, habitId: planHabitId });

/** Replaces one app habit (free while proposed; once every two weeks when active, F4.8). */
export const swapHabit = (planId: string, planHabitId: string, newHabitId: string) =>
  run({ action: 'swap', planId, habitId: planHabitId, newHabitId, newPlanHabitId: newId('ph_') });

/** Accepts the proposal: it becomes the one active plan. */
export const startPlan = (planId: string) => run({ action: 'start', planId });

export const setRetestDate = (planId: string, date: IsoDate) => run({ action: 'retest', planId, date });

export const setHabitReminder = (planId: string, planHabitId: string, time: string | undefined) =>
  run({ action: 'reminder', planId, habitId: planHabitId, time });
