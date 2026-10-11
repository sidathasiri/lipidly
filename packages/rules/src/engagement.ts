import { addDays, daysBetween, startOfWeek } from './dates';
import { HABIT_LIBRARY, type Habit, type HabitLevel } from './habit-library';
import { fitsUser, type MatchProfile } from './habits';
import type { CheckInRecord } from './progress';
import type { FocusGroup, IsoDate } from './types';

/**
 * Keeping a plan fresh between lab tests (spec F14): habit levels, a rotating habit of the week,
 * a weekly bonus goal, and milestones. All deterministic, so the phone and the server agree.
 */

// ── Habit levels (F14.1) ──────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'ok' | 'hard';

/** Title, question and minutes for a habit at a level (1 = the habit as written). */
export function habitLevel(habit: Habit, level: number): HabitLevel {
  if (level <= 1 || !habit.levelUps?.length) return { title: habit.title, shortTitle: habit.shortTitle, question: habit.question, minutes: habit.needs.minutes };
  return habit.levelUps[Math.min(level, habit.levelUps.length + 1) - 2]!;
}

export const maxLevel = (habit: Habit) => 1 + (habit.levelUps?.length ?? 0);

/** Days a habit was kept in the 7 days ending `end` (inclusive). */
const keptInWeek = (checkIns: CheckInRecord[], planHabitId: string, end: IsoDate) => {
  const start = addDays(end, -6);
  return checkIns.filter((c) => c.date >= start && c.date <= end && c.answers[planHabitId]).length;
};

const MAX_MINUTES = { under15: 14, '15to30': 30, over30: Infinity } as const;

/** Rules for offering a harder or easier level. */
export const LEVEL_RULES = { minDaysAtLevel: 14, keptDaysForUp: 5, keptDaysForDown: 2, easyMinDays: 7 } as const;

/**
 * Whether to offer the next level ('up'), an easier level ('down'), or nothing.
 * Up: two weeks at this level kept 5+ days each (or rated easy after one such week), and the next
 * level still fits the user's free time. Down: rated hard, or kept 2 days or fewer two weeks running.
 */
export function levelOffer(input: {
  habit: Habit;
  level: number;
  levelSince: IsoDate;
  planHabitId: string;
  checkIns: CheckInRecord[];
  user: MatchProfile;
  today: IsoDate;
  lastRating?: Difficulty;
}): 'up' | 'down' | undefined {
  const { habit, level, levelSince, planHabitId, checkIns, user, today, lastRating } = input;
  const daysAtLevel = daysBetween(levelSince, today);
  const lastWeek = keptInWeek(checkIns, planHabitId, addDays(today, -1));
  const weekBefore = keptInWeek(checkIns, planHabitId, addDays(today, -8));
  if (level > 1 && daysAtLevel >= LEVEL_RULES.easyMinDays && (lastRating === 'hard' || (lastWeek <= LEVEL_RULES.keptDaysForDown && weekBefore <= LEVEL_RULES.keptDaysForDown))) {
    return 'down';
  }
  if (level >= maxLevel(habit)) return undefined;
  const next = habitLevel(habit, level + 1);
  if (next.minutes > MAX_MINUTES[user.lifestyle.timeFree]) return undefined;
  const steady = daysAtLevel >= LEVEL_RULES.minDaysAtLevel && lastWeek >= LEVEL_RULES.keptDaysForUp && weekBefore >= LEVEL_RULES.keptDaysForUp;
  const easy = lastRating === 'easy' && daysAtLevel >= LEVEL_RULES.easyMinDays && lastWeek >= LEVEL_RULES.keptDaysForUp;
  return steady || easy ? 'up' : undefined;
}

// ── Weekly picks ──────────────────────────────────────────────────────────────

/** Small stable hash, so a week's pick is the same everywhere. */
const hash = (s: string) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
};

/** One item for the week, never the same as last week's when there's a choice. */
function pickForWeek<T extends { id: string }>(items: T[], seed: string, weekStart: IsoDate): T | undefined {
  if (items.length === 0) return undefined;
  const at = (w: IsoDate) => items[hash(`${seed}:${w}`) % items.length]!;
  const pick = at(weekStart);
  if (items.length > 1 && pick.id === at(addDays(weekStart, -7)).id) return items[(items.indexOf(pick) + 1) % items.length];
  return pick;
}

export const weekOf = (today: IsoDate) => startOfWeek(today);

// ── Habit of the week (F14.2) ─────────────────────────────────────────────────

/**
 * An extra habit for the week, from the same library: fits the user's lifestyle, helps their focus
 * (or is an effortless food habit), isn't already in the plan and isn't covered by a doctor habit.
 */
export function weeklyHabit(input: {
  focus: FocusGroup | null;
  user: MatchProfile;
  coreHabitIds: string[];
  doctorConflictKeys: string[];
  weekStart: IsoDate;
  seed: string;
  library?: Habit[];
}): Habit | undefined {
  const { focus, user, coreHabitIds, doctorConflictKeys, weekStart, seed, library = HABIT_LIBRARY } = input;
  const candidates = library.filter(
    (h) =>
      !coreHabitIds.includes(h.id) &&
      !(h.conflictKey && doctorConflictKeys.includes(h.conflictKey)) &&
      (focus ? h.focus.includes(focus) : h.category === 'food') &&
      h.timesPerWeek === 7 &&
      fitsUser(h, user),
  );
  return pickForWeek(candidates, seed, weekStart);
}

