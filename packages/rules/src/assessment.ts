import { addDays, addMonths, ageOn } from './dates';
import { MARKER_LABELS, SEVERITY, higherIsBetter, statusesOf } from './markers';
import { RULESET } from './ruleset';
import type {
  FocusGroup,
  FocusMarker,
  HealthCondition,
  IsoDate,
  MarkerId,
  MarkerValues,
  Mode,
  Profile,
  Sex,
  Status,
} from './types';

// ── Eligibility (F1.6) ────────────────────────────────────────────────────────

export type IneligibleReason = 'under18' | 'pregnant';

export const ineligibleReason = (profile: Pick<Profile, 'dateOfBirth' | 'pregnant'>, today: IsoDate): IneligibleReason | null => {
  if (ageOn(profile.dateOfBirth, today) < RULESET.eligibility.minAge) return 'under18';
  if (profile.pregnant) return 'pregnant';
  return null;
};

// ── Escalation (F11) ──────────────────────────────────────────────────────────

export type EscalationRule = 'triglyceridesVeryHigh' | 'ldlVeryHigh' | 'healthCondition' | 'focusWorsened';

export interface Escalation {
  rule: EscalationRule;
  marker?: MarkerId;
  value?: number;
  conditions?: HealthCondition[];
}

/** Profile-only escalation, run on every profile change. */
export const profileEscalation = (profile: Pick<Profile, 'conditions'>): Escalation | null =>
  profile.conditions.length > 0 ? { rule: 'healthCondition', conditions: [...profile.conditions] } : null;

export interface PreviousCycle {
  focus: FocusMarker | null;
  values: MarkerValues;
  /** Share of expected habit check-ins answered "yes" during the cycle, 0–1. */
  adherence: number;
}

/**
 * Report escalation, run on every confirmed report. Returns the first rule that fires.
 * "Focus worsened" treats a fall in HDL as worsening, since HDL is better when higher.
 */
export const reportEscalation = (
  values: MarkerValues,
  profile: Pick<Profile, 'conditions'>,
  previous?: PreviousCycle,
): Escalation | null => {
  const E = RULESET.escalation;
  if (values.triglycerides !== undefined && values.triglycerides >= E.triglycerides) {
    return { rule: 'triglyceridesVeryHigh', marker: 'triglycerides', value: values.triglycerides };
  }
  if (values.ldl !== undefined && values.ldl >= E.ldl) return { rule: 'ldlVeryHigh', marker: 'ldl', value: values.ldl };

  const fromProfile = profileEscalation(profile);
  if (fromProfile) return fromProfile;

  if (previous?.focus && previous.adherence >= RULESET.mostDaysShare) {
    const before = previous.values[previous.focus];
    const after = values[previous.focus];
    if (before !== undefined && after !== undefined && before > 0) {
      const worsening = (higherIsBetter(previous.focus) ? before - after : after - before) / before;
      if (worsening > E.focusWorsening) return { rule: 'focusWorsened', marker: previous.focus, value: after };
    }
  }
  return null;
};

// ── Focus and mode ────────────────────────────────────────────────────────────

/** Candidates in tie-break order: LDL (or non-HDL when triglycerides are high), triglycerides, HDL. */
const focusCandidates = (values: MarkerValues): FocusMarker[] => {
  const useNonHdl =
    (values.triglycerides !== undefined && values.triglycerides >= RULESET.nonHdlSwitchTriglycerides) || values.ldl === undefined;
  return [useNonHdl ? 'nonHdl' : 'ldl', 'triglycerides', 'hdl'];
};

/** The most severe focus-eligible marker, or `null` when all are in range. Run escalation first. */
export const selectFocus = (values: MarkerValues, sex: Sex): FocusMarker | null => {
  const statuses = statusesOf(values, sex);
  let best: FocusMarker | null = null;
  let bestSeverity = 0;
  for (const m of focusCandidates(values)) {
    const s = statuses[m];
    const severity = s ? SEVERITY[s] : 0;
    if (severity > bestSeverity) {
      best = m;
      bestSeverity = severity;
    }
  }
  return best;
};

export const focusGroupOf = (focus: FocusMarker): FocusGroup =>
  focus === 'ldl' || focus === 'nonHdl' ? 'ldlNonHdl' : focus;

/** Active while any focus-eligible marker is borderline or worse. */
export const modeFor = (focus: FocusMarker | null): Mode => (focus ? 'active' : 'maintenance');

/** One sentence on why this marker was chosen (F3.3). */
export const focusReason = (focus: FocusMarker, status: Status, values: MarkerValues): string => {
  const name = MARKER_LABELS[focus];
  const statusWord = status === 'low' ? 'low' : status === 'borderline' ? 'borderline' : 'high';
  const switched =
    focus === 'nonHdl' && values.triglycerides !== undefined && values.triglycerides >= RULESET.nonHdlSwitchTriglycerides
      ? ' We use non-HDL in place of LDL when triglycerides are high, because it is more reliable then.'
      : '';
  return `${name} is ${statusWord} and the most important result to work on right now.${switched}`;
};

/** Default retest date. A date the doctor gives always replaces it. */
export const defaultRetestDate = (collectionDate: IsoDate, mode: Mode): IsoDate =>
  mode === 'active'
    ? addDays(collectionDate, RULESET.retest.activeWeeks * 7)
    : addMonths(collectionDate, RULESET.retest.maintenanceMonths);
