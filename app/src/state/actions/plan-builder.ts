import type { IsoDate } from '@lipidly/rules';
import { dailyHabits as dailyHabitsOn, planAdherence as adherenceTo } from '@lipidly/domain';
import { today } from '../ids';
import type { Plan, PlanHabit, UserData } from '../types';

/** Plan helpers come from @lipidly/domain, so the app and the Lambdas build plans the same way. */
export { activePlan, appPlanHabit, openEscalation, proposedPlan } from '@lipidly/domain';

export const planAdherence = (d: UserData, plan: Plan, to: IsoDate = today()): number => adherenceTo(d, plan, to);

/** Today's check-in questions: core habits, this week's habit of the week, then the user's own. */
export const dailyHabits = (d: UserData, plan?: Plan): PlanHabit[] => dailyHabitsOn(d, plan, today());
