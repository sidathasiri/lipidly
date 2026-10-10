import {
  defaultRetestDate,
  focusGroupOf,
  focusReason,
  modeFor,
  reportEscalation,
  selectFocus,
  type Escalation,
} from './assessment';
import { MARKER_LABELS, SEVERITY, STATUS_LABELS, higherIsBetter, percentChange, statusOf, statusesOf } from './markers';
import { RULESET } from './ruleset';
import type { FocusGroup, FocusMarker, IsoDate, MarkerId, MarkerValues, Mode, Profile, Status } from './types';

export type PlanDecision =
  | 'initial'
  | 'keep'
  | 'newFocus'
  | 'maintenance'
  | 'noImprovementKept'
  | 'noImprovementNotKept'
  | 'backToActive';

export interface PreviousPlan {
  focus: FocusMarker | null;
  mode: Mode;
  appHabitIds: string[];
  /** Confirmed values of the report the previous plan came from. */
  values: MarkerValues;
  /** Share of expected habit check-ins answered "yes" during the cycle, 0–1. */
  adherence: number;
}

/** How the caller should choose habits for the new plan. Habit selection itself is `proposeHabits`. */
export interface HabitStrategy {
  /** Carry these app habits over unchanged. */
  keepHabitIds?: string[];
  count: number;
  easierOnly: boolean;
  /** Leave these out (e.g. offer different habits after no improvement). */
  excludeHabitIds: string[];
}

export type ReportOutcome =
  | { kind: 'escalation'; escalation: Escalation; statuses: Partial<Record<MarkerId, Status>> }
  | {
      kind: 'plan';
      decision: PlanDecision;
      focus: FocusMarker | null;
      focusGroup: FocusGroup | null;
      mode: Mode;
      retestDate: IsoDate;
      statuses: Partial<Record<MarkerId, Status>>;
      /** One sentence for Results and the plan proposal ("What changed"). */
      summary: string;
      /** Suggest discussing the result with a doctor (no improvement despite keeping habits). */
      suggestDoctor: boolean;
      habits: HabitStrategy;
      ruleSetVersion: string;
    };

export interface AssessInput {
  values: MarkerValues;
  collectionDate: IsoDate;
  profile: Pick<Profile, 'sex' | 'conditions'>;
  previous?: PreviousPlan;
}

/** "Improved" = a better band, or moved the right way by at least 10% (spec: "Updating the plan"). */
export const improved = (marker: FocusMarker, before: number, after: number, sex: Profile['sex']): boolean => {
  const sb = statusOf(marker, before, sex);
  const sa = statusOf(marker, after, sex);
  if (sb && sa && SEVERITY[sa] < SEVERITY[sb]) return true;
  const change = (after - before) / before;
  return higherIsBetter(marker) ? change >= RULESET.improvedShare : -change >= RULESET.improvedShare;
};

const unitText = (m: MarkerId) => (m === 'tcHdlRatio' ? '' : ' mg/dL');

/** "Triglycerides went from 342 to 286 mg/dL, down 16%." Describes the change; never claims a cause. */
export const describeChange = (marker: MarkerId, before: number, after: number): string => {
  const pct = percentChange(before, after);
  const tail = pct === 0 ? 'no change' : `${pct < 0 ? 'down' : 'up'} ${Math.abs(pct)}%`;
  return `${MARKER_LABELS[marker]} went from ${before} to ${after}${unitText(marker)}, ${tail}.`;
};

/**
 * Runs on every confirmed report. Decides escalation, focus, mode, retest date and how to pick habits.
 * The same inputs always give the same outcome.
 */
export const assessReport = ({ values, collectionDate, profile, previous }: AssessInput): ReportOutcome => {
  const statuses = statusesOf(values, profile.sex);
  const escalation = reportEscalation(
    values,
    profile,
    previous && { focus: previous.focus, values: previous.values, adherence: previous.adherence },
  );
  if (escalation) return { kind: 'escalation', escalation, statuses };

  const fresh = selectFocus(values, profile.sex);
  const base = { statuses, ruleSetVersion: RULESET.version, suggestDoctor: false };
  const make = (
    decision: PlanDecision,
    focus: FocusMarker | null,
    summary: string,
    habits: Partial<HabitStrategy> = {},
    suggestDoctor = false,
  ): ReportOutcome => {
    const mode = modeFor(focus);
    return {
      ...base,
      kind: 'plan',
      decision,
      focus,
      focusGroup: focus ? focusGroupOf(focus) : null,
      mode,
      retestDate: defaultRetestDate(collectionDate, mode),
      summary,
      suggestDoctor,
      habits: {
        count: mode === 'maintenance' ? 2 : RULESET.plan.defaultHabits,
        easierOnly: false,
        excludeHabitIds: [],
        ...habits,
      },
    };
  };

  if (!previous) {
    if (!fresh) return make('initial', null, 'All your results are in range. You can choose one or two habits to keep.');
    return make('initial', fresh, focusReason(fresh, statuses[fresh]!, values));
  }

  if (!fresh) return make('maintenance', null, 'All your results are in range. You can choose one or two habits to keep.');

  const prev = previous.focus;
  if (!prev || previous.mode === 'maintenance') {
    return make('backToActive', fresh, `${MARKER_LABELS[fresh]} has moved out of range, so your plan is active again.`);
  }

  const before = previous.values[prev];
  const after = values[prev];
  const prevStatus = after !== undefined ? statusOf(prev, after, profile.sex) : undefined;

  if (after === undefined || before === undefined || prevStatus === 'inRange') {
    const lead = after !== undefined && before !== undefined ? `${describeChange(prev, before, after)} ` : '';
    return make('newFocus', fresh, `${lead}${MARKER_LABELS[prev]} is in range now, so your plan moves on to ${MARKER_LABELS[fresh]}.`);
  }

  const change = describeChange(prev, before, after);
  const statusWord = STATUS_LABELS[prevStatus!].toLowerCase();
  if (improved(prev, before, after, profile.sex)) {
    return make('keep', prev, `${change} Still ${statusWord}, so the focus stays the same.`, {
      keepHabitIds: previous.appHabitIds,
    });
  }
  if (previous.adherence >= RULESET.mostDaysShare) {
    return make(
      'noImprovementKept',
      prev,
      `${change} You kept your habits on most days, so it is worth talking to your doctor about this result. Here are some different habits to try.`,
      { excludeHabitIds: previous.appHabitIds },
      true,
    );
  }
  return make(
    'noImprovementNotKept',
    prev,
    `${change} Let’s start with two easier habits that fit your days.`,
    { count: RULESET.plan.reducedHabits, easierOnly: true },
  );
};
