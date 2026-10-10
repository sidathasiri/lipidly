import type { IsoDate } from '@lipidly/rules';

export const newId = (prefix = ''): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const pad = (n: number) => String(n).padStart(2, '0');

/** Today's local calendar date. */
export const today = (): IsoDate => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const nowTime = (): string => {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Local date and time, `YYYY-MM-DDTHH:mm`, comparable with stored appointment times. */
export const nowLocal = (): string => `${today()}T${nowTime()}`;