// ── Weekly bonus goal (F14.3) ─────────────────────────────────────────────────

export interface WeeklyGoal {
  id: string;
  title: string;
  detail: string;
  /** Times to tick it off during the week. */
  target: number;
  focus: FocusGroup[];
  /** Where the goal's card links to. */
  link?: 'meals' | 'learn';
  needs?: { cooks?: boolean; eatsFish?: boolean; eatsMeat?: boolean; eatsOut?: boolean; active?: boolean };
}

const ALL: FocusGroup[] = ['triglycerides', 'ldlNonHdl', 'hdl'];

export const WEEKLY_GOALS: WeeklyGoal[] = [
  { id: 'cook-meal-ideas', title: 'Cook 3 of your meal ideas', detail: 'Pick any three from your week of meals.', target: 3, focus: ALL, link: 'meals', needs: { cooks: true } },
  { id: 'oily-fish-twice', title: 'Oily fish twice this week', detail: 'Sardines, mackerel, salmon or tuna, grilled or in a curry.', target: 2, focus: ALL, link: 'meals', needs: { eatsFish: true } },
  { id: 'new-vegetable', title: 'Try a vegetable you rarely eat', detail: 'Snake gourd, kankun, drumstick, okra or something new from the market.', target: 1, focus: ALL },
  { id: 'meat-free-days', title: 'Two meat-free days', detail: 'Dhal, chickpeas, beans or fish in place of meat.', target: 2, focus: ['ldlNonHdl', 'triglycerides'], needs: { eatsMeat: true } },
  { id: 'pulses-three-days', title: 'Pulses on three days', detail: 'Dhal, chickpeas, mung or beans: soluble fibre for LDL.', target: 3, focus: ['ldlNonHdl'] },
  { id: 'sweet-free-weekend', title: 'A sweet-free weekend', detail: 'No sweets, cakes or sweet drinks on Saturday and Sunday.', target: 2, focus: ['triglycerides'] },
  { id: 'fruit-not-dessert', title: 'Fruit instead of dessert on four days', detail: 'Papaya, guava, orange or a small banana.', target: 4, focus: ['triglycerides', 'ldlNonHdl'] },
  { id: 'home-lunch', title: 'Take a home-cooked lunch three times', detail: 'Rice, two vegetables and a protein travels well.', target: 3, focus: ALL, needs: { eatsOut: true } },
  { id: 'longer-walk', title: 'One longer walk at the weekend', detail: 'Twice your usual walk, at an easy pace.', target: 1, focus: ['hdl', 'triglycerides'], needs: { active: true } },
  { id: 'read-learn', title: 'Read two Learn articles', detail: 'Short reads on what your results mean.', target: 2, focus: ALL, link: 'learn' },
];

export function weeklyGoal(input: {
  focus: FocusGroup | null;
  user: MatchProfile;
  diet: { eatsFish: boolean; eatsMeat: boolean };
  weekStart: IsoDate;
  seed: string;
}): WeeklyGoal | undefined {
  const { focus, user, diet, weekStart, seed } = input;
  const l = user.lifestyle;
  const ok = (g: WeeklyGoal) =>
    (!focus || g.focus.includes(focus)) &&
    (!g.needs?.cooks || l.cooks === 'self') &&
    (!g.needs?.eatsFish || diet.eatsFish) &&
    (!g.needs?.eatsMeat || diet.eatsMeat) &&
    (!g.needs?.eatsOut || l.eatsOut !== 'rarely') &&
    (!g.needs?.active || l.physicalLimit === 'none');
  return pickForWeek(WEEKLY_GOALS.filter(ok), seed, weekStart);
}

// ── Milestones (F14.4) ────────────────────────────────────────────────────────

export type MilestoneId = 'firstCheckIn' | 'streak7' | 'streak30' | 'halfway' | 'firstLevelUp' | 'firstGoal';

/** Milestones reached so far (each is celebrated once). */
export function milestonesReached(input: {
  checkInDates: IsoDate[];
  bestStreak: number;
  planStart?: IsoDate;
  retestDate?: IsoDate;
  today: IsoDate;
  levelUps: number;
  goalsCompleted: number;
}): MilestoneId[] {
  const { checkInDates, bestStreak, planStart, retestDate, today, levelUps, goalsCompleted } = input;
  const out: MilestoneId[] = [];
  if (checkInDates.length > 0) out.push('firstCheckIn');
  if (bestStreak >= 7) out.push('streak7');
  if (bestStreak >= 30) out.push('streak30');
  if (planStart && retestDate && daysBetween(planStart, retestDate) > 14 && daysBetween(planStart, today) * 2 >= daysBetween(planStart, retestDate)) out.push('halfway');
  if (levelUps > 0) out.push('firstLevelUp');
  if (goalsCompleted > 0) out.push('firstGoal');
  return out;
}
