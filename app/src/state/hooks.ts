import { useMemo } from 'react';
import { activePlan, openEscalation, proposedPlan } from './actions/plan-builder';
import { emptyUserData, useStore } from './store';
import type { UserData } from './types';

const EMPTY = emptyUserData();

/** The signed-in user's data. */
export const useUserData = (): UserData => useStore((s) => (s.session && s.data[s.session.id]) || EMPTY);

/** The signed-in user, or undefined when signed out. */
export const useAccount = () => useStore((s) => s.session);

/** Commonly derived values for Home, Plan and Reports. */
export function useOverview() {
  const d = useUserData();
  return useMemo(
    () => ({
      data: d,
      profile: d.profile,
      plan: activePlan(d),
      proposal: proposedPlan(d),
      latestReport: d.reports[0],
      previousReport: d.reports[1],
      escalation: openEscalation(d),
    }),
    [d],
  );
}
