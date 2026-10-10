import type { IsoDate } from '@lipidly/rules';
import { planAdherence as adherenceTo } from '@lipidly/domain';
import { today } from '../ids';
import type { Plan, UserData } from '../types';

/** Plan helpers come from @lipidly/domain, so the app and the Lambdas build plans the same way. */
export { activePlan, appPlanHabit, dailyHabits, openEscalation, proposedPlan } from '@lipidly/domain';

export const planAdherence = (d: UserData, plan: Plan, to: IsoDate = today()): number => adherenceTo(d, plan, to);
