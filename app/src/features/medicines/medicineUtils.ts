import { addDays, daysBetween } from '@lipidly/rules';
import { today } from '@/state/ids';
import type { DoseEvent, Medicine } from '@/state/types';

/** Days of supply left, from a duration like "30 days". Undefined when the duration isn't a number of days. */
export const daysLeft = (m: Medicine): number | undefined => {
  const n = Number(m.duration.match(/(\d+)\s*day/i)?.[1]);
  if (!n) return undefined;
  return Math.max(0, n - daysBetween(m.startDate, today()));
};

export const endDate = (m: Medicine) => {
  const n = Number(m.duration.match(/(\d+)\s*day/i)?.[1]);
  return n ? addDays(m.startDate, n) : undefined;
};

export interface TodayDose {
  medicine: Medicine;
  time: string;
  event?: DoseEvent;
}

/** Today's scheduled doses with any recorded outcome, in time order. */
export const todaysDoses = (medicines: Medicine[], doses: DoseEvent[]): TodayDose[] => {
  const t = today();
  return medicines
    .filter((m) => m.active)
    .flatMap((m) => m.times.map((time) => ({ medicine: m, time, event: doses.find((d) => d.medicineId === m.id && d.date === t && d.time === time) })))
    .sort((a, b) => a.time.localeCompare(b.time));
};

export const FREQUENCY_TIMES: Record<string, string[]> = {
  'Once daily': ['21:00'],
  'Twice daily': ['08:00', '20:00'],
  'Three times daily': ['08:00', '14:00', '20:00'],
};
