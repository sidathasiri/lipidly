import type { UserData } from './types';

/**
 * How a user's data is stored: one record per item, in their DynamoDB partition (PK = USER#<sub>).
 * The sort key names the record; `data` holds the item as JSON.
 */

export type RecordType =
  | 'SETTINGS'
  | 'CONSENT'
  | 'PROFILE'
  | 'REPORT'
  | 'PLAN'
  | 'DOCHABIT'
  | 'OWNHABIT'
  | 'CHECKIN'
  | 'RX'
  | 'MED'
  | 'DOSE'
  | 'APPT'
  | 'ESC'
  | 'MEALPLAN'
  | 'SHOPPING';

export interface DataRecord {
  sk: string;
  type: RecordType;
  data: unknown;
  /** Soft delete, so sync can tell other phones; purged later by TTL. */
  deleted?: boolean;
  /** Set by the server on every write; sync pulls records newer than the last pull. */
  updatedAt?: string;
}

/**
 * Records the phone may write directly (simple user choices). Everything else is written only
 * by a Lambda, because it comes from the rule engine or the AI: profile (escalation), reports,
 * plans, doctor habits, prescriptions, escalations and meal plans.
 */
export const CLIENT_WRITABLE: ReadonlySet<RecordType> = new Set(['SETTINGS', 'CONSENT', 'OWNHABIT', 'CHECKIN', 'MED', 'DOSE', 'APPT', 'SHOPPING']);

export const SK_PREFIX: Record<RecordType, string> = {
  SETTINGS: 'SETTINGS',
  CONSENT: 'CONSENT#',
  PROFILE: 'PROFILE',
  REPORT: 'REPORT#',
  PLAN: 'PLAN#',
  DOCHABIT: 'DOCHABIT#',
  OWNHABIT: 'OWNHABIT#',
  CHECKIN: 'CHECKIN#',
  RX: 'RX#',
  MED: 'MED#',
  DOSE: 'DOSE#',
  APPT: 'APPT#',
  ESC: 'ESC#',
  MEALPLAN: 'MEALPLAN#',
  SHOPPING: 'SHOPPING#',
};

/** True when a sort key belongs to its declared type (checked by the server on every write). */
export const skMatchesType = (sk: string, type: RecordType): boolean =>
  SK_PREFIX[type].endsWith('#') ? sk.startsWith(SK_PREFIX[type]) && sk.length > SK_PREFIX[type].length : sk === SK_PREFIX[type];

/** Every record that represents this user's data. The local draft report is never stored. */
export function toRecords(d: UserData): DataRecord[] {
  const out: DataRecord[] = [{ sk: 'SETTINGS', type: 'SETTINGS', data: { onboarded: d.onboarded, reminders: d.reminders, testReminder: d.testReminder ?? null } }];
  if (d.consent) out.push({ sk: `CONSENT#${d.consent.givenAt}`, type: 'CONSENT', data: d.consent });
  if (d.profile) out.push({ sk: 'PROFILE', type: 'PROFILE', data: d.profile });
  for (const r of d.reports) out.push({ sk: `REPORT#${r.id}`, type: 'REPORT', data: { ...r, fileUri: undefined } });
  for (const p of d.plans) out.push({ sk: `PLAN#${p.id}`, type: 'PLAN', data: p });
  for (const h of d.doctorHabits) out.push({ sk: `DOCHABIT#${h.id}`, type: 'DOCHABIT', data: h });
  for (const h of d.ownHabits ?? []) out.push({ sk: `OWNHABIT#${h.id}`, type: 'OWNHABIT', data: h });
  for (const c of Object.values(d.checkIns)) out.push({ sk: `CHECKIN#${c.date}`, type: 'CHECKIN', data: c });
  for (const rx of d.prescriptions) out.push({ sk: `RX#${rx.id}`, type: 'RX', data: rx });
  for (const m of d.medicines) out.push({ sk: `MED#${m.id}`, type: 'MED', data: m });
  for (const e of d.doses) out.push({ sk: `DOSE#${e.date}T${e.time}#${e.medicineId}`, type: 'DOSE', data: e });
  for (const a of d.appointments) out.push({ sk: `APPT#${a.id}`, type: 'APPT', data: a });
  for (const e of d.escalations) out.push({ sk: `ESC#${e.id}`, type: 'ESC', data: e });
  for (const p of d.mealPlans ?? []) out.push({ sk: `MEALPLAN#${p.id}`, type: 'MEALPLAN', data: p });
  for (const [planId, checked] of Object.entries(d.shoppingChecked ?? {})) out.push({ sk: `SHOPPING#${planId}`, type: 'SHOPPING', data: { planId, checked } });
  return out;
}

