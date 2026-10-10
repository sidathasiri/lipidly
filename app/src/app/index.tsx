import { ineligibleReason } from '@lipidly/rules';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { takeDevStartRoute } from '@/dev/devBoot';
import { useAccount, useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import { useStore } from '@/state/store';

/** Sends the user to the right place: welcome, sign-in, the next onboarding step, or Home. */
export default function Index() {
  const seenWelcome = useStore((s) => s.seenWelcome);
  const account = useAccount();
  const d = useUserData();
  // Read once per visit to the gate: the dev start route applies only on the first visit after launch.
  const [devRoute] = useState(takeDevStartRoute);

  if (!account) return <Redirect href={seenWelcome ? '/auth/sign-in' : '/welcome'} />;
  if (!d.consent || d.consent.withdrawnAt) return <Redirect href="/onboarding/consent" />;
  if (!d.profile) return <Redirect href="/onboarding/profile" />;
  if (ineligibleReason(d.profile, today())) return <Redirect href="/onboarding/not-eligible" />;
  if (!d.onboarded) return <Redirect href="/onboarding/lifestyle" />;
  return <Redirect href={(devRoute ?? '/home') as '/home'} />;
}
