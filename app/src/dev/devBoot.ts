import { useEffect } from 'react';
import { addDays } from '@lipidly/rules';
import { confirmDraft, setDraft } from '@/state/actions/reports';
import { newId, today } from '@/state/ids';
import { loadSampleData } from '@/state/sample-data';
import { emptyUserData, getState, setState, useStore } from '@/state/store';

/**
 * Development only. Start Metro with `EXPO_PUBLIC_DEV_ROUTE=/home` (any route) to sign in as a
 * local test account with the design's sample data and open that screen directly.
 * Add `EXPO_PUBLIC_DEV_SCENARIO=draft` for a report waiting to be confirmed, `proposal` for a new
 * report with an updated plan to review, or `escalation` for a very high result. Does nothing in production builds or when the variables are unset.
 */
const DEV_ROUTE = __DEV__ ? process.env.EXPO_PUBLIC_DEV_ROUTE : undefined;

let devRouteUsed = false;

/** The dev start route, returned only once per app launch so later visits to the gate go Home. */
export function takeDevStartRoute(): string | undefined {
  if (!DEV_ROUTE || devRouteUsed) return undefined;
  devRouteUsed = true;
  return DEV_ROUTE;
}
const DEV_SCENARIO = __DEV__ ? process.env.EXPO_PUBLIC_DEV_SCENARIO : undefined;

const DEV_KEY = 'dev@lipidly.local';

const sampleDraft = (triglycerides: number, nonHdl: number) => ({
  id: newId('draft_'),
  labName: 'Lanka Diagnostics',
  collectionDate: addDays(today(), -2),
  source: 'camera' as const,
  pageCount: 2,
  markers: (
    [
      ['totalCholesterol', 222],
      ['triglycerides', triglycerides],
      ['hdl', 38],
      ['nonHdl', nonHdl],
      ['ldl', 127],
    ] as const
  ).map(([marker, value]) => ({ marker, value, unit: 'mg/dL' as const, extractedValue: value, edited: false })),
});

/** Returns true once the dev account is in place (immediately when unused), so routing starts after it. */
export function useDevBoot(ready: boolean): boolean {
  useEffect(() => {
    if (!ready || !DEV_ROUTE) return;
    const key = DEV_KEY;
    const { accounts, data } = getState();
    const account = accounts[key] ?? { id: newId('u_'), email: key, name: 'Nimal Perera', provider: 'password' as const, verified: true, password: 'devpassword' };
    setState({ accounts: { ...accounts, [key]: account }, sessionUserId: account.id, seenWelcome: true, data: { ...data, [account.id]: data[account.id] ?? emptyUserData() } });
    if (DEV_SCENARIO || !getState().data[account.id]?.onboarded) loadSampleData();
    if (DEV_SCENARIO === 'draft') setDraft(sampleDraft(286, 148));
    if (DEV_SCENARIO === 'proposal') {
      const draft = sampleDraft(240, 170);
      setDraft(draft);
      confirmDraft(draft);
    }
    if (DEV_SCENARIO === 'escalation') {
      const draft = sampleDraft(540, 184);
      setDraft(draft);
      confirmDraft(draft);
    }
  }, [ready]);
  return useStore((s) => !DEV_ROUTE || (!!s.sessionUserId && s.sessionUserId === s.accounts[DEV_KEY]?.id));
}