const idOf = (sk: string) => sk.slice(sk.indexOf('#') + 1);

/** Applies records (upserts and soft deletes) onto a user's data, in place. */
export function applyRecords(d: UserData, records: DataRecord[]) {
  const upsert = <T>(list: T[], key: (x: T) => string, id: string, value: T | undefined): T[] => {
    const rest = list.filter((x) => key(x) !== id);
    return value === undefined ? rest : [...rest, value];
  };
  for (const r of records) {
    const v = r.deleted ? undefined : (r.data as never);
    const id = idOf(r.sk);
    switch (r.type) {
      case 'SETTINGS':
        if (v) {
          const s = v as { onboarded: boolean; reminders: UserData['reminders']; testReminder: string | null };
          d.onboarded = s.onboarded;
          d.reminders = { ...d.reminders, ...s.reminders };
          d.testReminder = s.testReminder ?? undefined;
        }
        break;
      case 'CONSENT': {
        const c = v as UserData['consent'];
        if (c && (!d.consent || c.givenAt >= d.consent.givenAt)) d.consent = c;
        if (!c && d.consent?.givenAt === id) d.consent = undefined;
        break;
      }
      case 'PROFILE':
        d.profile = v;
        break;
      case 'REPORT':
        d.reports = upsert(d.reports, (x) => x.id, id, v).sort((a, b) => b.collectionDate.localeCompare(a.collectionDate));
        break;
      case 'PLAN':
        d.plans = upsert(d.plans, (x) => x.id, id, v);
        break;
      case 'DOCHABIT':
        d.doctorHabits = upsert(d.doctorHabits, (x) => x.id, id, v);
        break;
      case 'OWNHABIT':
        d.ownHabits = upsert(d.ownHabits ?? [], (x) => x.id, id, v);
        break;
      case 'CHECKIN':
        if (v) d.checkIns[id] = v;
        else delete d.checkIns[id];
        break;
      case 'RX':
        d.prescriptions = upsert(d.prescriptions, (x) => x.id, id, v);
        break;
      case 'MED':
        d.medicines = upsert(d.medicines, (x) => x.id, id, v);
        break;
      case 'DOSE':
        d.doses = upsert(d.doses, (x) => `${x.date}T${x.time}#${x.medicineId}`, id, v);
        break;
      case 'APPT':
        d.appointments = upsert(d.appointments, (x) => x.id, id, v);
        break;
      case 'ESC':
        d.escalations = upsert(d.escalations, (x) => x.id, id, v);
        break;
      case 'MEALPLAN':
        d.mealPlans = upsert(d.mealPlans ?? [], (x) => x.id, id, v).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'SHOPPING': {
        const rest = { ...d.shoppingChecked };
        delete rest[id];
        d.shoppingChecked = v ? { ...rest, [id]: (v as { checked: string[] }).checked } : rest;
        break;
      }
    }
  }
}

/** The records that differ between two versions of a user's data: new or changed, and removed. */
export function diffRecords(before: UserData, after: UserData): { puts: DataRecord[]; deletes: DataRecord[] } {
  const prev = new Map(toRecords(before).map((r) => [r.sk, r]));
  const next = toRecords(after);
  const puts = next.filter((r) => JSON.stringify(r.data) !== JSON.stringify(prev.get(r.sk)?.data));
  const nextKeys = new Set(next.map((r) => r.sk));
  const deletes = [...prev.values()].filter((r) => !nextKeys.has(r.sk)).map((r) => ({ ...r, deleted: true }));
  return { puts, deletes };
}
