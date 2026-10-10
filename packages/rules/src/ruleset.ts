import type { MarkerId, Sex } from './types';

/**
 * Every threshold the rule engine uses. All values are drafts awaiting clinical review
 * (spec: "Plan logic"). Plans record `version` so any plan can be explained later.
 */
export const RULESET = {
  version: 'rules-v1-draft',

  /** Lower bound (mg/dL) of each band. A value below `borderline` is in range. */
  bands: {
    ldl: { borderline: 130, high: 160, veryHigh: 190 },
    nonHdl: { borderline: 160, high: 190, veryHigh: 220 },
    triglycerides: { borderline: 150, high: 200, veryHigh: 500 },
    totalCholesterol: { borderline: 200, high: 240 },
  } as Record<string, { borderline: number; high: number; veryHigh?: number }>,

  /** HDL under this value is low. The reviewer may raise the cut-off for women. */
  hdlLow: { male: 40, female: 40, other: 40 } satisfies Record<Sex, number>,

  /** Use non-HDL in place of LDL for focus when triglycerides are at or above this. */
  nonHdlSwitchTriglycerides: 200,

  escalation: {
    triglycerides: 500,
    ldl: 190,
    /** A focus marker worsening by more than this share while habits were kept. */
    focusWorsening: 0.2,
  },

  /** "Improved" = better band, or moved the right way by at least this share. */
  improvedShare: 0.1,
  /** "Most days" = this share of expected check-ins or more. */
  mostDaysShare: 0.7,

  retest: { activeWeeks: 12, maintenanceMonths: 6, maintenanceMaxMonths: 12 },

  consistency: {
    friedewaldTolerance: 10,
    friedewaldMaxTriglycerides: 400,
    nonHdlTolerance: 2,
    maxReportAgeDays: 365,
    /** Plausible values in mg/dL (ratio is unitless). */
    plausible: {
      totalCholesterol: [50, 700],
      ldl: [10, 500],
      hdl: [5, 150],
      triglycerides: [20, 5000],
      nonHdl: [20, 650],
      vldl: [2, 400],
      tcHdlRatio: [1, 20],
    } satisfies Record<MarkerId, [number, number]>,
  },

  plan: { maxAppHabits: 3, defaultHabits: 3, reducedHabits: 2, swapIntervalDays: 14 },
  checkIn: { backfillDays: 2 },
  eligibility: { minAge: 18 },
} as const;

export type RuleSet = typeof RULESET;
