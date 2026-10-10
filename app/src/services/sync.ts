import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { applyRecords, type DataRecord } from '@lipidly/domain';
import { getState, isSyncedSession, onOutboxChange, replaceUser, setState, useStore, type OutboxItem } from '@/state/store';
import { ApiError, OfflineError, putRecords, serverOp, syncPage } from './api';

/**
 * Keeps the phone and the server in step. Local changes wait in the outbox and are sent in order;
 * then records changed on the server (by a Lambda or another phone) are pulled and merged.
 * Runs on launch, when the app comes to the foreground, when the connection returns and shortly
 * after each change.
 */

/** Pulls overlap by a few seconds so a write landing during a pull is never missed. */
const OVERLAP_MS = 5000;

/** Merges server records into a user's data, except ones this phone is still sending. */
export function mergeRecords(userId: string, records: DataRecord[]) {
  if (!records.length) return;
  const pending = new Set((getState().outbox[userId] ?? []).flatMap((i) => (i.op === 'putRecords' ? i.records.map((r) => r.sk) : [])));
  replaceUser(userId, (d) => applyRecords(d, records.filter((r) => !pending.has(r.sk))));
  const newest = records.reduce((m, r) => (r.updatedAt && r.updatedAt > m ? r.updatedAt : m), getState().syncedAt[userId] ?? '');
  if (newest) setState({ syncedAt: { ...getState().syncedAt, [userId]: newest } });
}

async function send(item: OutboxItem): Promise<DataRecord[]> {
  if (item.op === 'putRecords') return putRecords(item.records);
  const types: Record<string, string> = { profile: 'AWSJSON!', action: 'AWSJSON!', today: 'AWSDate!' };
  const args = Object.fromEntries(Object.entries(item.variables).map(([k, value]) => [k, { type: types[k]!, value }]));
  return (await serverOp(item.op, args)).records;
}

const dropFirst = (userId: string, id: string) => {
  const { outbox } = getState();
  setState({ outbox: { ...outbox, [userId]: (outbox[userId] ?? []).filter((i) => i.id !== id) } });
};

/** Sends waiting changes, oldest first. Stops at the first connection problem. */
export async function flush(): Promise<boolean> {
  const userId = getState().session?.id;
  if (!userId || !isSyncedSession()) return true;
  for (;;) {
    const item = getState().outbox[userId]?.[0];
    if (!item) return true;
    try {
      const records = await send(item);
      dropFirst(userId, item.id);
      mergeRecords(userId, records);
    } catch (e) {
      if (e instanceof ApiError) {
        // The server refused it (e.g. a rule the phone missed): drop it; the next pull restores the server's copy.
        console.warn('sync: dropped a change the server refused:', e.message);
        dropFirst(userId, item.id);
        continue;
      }
      return false;
    }
  }
}

/** Pulls records changed on the server since the last pull. */
async function pull() {
  const userId = getState().session?.id;
  if (!userId || !isSyncedSession()) return;
  const last = getState().syncedAt[userId];
  const since = last ? new Date(new Date(last).getTime() - OVERLAP_MS).toISOString() : undefined;
  let next: string | undefined;
  do {
    const page = await syncPage(since, next);
    if (getState().session?.id !== userId) return;
    mergeRecords(userId, page.records);
    next = page.nextToken;
  } while (next);
}

let running: Promise<void> | undefined;
let again = false;

/** Flush then pull; concurrent calls share one run (and trigger one more if changes arrived meanwhile). */
export function syncNow(): Promise<void> {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        if (await flush()) await pull();
      } while (again);
    } catch (e) {
      if (!(e instanceof OfflineError)) console.warn('sync failed', e);
    } finally {
      running = undefined;
    }
  })();
  return running;
}

let timer: ReturnType<typeof setTimeout> | undefined;
onOutboxChange(() => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), 1000);
});

/** Mounted once at the root: syncs whenever the signed-in user changes, on foreground and on reconnect. */
export function useSync() {
  const userId = useStore((s) => s.session?.id);
  useEffect(() => {
    void syncNow();
    const app = AppState.addEventListener('change', (s) => s === 'active' && void syncNow());
    let wasOnline = true;
    const net = NetInfo.addEventListener((s) => {
      const online = !!s.isConnected;
      if (online && !wasOnline) void syncNow();
      wasOnline = online;
    });
    return () => {
      app.remove();
      net();
    };
  }, [userId]);
}
