import type { Medicine, OwnHabit, PlanHabit, UserData } from './types';

/** At most two own habits, so the check-in stays under a minute (spec F4.15). */
export const MAX_OWN_HABITS = 2;

export const ownHabitsOf = (d: UserData): OwnHabit[] => d.ownHabits ?? [];

/** Own habits shaped like plan habits, for the check-in and summaries. They never reach the rule engine. */
export const ownAsPlanHabits = (d: UserData): PlanHabit[] =>
  ownHabitsOf(d).map((h) => ({ id: h.id, source: 'own', title: h.title, question: h.question, committed: true, reminderTime: h.reminderTime }));

/** "Drink 8 glasses of water" → "Did you drink 8 glasses of water today?" */
export const questionFor = (title: string): string => {
  const t = title.trim().replace(/[.!?]+$/, '');
  if (!t) return '';
  return `Did you ${t.charAt(0).toLowerCase()}${t.slice(1)} today?`;
};

const MEDICINE_WORDS =
  /\b(medicines?|medications?|meds|pills?|tablets?|capsules?|doses?|dosage|statins?|insulin|injections?|drugs?|prescriptions?|\d+\s?(mg|mcg|iu))\b|(vastatin|ezetimibe|fenofibrate|metformin)/i;

/**
 * Own habits can't be about a medicine or dose (spec F4.17): the app never comments on medicines.
 * Returns a message for the user, or undefined when the text is fine.
 */
export const medicineConflict = (text: string, medicines: Medicine[]): string | undefined => {
  const lower = text.toLowerCase();
  const namesMedicine = medicines.some((m) => m.name.trim().length > 2 && lower.includes(m.name.trim().toLowerCase()));
  if (namesMedicine || MEDICINE_WORDS.test(text)) {
    return 'Medicines are tracked in the Medicines tab, with a reminder at each dose. Own habits are for everyday things like water, sleep or screen time.';
  }
  return undefined;
};
