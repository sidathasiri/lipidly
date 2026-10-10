import { daysBetween, type IsoDate } from '@lipidly/rules';
import { today } from '@/state/ids';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const parts = (d: IsoDate) => {
  const [y, m, day] = d.slice(0, 10).split('-').map(Number) as [number, number, number];
  const wd = new Date(Date.UTC(y, m - 1, day)).getUTCDay();
  return { y, m, day, wd };
};

/** 22 Sep 2026 */
export const fmtDate = (d: IsoDate) => {
  const p = parts(d);
  return `${p.day} ${MONTHS[p.m - 1]} ${p.y}`;
};
/** 22 Sep */
export const fmtDayMonth = (d: IsoDate) => {
  const p = parts(d);
  return `${p.day} ${MONTHS[p.m - 1]}`;
};
/** Tue 15 Dec */
export const fmtWeekdayDate = (d: IsoDate) => {
  const p = parts(d);
  return `${DAYS[p.wd]} ${p.day} ${MONTHS[p.m - 1]}`;
};
/** Saturday, 10 October */
export const fmtLongDate = (d: IsoDate) => {
  const p = parts(d);
  return `${DAYS_LONG[p.wd]}, ${p.day} ${MONTHS_LONG[p.m - 1]}`;
};
/** SEP */
export const fmtMonthShort = (d: IsoDate) => MONTHS[parts(d).m - 1]!.toUpperCase();
/** Jun */
export const fmtMonth = (d: IsoDate) => MONTHS[parts(d).m - 1]!;
/** October 2026 */
export const fmtMonthYear = (d: IsoDate) => {
  const p = parts(d);
  return `${MONTHS_LONG[p.m - 1]} ${p.y}`;
};
export const dayOfMonth = (d: IsoDate) => parts(d).day;

/** "21:00" → "9:00 pm" */
export const fmtTime = (t: string) => {
  const [h, m] = t.split(':').map(Number) as [number, number];
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
};

export const daysUntil = (d: IsoDate) => daysBetween(today(), d);

export const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const firstName = (name?: string) => (name ?? '').trim().split(/\s+/)[0] ?? '';

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
