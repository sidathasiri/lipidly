import {
  HABIT_LIBRARY_VERSION,
  RULESET,
  adherence,
  defaultRetestDate,
  habitById,
  proposeHabits,
  type Habit,
  type IsoDate,
  type ReportOutcome,
} from '@lipidly/rules';
import { newId, today } from '../ids';
import type { EscalationRecord, Plan, PlanHabit, Report, UserData } from '../types';
import { ownAsPlanHabits } from './ownHabits';

/** Default reminder times for habit nudges, by habit category. */
const DEFAULT_REMINDER: Record<Habit['category'], string | undefined> = {
  activity: '18:30',
  food: '19:30',
  alcohol: undefined,
  smoking: undefined,
};

export const appPlanHabit = (h: Habit, committed = false): PlanHabit => ({
  id: newId('ph_'),
  source: 'app',
  habitId: h.id,
  title: h.shortTitle,
  question: h.question,
  committed,
  reminderTime: DEFAULT_REMINDER[h.category],
});

const doctorPlanHabits = (d: UserData): PlanHabit[] =>
  d.doctorHabits.map((dh) => ({ id: `doc_${dh.id}`, source: 'doctor', title: dh.text, question: dh.question, committed: true }));

export const activePlan = (d: UserData): Plan | undefined => d.plans.find((p) => p.status === 'active');

/** Everything asked in the daily check-in: the plan's committed habits, then the user's own. */
export const dailyHabits = (d: UserData, plan: Plan | undefined = activePlan(d)): PlanHabit[] =>
  plan ? [...plan.habits.filter((h) => h.committed), ...ownAsPlanHabits(d)] : [];
export const proposedPlan = (d: UserData): Plan | undefined => d.plans.find((p) => p.status === 'proposed');

/** Share of expected habit check-ins kept since the plan started. */
export const planAdherence = (d: UserData, plan: Plan, to: IsoDate = today()): number => {
  const ids = plan.habits.filter((h) => h.source === 'app').map((h) => h.id);
  return adherence(Object.values(d.checkIns), ids, plan.startDate, to, plan.mode === 'maintenance' ? 3 : 7);
};

/** The "previous cycle" the rule engine compares a new report against. */
export const previousCycle = (d: UserData) => {
  const plan = activePlan(d);
  const source = plan && d.reports.find((r) => r.id === plan.sourceReportId);
  if (!plan || !source) return undefined;
  return {
    focus: plan.focus,
    mode: plan.mode,
    appHabitIds: plan.habits.filter((h) => h.source === 'app' && h.habitId).map((h) => h.habitId!),
    values: source.values,
    adherence: planAdherence(d, plan),
  };
};

/** Turns a rule-engine outcome into a proposed plan (or an escalation) on the user's data. */
export function applyOutcome(d: UserData, report: Report, outcome: ReportOutcome) {
  d.plans = d.plans.filter((p) => p.status !== 'proposed');

  if (outcome.kind === 'escalation') {
    applyEscalation(d, { ...outcome.escalation, id: newId('esc_'), date: today(), reportId: report.id });
    return;
  }

  const profile = d.profile!;
  const doctorKeys = d.doctorHabits.flatMap((h) => h.conflictKeys);
  const previous = activePlan(d);
  const s = outcome.habits;

  let habits: Habit[];
  if (s.keepHabitIds?.length) {
    habits = s.keepHabitIds.map((id) => habitById(id)).filter((h): h is Habit => !!h);
  } else if (outcome.focusGroup) {
    habits = proposeHabits({ focus: outcome.focusGroup, user: profile, doctorConflictKeys: doctorKeys, count: s.count, easierOnly: s.easierOnly, exclude: s.excludeHabitIds });
  } else {
    // Maintenance: offer to keep up to two of the previous habits, or two easy ones.
    const kept = previous?.habits.filter((h) => h.source === 'app' && h.habitId).map((h) => habitById(h.habitId!)!) ?? [];
    habits = kept.length ? kept.slice(0, 2) : proposeHabits({ focus: 'triglycerides', user: profile, doctorConflictKeys: doctorKeys, count: 2, easierOnly: true });
  }

  d.plans.push({
    id: newId('plan_'),
    status: 'proposed',
    startDate: today(),
    focus: outcome.focus,
    focusGroup: outcome.focusGroup,
    mode: outcome.mode,
    retestDate: outcome.retestDate,
    sourceReportId: report.id,
    decision: outcome.decision,
    summary: outcome.summary,
    suggestDoctor: outcome.suggestDoctor,
    habits: [...habits.map((h) => appPlanHabit(h)), ...doctorPlanHabits(d)],
    ruleSetVersion: outcome.ruleSetVersion,
    libraryVersion: HABIT_LIBRARY_VERSION,
  });
}

/**
 * Records an escalation. No app-written plan is offered; tracking, reminders and doctor
 * habits keep working (F11.2, F11.3).
 */
export function applyEscalation(d: UserData, esc: EscalationRecord) {
  d.escalations.push(esc);
  const current = activePlan(d);
  if (current) current.status = 'past';
  const source = esc.reportId ?? current?.sourceReportId ?? d.reports[0]?.id;
  if (!source) return;
  const report = d.reports.find((r) => r.id === source);
  d.plans.push({
    id: newId('plan_'),
    status: 'active',
    startDate: today(),
    focus: null,
    focusGroup: null,
    mode: 'active',
    retestDate: current?.retestDate ?? defaultRetestDate(report?.collectionDate ?? today(), 'active'),
    sourceReportId: source,
    decision: 'initial',
    summary: 'Please see your doctor about this result. Lipidly keeps tracking and reminders going.',
    suggestDoctor: true,
    habits: doctorPlanHabits(d),
    ruleSetVersion: RULESET.version,
    libraryVersion: HABIT_LIBRARY_VERSION,
    escalationId: esc.id,
  });
}

/** The escalation behind the current plan, if the plan follows one. */
export const openEscalation = (d: UserData): EscalationRecord | undefined => {
  const id = activePlan(d)?.escalationId;
  return id ? d.escalations.find((e) => e.id === id) : undefined;
};
