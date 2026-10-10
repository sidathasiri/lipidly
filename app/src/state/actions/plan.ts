import { habitById, nextSwapDate, type IsoDate } from '@lipidly/rules';
import { today } from '../ids';
import { updateUser } from '../store';
import { appPlanHabit } from './plan-builder';

/** "I can do this": a habit becomes active only after the user commits (F4.12). */
export function commitHabit(planId: string, planHabitId: string) {
  updateUser((d) => {
    const h = d.plans.find((p) => p.id === planId)?.habits.find((x) => x.id === planHabitId);
    if (h) h.committed = true;
  });
}

/**
 * Replaces one app habit with another that fits. Free while the plan is a proposal;
 * once active, limited to one swap every two weeks (F4.8).
 */
export function swapHabit(planId: string, planHabitId: string, newHabitId: string): { ok: boolean; opensOn?: IsoDate } {
  let result: { ok: boolean; opensOn?: IsoDate } = { ok: false };
  updateUser((d) => {
    const plan = d.plans.find((p) => p.id === planId);
    const habit = habitById(newHabitId);
    if (!plan || !habit) return;
    if (plan.status === 'active') {
      const gate = nextSwapDate(plan.lastSwap, today());
      if (!gate.allowed) {
        result = { ok: false, opensOn: gate.opensOn };
        return;
      }
      plan.lastSwap = today();
    }
    const i = plan.habits.findIndex((h) => h.id === planHabitId);
    if (i < 0) return;
    plan.habits[i] = appPlanHabit(habit, plan.status === 'active');
    result = { ok: true };
  });
  return result;
}

/** Accepts the proposal: it becomes the one active plan (spec: one active plan per user). */
export function startPlan(planId: string) {
  updateUser((d) => {
    for (const p of d.plans) {
      if (p.id === planId) {
        p.status = 'active';
        p.startDate = today();
      } else if (p.status === 'active') {
        p.status = 'past';
      }
    }
  });
}

export function setRetestDate(planId: string, date: IsoDate) {
  updateUser((d) => {
    const p = d.plans.find((x) => x.id === planId);
    if (p) p.retestDate = date;
  });
}

export function setHabitReminder(planId: string, planHabitId: string, time: string | undefined) {
  updateUser((d) => {
    const h = d.plans.find((p) => p.id === planId)?.habits.find((x) => x.id === planHabitId);
    if (h) h.reminderTime = time;
  });
}
