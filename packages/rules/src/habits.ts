import { addDays, daysBetween } from './dates';
import { HABIT_LIBRARY, type Habit } from './habit-library';
import { RULESET } from './ruleset';
import type { FocusGroup, IsoDate, LifestyleAnswers, Profile, TimeFree } from './types';

export type MatchProfile = Pick<Profile, 'smokes' | 'alcohol'> & { lifestyle: LifestyleAnswers };

/** Most minutes a habit may take for each "free time" answer. */
const MAX_MINUTES: Record<TimeFree, number> = { under15: 14, '15to30': 30, over30: Infinity };

/** True when the user's answers meet every one of the habit's needs (spec: "Matching rules"). */
export const fitsUser = (habit: Habit, user: MatchProfile): boolean => {
  const { needs } = habit;
  const l = user.lifestyle;
  if (needs.minutes > MAX_MINUTES[l.timeFree]) return false;
  if (needs.places && !needs.places.some((p) => l.places.includes(p))) return false;
  if (needs.equipment && !needs.equipment.some((e) => l.equipment.includes(e))) return false;
  if (needs.controlsMeals && l.cooks !== 'self') return false;
  if (needs.eatsOut && l.eatsOut === 'rarely') return false;
  if (needs.smoker && user.smokes === 'never') return false;
  if (needs.drinker && user.alcohol === 'never') return false;
  if (habit.category === 'activity') {
    if (l.physicalLimit === 'doctorLimited') return false;
    if (l.physicalLimit === 'pain' && needs.effort !== 'gentle') return false;
  }
  return true;
};

/** "Needs" chips for Habit detail, e.g. "No extra time", "No equipment", "Works if someone else cooks". */
export const needsLabels = (habit: Habit): string[] => {
  const { needs } = habit;
  const labels = [needs.minutes === 0 ? 'No extra time' : `${needs.minutes} min`];
  labels.push(needs.equipment ? 'Some equipment' : 'No equipment');
  if (habit.category === 'food') labels.push(needs.controlsMeals ? 'You cook' : 'Works if someone else cooks');
  return labels;
};

/** True when a gentle-only option should carry "ask your doctor first" advice. */
export const needsDoctorAdvice = (habit: Habit, user: MatchProfile): boolean =>
  habit.category === 'activity' && user.lifestyle.physicalLimit === 'pain';

const isEasyFood = (h: Habit): boolean => h.category === 'food' && h.needs.minutes === 0 && !h.needs.equipment;

export interface ProposeOptions {
  focus: FocusGroup;
  user: MatchProfile;
  /** Conflict keys covered by the user's doctor habits; matching app habits are left out. */
  doctorConflictKeys?: string[];
  /** How many app habits to propose. Defaults to 3; the "rarely kept" rule asks for 2 easier ones. */
  count?: number;
  /** Only effortless food habits (the "cut to two easier habits" rule). */
  easierOnly?: boolean;
  /** Habit IDs to leave out, such as the ones a user just swapped away. */
  exclude?: string[];
  library?: Habit[];
}

/**
 * Proposes app habits for a focus: at most one activity habit, the rest from food and lifestyle,
 * in library priority order. Fills with effortless food habits from any focus when fewer fit.
 */
export const proposeHabits = ({
  focus,
  user,
  doctorConflictKeys = [],
  count = RULESET.plan.defaultHabits,
  easierOnly = false,
  exclude = [],
  library = HABIT_LIBRARY,
}: ProposeOptions): Habit[] => {
  const n = Math.min(count, RULESET.plan.maxAppHabits);
  const usable = (h: Habit) =>
    !exclude.includes(h.id) &&
    !(h.conflictKey && doctorConflictKeys.includes(h.conflictKey)) &&
    fitsUser(h, user) &&
    (!easierOnly || isEasyFood(h));

  const forFocus = library.filter((h) => h.focus.includes(focus) && usable(h));
  const activity = forFocus.find((h) => h.category === 'activity');
  const others = forFocus.filter((h) => h.category !== 'activity');

  const picked: Habit[] = [];
  if (activity && n >= 3) picked.push(activity);
  for (const h of others) if (picked.length < n) picked.push(h);
  if (activity && !picked.includes(activity) && picked.length < n) picked.push(activity);
  for (const h of library) {
    if (picked.length >= n) break;
    if (!picked.includes(h) && isEasyFood(h) && usable(h)) picked.push(h);
  }
  return picked.sort((a, b) => library.indexOf(a) - library.indexOf(b));
};

export interface SwapOption {
  habit: Habit;
  /** Present when the option is shown but cannot be picked. */
  disabledReason?: 'coveredByDoctor';
}

/** Habits for the same focus that fit the user, excluding the ones already in the plan (F4.2, F4.11). */
export const swapOptions = (
  focus: FocusGroup,
  user: MatchProfile,
  currentHabitIds: string[],
  doctorConflictKeys: string[] = [],
  library: Habit[] = HABIT_LIBRARY,
): SwapOption[] =>
  library
    .filter((h) => h.focus.includes(focus) && !currentHabitIds.includes(h.id) && fitsUser(h, user))
    .map((habit) =>
      habit.conflictKey && doctorConflictKeys.includes(habit.conflictKey)
        ? { habit, disabledReason: 'coveredByDoctor' as const }
        : { habit },
    );

/** Mid-cycle swaps are limited to one every two weeks (F4.8). */
export const nextSwapDate = (lastSwap: IsoDate | undefined, today: IsoDate): { allowed: boolean; opensOn?: IsoDate } => {
  if (!lastSwap) return { allowed: true };
  const opensOn = addDays(lastSwap, RULESET.plan.swapIntervalDays);
  return daysBetween(today, opensOn) <= 0 ? { allowed: true } : { allowed: false, opensOn };
};

export const habitById = (id: string, library: Habit[] = HABIT_LIBRARY): Habit | undefined => library.find((h) => h.id === id);
