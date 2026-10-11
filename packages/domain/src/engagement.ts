import {
  addDays,
  habitById,
  habitLevel,
  levelOffer,
  milestonesReached,
  RULESET,
  streaks,
  weeklyGoal,
  weeklyHabit,
  weekOf,
  WEEKLY_GOALS,
  type Difficulty,
  type IsoDate,
  type MatchProfile,
  type MilestoneId,
  type WeeklyGoal,
} from '@lipidly/rules';
import { activePlan, openEscalation } from './plans';
import type { Plan, PlanHabit, UserData } from './types';

/**
 * Keeping the plan fresh between tests (spec F14), on top of the rule engine: levels, the habit of
 * the week, the weekly bonus goal, milestones and weekly "how did it feel?" ratings.
 */

const matchProfile = (d: UserData): MatchProfile | undefined =>
  d.profile ? { smokes: d.profile.smokes, alcohol: d.profile.alcohol, lifestyle: d.profile.lifestyle } : undefined;

const doctorKeys = (d: UserData) => d.doctorHabits.flatMap((h) => h.conflictKeys);

/** Weekly extras only run alongside an active plan the app guides (not during a doctor escalation). */
const guidedPlan = (d: UserData): Plan | undefined => {
  const plan = activePlan(d);
  return plan && !plan.escalationId && !openEscalation(d) ? plan : undefined;
};

// ── Levels ────────────────────────────────────────────────────────────────────

export const levelOf = (ph: PlanHabit) => ph.level ?? 1;

/** Offer for a core habit: a harder level, an easier one, or none (respects "not yet"). */
export function levelOfferFor(d: UserData, ph: PlanHabit, today: IsoDate): 'up' | 'down' | undefined {
  const plan = guidedPlan(d);
  const habit = ph.habitId ? habitById(ph.habitId) : undefined;
  const user = matchProfile(d);
  if (!plan || !habit || !user || ph.source !== 'app' || !ph.committed) return undefined;
  const snoozed = d.snoozedOffers?.[ph.id];
  if (snoozed && snoozed > today) return undefined;
  // The latest "how did it feel?": this week's, else last week's.
  const lastRating = d.reflections?.[weekOf(today)]?.[ph.id] ?? d.reflections?.[addDays(weekOf(today), -7)]?.[ph.id];
  return levelOffer({
    habit,
    level: levelOf(ph),
    levelSince: ph.levelSince ?? plan.startDate,
    planHabitId: ph.id,
    checkIns: Object.values(d.checkIns),
    user,
    today,
    lastRating,
  });
}

/** Moves a core habit one level up or down; title and question follow. Returns false if not allowed. */
export function setHabitLevel(d: UserData, planId: string, planHabitId: string, level: number, today: IsoDate): boolean {
  const ph = d.plans.find((p) => p.id === planId)?.habits.find((h) => h.id === planHabitId);
  const habit = ph?.habitId ? habitById(ph.habitId) : undefined;
  if (!ph || !habit || ph.source !== 'app') return false;
  const max = 1 + (habit.levelUps?.length ?? 0);
  if (level < 1 || level > max || Math.abs(level - levelOf(ph)) !== 1) return false;
  const text = habitLevel(habit, level);
  ph.level = level;
  ph.levelSince = today;
  ph.title = text.shortTitle;
  ph.question = text.question;
  if (d.snoozedOffers?.[ph.id]) {
    const rest = { ...d.snoozedOffers };
    delete rest[ph.id];
    d.snoozedOffers = rest;
  }
  return true;
}

/** "Not yet": hides a level offer for a week. */
export function snoozeOffer(d: UserData, planHabitId: string, today: IsoDate) {
  d.snoozedOffers = { ...d.snoozedOffers, [planHabitId]: addDays(today, 7) };
}

// ── Habit of the week ─────────────────────────────────────────────────────────

/** This week's rotating habit, shaped like a plan habit (ID per week, so answers stay with their week). */
export function weeklyHabitFor(d: UserData, today: IsoDate): PlanHabit | undefined {
  const plan = guidedPlan(d);
  const user = matchProfile(d);
  if (!plan || !user) return undefined;
  const week = weekOf(today);
  const habit = weeklyHabit({
    focus: plan.focusGroup,
    user,
    coreHabitIds: plan.habits.flatMap((h) => (h.habitId ? [h.habitId] : [])),
    doctorConflictKeys: doctorKeys(d),
    weekStart: week,
    seed: plan.id,
  });
  return habit ? { id: `wk_${week}`, source: 'weekly', habitId: habit.id, title: habit.shortTitle, question: habit.question, committed: true } : undefined;
}

/** Room to keep the habit of the week as a core habit. */
export const canAdoptWeekly = (plan: Plan) => plan.habits.filter((h) => h.source === 'app' && h.committed).length < RULESET.plan.maxAppHabits;

