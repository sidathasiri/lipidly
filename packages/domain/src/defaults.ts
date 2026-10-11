import type { ReminderSettings, UserData } from './types';

export const DEFAULT_REMINDERS: ReminderSettings = {
  checkInEnabled: true,
  checkInTime: '20:00',
  habitNudges: true,
  meals: false,
  retest: true,
  weeklySummary: true,
  comeBack: true,
  quietStart: '22:00',
  quietEnd: '07:00',
};

export const emptyUserData = (): UserData => ({
  onboarded: false,
  reports: [],
  plans: [],
  doctorHabits: [],
  ownHabits: [],
  checkIns: {},
  prescriptions: [],
  medicines: [],
  doses: [],
  appointments: [],
  escalations: [],
  mealPlans: [],
  shoppingChecked: {},
  reminders: { ...DEFAULT_REMINDERS },
});

/** Random record ID; unique enough per user without a server round trip (works offline). */
export const newId = (prefix = ''): string =>
  `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/** A deep copy safe for these plain JSON records (Hermes has no structuredClone). */
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
