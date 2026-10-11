import { saveProfile as applyProfile } from '@lipidly/domain';
import type { LifestyleAnswers } from '@lipidly/rules';
import { newId, today } from '../ids';
import { currentUserData, enqueue, isSyncedSession, setState, updateUser } from '../store';
import type { FoodPreferences, UserProfile } from '../types';

export const POLICY_VERSION = 'privacy-2026-10';

export function markWelcomeSeen() {
  setState({ seenWelcome: true });
}

export function giveConsent() {
  updateUser((d) => {
    d.consent = { policyVersion: POLICY_VERSION, givenAt: new Date().toISOString() };
  });
}

export function withdrawConsent() {
  updateUser((d) => {
    if (d.consent) d.consent.withdrawnAt = new Date().toISOString();
  });
}

/**
 * Saves profile answers. Escalation rules re-run on every profile change (F11.1): on the server,
 * which sends back any escalation it opens. The local developer account runs them on the phone.
 */
export function saveProfile(profile: UserProfile) {
  const t = today();
  if (!isSyncedSession()) {
    updateUser((d) => applyProfile(d, profile, t));
    return;
  }
  updateUser((d) => {
    d.profile = profile;
  });
  enqueue({ id: newId('op_'), op: 'saveProfile', variables: { profile, today: t } });
}

/** "What fits your life": lifestyle answers and food preferences for meal plans (F13). */
export function saveLifestyle(lifestyle: LifestyleAnswers, food: FoodPreferences) {
  const profile = currentUserData().profile;
  if (profile) saveProfile({ ...profile, lifestyle, food });
}

export function finishOnboarding() {
  updateUser((d) => {
    d.onboarded = true;
  });
}

export function setTestReminder(date: string | undefined) {
  updateUser((d) => {
    d.testReminder = date;
  });
}
