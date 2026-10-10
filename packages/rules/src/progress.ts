import { addDays, daysBetween, startOfWeek } from './dates';
import { RULESET } from './ruleset';
import type { IsoDate } from './types';

export interface CheckInRecord {
  date: IsoDate;
  /** Answer per plan habit ID: true = kept. */
  answers: Record<string, boolean>;
}

/** A missed check-in can be filled in for the previous two days (F5.3). */
export const canEditCheckIn = (date: IsoDate, today: IsoDate): boolean => {
  const age = daysBetween(date, today);
  return age >= 0 && age <= RULESET.checkIn.backfillDays;
};

/**
 * Streaks count check-in days, not habits kept. A run is still "now" when today's
 * check-in is not done yet, so the count never drops during the day.
 */
export const streaks = (dates: IsoDate[], today: IsoDate): { current: number; best: number } => {
  const set = new Set(dates);
  let current = 0;
  let day = set.has(today) ? today : addDays(today, -1);
  while (set.has(day)) {
    current++;
    day = addDays(day, -1);
  }
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: IsoDate | undefined;
  for (const d of sorted) {
    run = prev && daysBetween(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return { current, best };
};

export type DayState = 'done' | 'missed' | 'today' | 'future';

/** Sunday-to-Saturday dots for the Home week view and the check-in done screen. */
export const weekDots = (dates: IsoDate[], today: IsoDate): { date: IsoDate; state: DayState }[] => {
  const set = new Set(dates);
  const start = startOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    const state: DayState = set.has(date) ? 'done' : date === today ? 'today' : date > today ? 'future' : 'missed';
    return { date, state };
  });
};

export type MonthCellState = 'all' | 'most' | 'some' | 'missed' | 'today' | 'future';

/**
 * Shading for one month-view cell, by share of habits kept that day.
 * A check-in with nothing kept still shows as "some": the user checked in.
 */
export const monthCellState = (record: CheckInRecord | undefined, date: IsoDate, today: IsoDate): MonthCellState => {
  if (!record) return date === today ? 'today' : date > today ? 'future' : 'missed';
  const answers = Object.values(record.answers);
  const kept = answers.filter(Boolean).length;
  if (answers.length > 0 && kept === answers.length) return 'all';
  if (answers.length > 0 && kept / answers.length >= 0.5) return 'most';
  return 'some';
};

/**
 * Share of expected habit check-ins answered "yes" between `from` and `to` (inclusive), 0–1.
 * Days without a check-in count as not kept. Drives "kept on most days" (≥ 70%).
 */
export const adherence = (
  checkIns: CheckInRecord[],
  habitIds: string[],
  from: IsoDate,
  to: IsoDate,
  checkInsPerWeek = 7,
): number => {
  const days = daysBetween(from, to) + 1;
  if (days <= 0 || habitIds.length === 0) return 0;
  const expected = Math.max(1, Math.round((days * checkInsPerWeek) / 7)) * habitIds.length;
  let kept = 0;
  for (const c of checkIns) {
    if (c.date < from || c.date > to) continue;
    for (const id of habitIds) if (c.answers[id]) kept++;
  }
  return Math.min(1, kept / expected);
};

/** Weekly summary: days checked in, and how many days each habit was kept (F5.4). */
export const weeklySummary = (checkIns: CheckInRecord[], habitIds: string[], weekStart: IsoDate) => {
  const weekEnd = addDays(weekStart, 6);
  const inWeek = checkIns.filter((c) => c.date >= weekStart && c.date <= weekEnd);
  const keptDays: Record<string, number> = Object.fromEntries(habitIds.map((id) => [id, 0]));
  for (const c of inWeek) for (const id of habitIds) if (c.answers[id]) keptDays[id] = (keptDays[id] ?? 0) + 1;
  return { daysCheckedIn: inWeek.length, keptDays };
};
