import { profileEscalation, type LifestyleAnswers } from '@lipidly/rules';
import { newId, today } from '../ids';
import { setState, updateUser } from '../store';
import type { UserProfile } from '../types';
import { applyEscalation } from './plan-builder';

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

/** Saves profile answers. Escalation rules re-run on every profile change (F11.1). */
export function saveProfile(profile: UserProfile) {
  updateUser((d) => {
    const hadConditions = (d.profile?.conditions.length ?? 0) > 0;
    d.profile = profile;
    const esc = profileEscalation(profile);
    if (esc && !hadConditions && d.reports.length > 0) applyEscalation(d, { ...esc, id: newId('esc_'), date: today() });
  });
}

export function saveLifestyle(lifestyle: LifestyleAnswers) {
  updateUser((d) => {
    if (d.profile) d.profile.lifestyle = lifestyle;
  });
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
