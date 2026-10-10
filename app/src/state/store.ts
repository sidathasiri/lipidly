import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { clone, CLIENT_WRITABLE, diffRecords, emptyUserData, type DataRecord } from '@lipidly/domain';
import type { Account, UserData } from './types';

export { DEFAULT_REMINDERS, emptyUserData } from '@lipidly/domain';

/** The developer shortcut's local-only account (see dev/devBoot.ts). Never synced. */
export const LOCAL_USER_ID = 'dev-local-user';

/** A change waiting to reach the server: client-writable records, or a server operation. */
export type OutboxItem =
  | { id: string; op: 'putRecords'; records: DataRecord[] }
  | { id: string; op: 'saveProfile' | 'planAction'; variables: Record<string, unknown> };

interface StoreState {
  /** The signed-in Cognito user (`id` = Cognito sub). Tokens themselves are kept by Amplify. */
  session?: Account;
  /** Email waiting for a verification or reset code. */
  pendingEmail?: string;
  data: Record<string, UserData>;
  /** Changes made on this phone not yet on the server, per user, oldest first. */
  outbox: Record<string, OutboxItem[]>;
  /** Server time of the newest record pulled, per user. */
  syncedAt: Record<string, string>;
  /** Welcome slides seen on this device. */
  seenWelcome: boolean;
}

/**
 * The phone's copy of the user's data. Screens read it through the hooks in `hooks.ts` and
 * change it only through `actions/`. Changes apply here at once (offline too) and reach the
 * server through the outbox (services/sync.ts).
 */
export const useStore = create<StoreState>()(
  persist(
    (): StoreState => ({ data: {}, outbox: {}, syncedAt: {}, seenWelcome: false }),
    {
      name: 'lipidly-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      // v2: real Cognito sign-in replaced the mock account list. v3: outbox and sync cursor.
      version: 3,
      migrate: (persisted) => {
        const old = (persisted ?? {}) as Partial<StoreState>;
        return { session: old.session, data: old.data ?? {}, outbox: old.outbox ?? {}, syncedAt: old.syncedAt ?? {}, seenWelcome: old.seenWelcome ?? false };
      },
    },
  ),
);

export const getState = useStore.getState;
export const setState = useStore.setState;

const syncs = (session: Account | undefined): session is Account => !!session && session.id !== LOCAL_USER_ID;

let outboxListener: (() => void) | undefined;
/** Called by the sync service so new changes are sent soon after they are made. */
export const onOutboxChange = (fn: () => void) => {
  outboxListener = fn;
};

/** Queues work for the server (merging record writes into a waiting batch). */
export function enqueue(item: OutboxItem) {
  const { session, outbox } = getState();
  if (!syncs(session)) return;
  const queue = [...(outbox[session.id] ?? [])];
  const last = queue[queue.length - 1];
  if (item.op === 'putRecords' && last?.op === 'putRecords') {
    const bySk = new Map(last.records.map((r) => [r.sk, r]));
    for (const r of item.records) bySk.set(r.sk, r);
    queue[queue.length - 1] = { ...last, records: [...bySk.values()] };
  } else {
    queue.push(item);
  }
  setState({ outbox: { ...outbox, [session.id]: queue } });
  outboxListener?.();
}

/**
 * Applies a change to the signed-in user's data. Client-writable records that changed are queued
 * for the server; records the server owns (plans, reports, …) are sent as operations by the actions.
 */
export const updateUser = (fn: (d: UserData) => UserData | void) => {
  const { session, data } = getState();
  if (!session) return;
  const current = data[session.id] ?? emptyUserData();
  const draft = clone(current);
  const next = fn(draft) ?? draft;
  setState({ data: { ...getState().data, [session.id]: next } });
  const { puts, deletes } = diffRecords(current, next);
  const records = [...puts, ...deletes].filter((r) => CLIENT_WRITABLE.has(r.type));
  if (records.length) enqueue({ id: `${Date.now()}`, op: 'putRecords', records });
};

/** Replaces the user's data without queueing anything (used when applying server records). */
export const replaceUser = (userId: string, fn: (d: UserData) => void) => {
  const { data } = getState();
  const next = clone(data[userId] ?? emptyUserData());
  fn(next);
  setState({ data: { ...data, [userId]: next } });
};

export const currentUserData = (): UserData => {
  const { session, data } = getState();
  return (session && data[session.id]) || emptyUserData();
};

/** True when changes for this session go to the server (false for the local developer account). */
export const isSyncedSession = () => syncs(getState().session);

export type { StoreState };