/** Keeps a library habit (this week's) as a committed core habit. */
export function adoptHabit(d: UserData, planId: string, habitId: string, newPlanHabitId: string, today: IsoDate): boolean {
  const plan = d.plans.find((p) => p.id === planId);
  const habit = habitById(habitId);
  if (!plan || !habit || plan.status !== 'active' || !canAdoptWeekly(plan) || plan.habits.some((h) => h.habitId === habitId)) return false;
  plan.habits.push({ id: newPlanHabitId, source: 'app', habitId: habit.id, title: habit.shortTitle, question: habit.question, committed: true, level: 1, levelSince: today });
  return true;
}

// ── Weekly bonus goal ─────────────────────────────────────────────────────────

export function weeklyGoalFor(d: UserData, today: IsoDate): { goal: WeeklyGoal; count: number; week: IsoDate } | undefined {
  const plan = guidedPlan(d);
  const user = matchProfile(d);
  if (!plan || !user) return undefined;
  const week = weekOf(today);
  // Once started, a week's goal never changes, even if preferences do.
  const saved = d.weeklyGoals?.[week];
  const savedGoal = saved && WEEKLY_GOALS.find((g) => g.id === saved.goalId);
  if (savedGoal) return { goal: savedGoal, count: saved.count, week };
  const diet = d.profile?.food?.dietType ?? 'everything';
  const goal = weeklyGoal({
    focus: plan.focusGroup,
    user,
    diet: { eatsFish: diet === 'everything' || diet === 'pescatarian', eatsMeat: diet === 'everything' },
    weekStart: week,
    seed: plan.id,
  });
  return goal ? { goal, count: 0, week } : undefined;
}

/** +1 (or −1) on this week's goal, kept between 0 and the target. */
export function stepWeeklyGoal(d: UserData, today: IsoDate, delta: 1 | -1) {
  const current = weeklyGoalFor(d, today);
  if (!current) return;
  const count = Math.max(0, Math.min(current.goal.target, current.count + delta));
  d.weeklyGoals = { ...d.weeklyGoals, [current.week]: { goalId: current.goal.id, count } };
}

// ── Weekly ratings ────────────────────────────────────────────────────────────

export function rateHabit(d: UserData, today: IsoDate, planHabitId: string, rating: Difficulty) {
  const week = weekOf(today);
  d.reflections = { ...d.reflections, [week]: { ...d.reflections?.[week], [planHabitId]: rating } };
}

export const ratingFor = (d: UserData, today: IsoDate, planHabitId: string): Difficulty | undefined => d.reflections?.[weekOf(today)]?.[planHabitId];

// ── Milestones ────────────────────────────────────────────────────────────────

export const MILESTONE_TEXT: Record<MilestoneId, { title: string; body: string }> = {
  firstCheckIn: { title: 'Your first check-in!', body: 'Every day you check in builds the picture for your next test.' },
  streak7: { title: 'A 7-day streak!', body: 'A full week of check-ins. Habits are taking root.' },
  streak30: { title: '30 days in a row!', body: 'A month of check-ins. That’s how lasting change happens.' },
  halfway: { title: 'Halfway to your retest', body: 'You’re halfway through this plan. Keep going: your next report will show the work.' },
  firstLevelUp: { title: 'First level-up!', body: 'You made a habit harder because it got easy. That’s real progress.' },
  firstGoal: { title: 'Weekly goal done!', body: 'Your first weekly bonus goal is complete.' },
};

const MILESTONE_ORDER: MilestoneId[] = ['streak30', 'firstLevelUp', 'halfway', 'streak7', 'firstGoal', 'firstCheckIn'];

/** Milestones reached and not yet celebrated, most special first. */
export function newMilestones(d: UserData, today: IsoDate): MilestoneId[] {
  const plan = activePlan(d);
  const dates = Object.keys(d.checkIns);
  const reached = milestonesReached({
    checkInDates: dates,
    bestStreak: streaks(dates, today).best,
    planStart: plan?.startDate,
    retestDate: plan?.retestDate,
    today,
    levelUps: d.plans.flatMap((p) => p.habits).filter((h) => (h.level ?? 1) > 1).length,
    goalsCompleted: Object.values(d.weeklyGoals ?? {}).filter((g) => g.count >= (WEEKLY_GOALS.find((x) => x.id === g.goalId)?.target ?? Infinity)).length,
  });
  const seen = new Set(d.celebrated ?? []);
  return MILESTONE_ORDER.filter((m) => reached.includes(m) && !seen.has(m));
}

export function markCelebrated(d: UserData, ids: string[]) {
  d.celebrated = [...new Set([...(d.celebrated ?? []), ...ids])];
}
