import type { IsoDate } from './types';

const DAY_MS = 86_400_000;

const toUtc = (d: IsoDate): number => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, day);
};

const fromUtc = (ms: number): IsoDate => new Date(ms).toISOString().slice(0, 10);

export const addDays = (d: IsoDate, days: number): IsoDate => fromUtc(toUtc(d) + days * DAY_MS);

export const addMonths = (d: IsoDate, months: number): IsoDate => {
  const [y, m, day] = d.split('-').map(Number) as [number, number, number];
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  return fromUtc(target.getTime());
};

/** Whole days from `a` to `b` (positive when `b` is later). */
export const daysBetween = (a: IsoDate, b: IsoDate): number => Math.round((toUtc(b) - toUtc(a)) / DAY_MS);

/** 0 = Sunday … 6 = Saturday. */
export const weekday = (d: IsoDate): number => new Date(toUtc(d)).getUTCDay();

/** Sunday that starts the week containing `d` (the design uses Sunday-first weeks). */
export const startOfWeek = (d: IsoDate): IsoDate => addDays(d, -weekday(d));

export const ageOn = (dateOfBirth: IsoDate, on: IsoDate): number => {
  const [by, bm, bd] = dateOfBirth.split('-').map(Number) as [number, number, number];
  const [y, m, d] = on.split('-').map(Number) as [number, number, number];
  return y - by - (m < bm || (m === bm && d < bd) ? 1 : 0);
};
