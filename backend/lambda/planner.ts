import { clone, diffRecords, latestMealPlan, mealGuidanceFor, newId, setMealPlan } from '@lipidly/domain';
import { loadUserData, putJob, writeRecords } from './lib/db';
import { writeWeek } from './lib/meals';

/**
 * The planner Lambda: writes a week of meal ideas (spec F13) and saves it as the user's
 * meal plan, replacing the previous one. Invoked asynchronously by startMealPlan; the phone
 * polls the job, then syncs to get the new plan.
 */

interface PlannerEvent {
  sub: string;
  jobId: string;
  /** First day of the plan: the user's today. */
  weekStart: string;
}

export async function handler({ sub, jobId, weekStart }: PlannerEvent) {
  const fail = (error: string) => putJob(sub, { id: jobId, kind: 'mealPlan', status: 'failed', error });
  try {
    const before = await loadUserData(sub);
    const guidance = mealGuidanceFor(before);
    if (!before.profile || !guidance?.eligible) return await fail(guidance?.reason ?? 'Please finish your profile first.');

    const lastWeek = latestMealPlan(before)?.days.flatMap((d) => d.meals.map((m) => m.title)) ?? [];
    const days = await writeWeek(before.profile, guidance, weekStart, lastWeek);

    const after = clone(before);
    const plan = { id: newId('meals_'), weekStart, createdAt: new Date().toISOString(), days };
    setMealPlan(after, plan);
    const { puts, deletes } = diffRecords(before, after);
    await writeRecords(sub, [...puts, ...deletes]);
    await putJob(sub, { id: jobId, kind: 'mealPlan', status: 'done', result: { planId: plan.id } });
  } catch (e) {
    console.error('meal plan failed', e instanceof Error ? e.message : e);
    await fail('We couldn’t make your meal plan right now. Please try again.');
  }
}
