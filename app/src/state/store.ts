import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Account, UserData } from './types';

export const DEFAULT_REMINDERS: UserData['reminders'] = {
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
  checkIns: {},
  prescriptions: [],
  medicines: [],
  doses: [],
  appointments: [],
  escalations: [],
  reminders: { ...DEFAULT_REMINDERS },
});

interface MockAccount extends Account {
  password?: string;
}

interface StoreState {
  /** Mock auth registry, keyed by lower-case email. Replaced by Cognito later. */
  accounts: Record<string, MockAccount>;
  sessionUserId?: string;
  /** Pending email verification. */
  pendingEmail?: string;
  data: Record<string, UserData>;
  /** Welcome slides seen on this device. */
  seenWelcome: boolean;
}

/**
 * Local persisted store standing in for the backend. Screens read it through the hooks in
 * `hooks.ts` and change it only through `actions/`, which become AppSync calls later.
 */
export const useStore = create<StoreState>()(
  persist(
    (): StoreState => ({ accounts: {}, data: {}, seenWelcome: false }),
    {
      name: 'lipidly-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      version: 1,
    },
  ),
);

export const getState = useStore.getState;
export const setState = useStore.setState;

/** Applies a change to the signed-in user's data. */
export const updateUser = (fn: (d: UserData) => UserData | void) => {
  const { sessionUserId, data } = getState();
  if (!sessionUserId) return;
  const current = data[sessionUserId] ?? emptyUserData();
  const draft: UserData = JSON.parse(JSON.stringify(current));
  const next = fn(draft) ?? draft;
  setState({ data: { ...data, [sessionUserId]: next } });
};

export const currentUserData = (): UserData => {
  const { sessionUserId, data } = getState();
  return (sessionUserId && data[sessionUserId]) || emptyUserData();
};

export type { MockAccount, StoreState };
