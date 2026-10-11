import type { EscalationRecord, Plan, UserData } from './types';

/** The one active plan, and the doctor escalation it follows (kept apart so other modules can share them without import cycles). */
export const activePlan = (d: UserData): Plan | undefined => d.plans.find((p) => p.status === 'active');

/** The escalation the active plan follows, while it's open. */
export const openEscalation = (d: UserData): EscalationRecord | undefined => {
  const id = activePlan(d)?.escalationId;
  return id ? d.escalations.find((e) => e.id === id) : undefined;
};
