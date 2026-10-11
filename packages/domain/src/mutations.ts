import {
  assessReport,
  canEditCheckIn,
  habitById,
  nextSwapDate,
  normaliseValues,
  profileEscalation,
  statusesOf,
  type IsoDate,
} from '@lipidly/rules';
import { newId } from './defaults';
import { adoptHabit, setHabitLevel } from './engagement';
import { appPlanHabit, applyEscalation, applyOutcome, previousCycle } from './plan-builder';
import type { DraftReport, ExtractedPrescription, Report, StoredMarker, UserData, UserProfile } from './types';

/**
 * Every change to a user's data, as plain functions that mutate a `UserData` in place.
 * `today` is always the user's local date, passed in by the phone. The app applies these at
 * once (offline too); the Lambdas apply the server-only ones again and save the result.
 */

// ── Profile ───────────────────────────────────────────────────────────────────

/** Saves profile answers. Escalation rules re-run on every profile change (F11.1). */
export function saveProfile(d: UserData, profile: UserProfile, today: IsoDate) {
  const hadConditions = (d.profile?.conditions.length ?? 0) > 0;
  d.profile = profile;
  const esc = profileEscalation(profile);
  if (esc && !hadConditions && d.reports.length > 0) applyEscalation(d, { ...esc, id: newId('esc_'), date: today }, today);
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ConfirmedValues {
  labName: string;
  collectionDate: IsoDate;
  markers: StoredMarker[];
}

/**
 * Confirms a draft: saves the report, then runs the rule engine for escalation, focus and the
 * plan proposal. Nothing is saved before this (F2.4).
 */
export function confirmReport(d: UserData, draft: DraftReport, edited: ConfirmedValues, today: IsoDate, now: string) {
  if (!d.profile) throw new Error('Profile is needed before a report can be confirmed');
  const markers = edited.markers.filter((m) => Number.isFinite(m.value));
  const values = normaliseValues(markers.map(({ marker, value, unit }) => ({ marker, value, unit })));
  const report: Report = {
    ...draft,
    fileUri: undefined,
    labName: edited.labName.trim() || 'Lab report',
    collectionDate: edited.collectionDate,
    markers,
    confirmedAt: now,
    values,
    statuses: statusesOf(values, d.profile.sex),
  };
  const outcome = assessReport({ values, collectionDate: report.collectionDate, profile: d.profile, previous: previousCycle(d, today) });
  d.reports = [...d.reports.filter((r) => r.id !== report.id), report].sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
  d.draft = undefined;
  applyOutcome(d, report, outcome, today);
  return { reportId: report.id, escalated: outcome.kind === 'escalation' };
}

// ── Plans ─────────────────────────────────────────────────────────────────────

/** "I can do this": a habit becomes active only after the user commits (F4.12). */
export function commitHabit(d: UserData, planId: string, planHabitId: string) {
  const h = d.plans.find((p) => p.id === planId)?.habits.find((x) => x.id === planHabitId);
  if (h) h.committed = true;
}

/**
 * Replaces one app habit with another that fits. Free while the plan is a proposal;
 * once active, limited to one swap every two weeks (F4.8).
 */
export function swapHabit(
  d: UserData,
  planId: string,
  planHabitId: string,
  newHabitId: string,
  today: IsoDate,
  newPlanHabitId?: string,
): { ok: boolean; opensOn?: IsoDate } {
  const plan = d.plans.find((p) => p.id === planId);
  const habit = habitById(newHabitId);
  if (!plan || !habit) return { ok: false };
  if (plan.status === 'active') {
    const gate = nextSwapDate(plan.lastSwap, today);
    if (!gate.allowed) return { ok: false, opensOn: gate.opensOn };
    plan.lastSwap = today;
  }
  const i = plan.habits.findIndex((h) => h.id === planHabitId);
  if (i < 0) return { ok: false };
  plan.habits[i] = appPlanHabit(habit, plan.status === 'active', newPlanHabitId);
  return { ok: true };
}

/** Accepts a proposal: it becomes the one active plan (spec: one active plan per user). */
export function startPlan(d: UserData, planId: string, today: IsoDate) {
  for (const p of d.plans) {
    if (p.id === planId) {
      p.status = 'active';
      p.startDate = today;
    } else if (p.status === 'active') {
      p.status = 'past';
    }
  }
}

export function setRetestDate(d: UserData, planId: string, date: IsoDate) {
  const p = d.plans.find((x) => x.id === planId);
  if (p) p.retestDate = date;
}

export function setHabitReminder(d: UserData, planId: string, planHabitId: string, time: string | undefined) {
  const h = d.plans.find((p) => p.id === planId)?.habits.find((x) => x.id === planHabitId);
  if (h) h.reminderTime = time;
}

export type PlanAction =
  | { action: 'commit'; planId: string; habitId: string }
  /** `newPlanHabitId` is chosen by the phone so both sides key check-ins the same way. */
  | { action: 'swap'; planId: string; habitId: string; newHabitId: string; newPlanHabitId: string }
  | { action: 'start'; planId: string }
  | { action: 'retest'; planId: string; date: IsoDate }
  | { action: 'reminder'; planId: string; habitId: string; time?: string }
  /** Habit levels (F14.1): one step up or down. */
  | { action: 'level'; planId: string; habitId: string; level: number }
  /** Keep the habit of the week (a library habit ID) as a core habit (F14.2). */
  | { action: 'adopt'; planId: string; libraryHabitId: string; newPlanHabitId: string };

/** One entry point for every plan change, so the app and the Lambda run the same switch. */
export function applyPlanAction(d: UserData, a: PlanAction, today: IsoDate): { ok: boolean; opensOn?: IsoDate } {
  switch (a.action) {
    case 'commit':
      commitHabit(d, a.planId, a.habitId);
      return { ok: true };
    case 'swap':
      return swapHabit(d, a.planId, a.habitId, a.newHabitId, today, a.newPlanHabitId);
    case 'start':
      startPlan(d, a.planId, today);
      return { ok: true };
    case 'retest':
      setRetestDate(d, a.planId, a.date);
      return { ok: true };
    case 'reminder':
      setHabitReminder(d, a.planId, a.habitId, a.time);
      return { ok: true };
    case 'level':
      return { ok: setHabitLevel(d, a.planId, a.habitId, a.level, today) };
    case 'adopt':
      return { ok: adoptHabit(d, a.planId, a.libraryHabitId, a.newPlanHabitId, today) };
  }
}

// ── Check-ins ─────────────────────────────────────────────────────────────────

/** Saves a day's check-in. Today and the previous two days can be filled in (F5.3). */
export function saveCheckIn(d: UserData, date: IsoDate, answers: Record<string, boolean>, today: IsoDate, weightKg?: number) {
  if (!canEditCheckIn(date, today)) return;
  d.checkIns[date] = { date, answers, weightKg: weightKg ?? d.checkIns[date]?.weightKg };
}

// ── Prescriptions ─────────────────────────────────────────────────────────────

/** Saves confirmed medicines, the doctor's habit and the follow-up visit (F7.3, F7.8, F7.9). */
export function confirmPrescription(d: UserData, rx: ExtractedPrescription, today: IsoDate, now: string) {
  const prescriptionId = newId('rx_');
  d.prescriptions.push({ id: prescriptionId, date: rx.date, doctor: rx.doctor, fileKeys: rx.fileKeys, confirmedAt: now });
  for (const m of rx.medicines) {
    d.medicines.push({ ...m, id: newId('med_'), prescriptionId, startDate: today, active: true });
  }
  if (rx.doctorInstruction) {
    const instr = rx.doctorInstruction;
    const dh = { id: newId('dh_'), text: instr.text, question: instr.question, conflictKeys: instr.conflictKeys };
    d.doctorHabits.push(dh);
    const plan = d.plans.find((p) => p.status === 'active');
    if (plan) {
      // Doctor habits replace any app habit they conflict with (F4.5).
      plan.habits = plan.habits.filter((h) => !(h.habitId && instr.conflictKeys.includes(habitById(h.habitId)?.conflictKey ?? '')));
      plan.habits.push({ id: `doc_${dh.id}`, source: 'doctor', title: dh.text, question: dh.question, committed: true });
    }
  }
  if (rx.followUp) d.appointments.push({ id: newId('appt_'), dateTime: rx.followUp, doctor: rx.doctor });
}
