import { router } from 'expo-router';
import { useEffect } from 'react';
import { addDays } from '@lipidly/rules';
import { signIn } from '@/state/actions/auth';
import { confirmDraft, setDraft } from '@/state/actions/reports';
import { newId, today } from '@/state/ids';
import { loadSampleData } from '@/state/sample-data';
import { emptyUserData, getState, LOCAL_USER_ID, setState, useStore } from '@/state/store';

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

/**
 * Development only: `EXPO_PUBLIC_DEV_SIGNIN="email password"` signs a real (test) Cognito account
 * in on launch, for simulators where typing isn't possible. Keep it out of committed files.
 */
const DEV_SIGNIN = __DEV__ ? process.env.EXPO_PUBLIC_DEV_SIGNIN : undefined;

/** Development only: `EXPO_PUBLIC_DEV_TOUR="/plan,/plan/meals"` opens each route in turn (8s apart) once signed in, for screenshots. */
const DEV_TOUR = __DEV__ ? process.env.EXPO_PUBLIC_DEV_TOUR : undefined;

export function useDevTour() {
  const signedIn = useStore((s) => !!s.session);
  useEffect(() => {
    if (!DEV_TOUR || !signedIn) return;
    const routes = DEV_TOUR.split(',').map((r) => r.trim()).filter(Boolean);
    let i = 0;
    const timer = setInterval(() => {
      if (i >= routes.length) return clearInterval(timer);
      router.push(routes[i++] as never);
    }, 8000);
    return () => clearInterval(timer);
  }, [signedIn]);
}

export async function devAutoSignIn() {
  if (!DEV_SIGNIN || getState().session) return;
  const [email, password] = DEV_SIGNIN.trim().split(/\s+/);
  if (email && password) await signIn(email, password).catch((e: Error) => console.warn('dev sign-in failed:', e.message));
}

const DEV_USER_ID = LOCAL_USER_ID;

/** True when the dev shortcut is on; the app then skips the Cognito session check. */
export const DEV_BOOT_ACTIVE = !!DEV_ROUTE;

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
    // A local-only session: no Cognito sign-in, so screens can be opened offline with sample data.
    const { data } = getState();
    const account = { id: DEV_USER_ID, email: 'dev@lipidly.local', name: 'Nimal Perera', provider: 'password' as const, verified: true };
    setState({ session: account, seenWelcome: true, data: { ...data, [account.id]: data[account.id] ?? emptyUserData() } });
    if (DEV_SCENARIO || !getState().data[account.id]?.onboarded) loadSampleData();
    if (DEV_SCENARIO === 'draft') setDraft(sampleDraft(286, 148));
    if (DEV_SCENARIO === 'proposal') {
      const draft = sampleDraft(240, 170);
      setDraft(draft);
      void confirmDraft(draft);
    }
    if (DEV_SCENARIO === 'escalation') {
      const draft = sampleDraft(540, 184);
      setDraft(draft);
      void confirmDraft(draft);
    }
  }, [ready]);
  return useStore((s) => !DEV_ROUTE || s.session?.id === DEV_USER_ID);
}
