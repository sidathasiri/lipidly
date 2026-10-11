import type { FocusGroup, LifestyleAnswers, Profile } from './types';

/**
 * Meal-plan guidance: who may get AI-written meal ideas, and the nutrition rules those meals
 * must follow. The rules come from here (deterministic, reviewable); the model only writes
 * recipes inside them. General heart-healthy eating only: never a diet for a medical condition.
 */

export interface MealGuidance {
  eligible: boolean;
  /** Shown when not eligible. */
  reason?: string;
  /** Instructions for the recipe writer, in plain English. */
  rules: string[];
  /** Ingredients never used, whatever the user asks for (lower case). */
  neverUse: string[];
  /** Longest hands-on time for a main meal, minutes. */
  maxMinutes: number;
}

const BASE_RULES = [
  'Heart-healthy everyday food: vegetables or fruit at every meal, whole grains over refined, pulses and legumes often.',
  'Oily fish (sardines, mackerel, salmon, tuna) two or three times a week, unless the diet excludes fish.',
  'Cook with little oil, preferring vegetable oils (sunflower, rice bran, olive); steam, boil, grill, bake or dry-fry instead of deep frying.',
  'Keep salt low: use herbs, spices, lime and vinegar for flavour; avoid stock cubes, processed meats and salted dried fish.',
  'No trans fats, margarine or packaged fried snacks. Low-fat dairy if dairy is used.',
  'Snacks are small: fruit, a handful of unsalted nuts, yoghurt, roasted chickpeas, vegetables with a dip.',
  'No alcohol in recipes. No supplements, no medical or weight-loss claims, never mention medicines.',
];

const FOCUS_RULES: Record<FocusGroup, string[]> = {
  triglycerides: [
    'Focus is triglycerides: keep added sugar and sweet drinks out (no sugar in tea or coffee, no juice, no sweets or desserts), and keep refined starch small (at most one cup of cooked rice or two slices of bread per meal, preferably red or brown rice, wholemeal bread).',
    'Whole fruit instead of juice, at most two portions a day. Protein and vegetables make up most of each plate.',
  ],
  ldlNonHdl: [
    'Focus is LDL cholesterol: keep saturated fat low (coconut milk only light and in small amounts, no ghee or butter, lean meat and skinless chicken, few full-fat dairy foods).',
    'Include soluble fibre every day: oats, barley, beans, lentils, chickpeas, okra, aubergine, apples or citrus. Unsalted nuts most days.',
  ],
  hdl: [
    'Focus is HDL cholesterol: favour healthy fats (olive or rice bran oil, nuts, seeds, avocado, oily fish) and keep refined carbohydrates and sugar low.',
  ],
};

/** Grapefruit and pomelo interact with common cholesterol medicines, so they are left out for everyone. */
const NEVER_USE = ['grapefruit', 'pomelo', 'alcohol', 'wine', 'beer', 'arrack'];

export function mealGuidance(input: { profile: Profile; lifestyle?: LifestyleAnswers; focusGroup: FocusGroup | null; escalated: boolean }): MealGuidance {
  const { profile, focusGroup, escalated } = input;
  const lifestyle = input.lifestyle ?? profile.lifestyle;
  const maxMinutes = lifestyle?.timeFree === 'under15' ? 20 : lifestyle?.timeFree === 'over30' ? 45 : 30;
  if (profile.conditions.length > 0 || profile.pregnant) {
    return {
      eligible: false,
      reason: 'With your health conditions, meals need to follow your doctor’s or a dietitian’s advice, so Lipidly doesn’t suggest meal plans.',
      rules: [],
      neverUse: NEVER_USE,
      maxMinutes,
    };
  }
  if (escalated) {
    return { eligible: false, reason: 'Your doctor is guiding your plan for now. Ask them about the right foods for you.', rules: [], neverUse: NEVER_USE, maxMinutes };
  }
  const rules = [...BASE_RULES, ...(focusGroup ? FOCUS_RULES[focusGroup] : [])];
  rules.push(`Main meals take at most ${maxMinutes} minutes of hands-on cooking; snacks need no cooking.`);
  if (lifestyle?.eatsOut === 'mostDays') rules.push('Lunch is eaten away from home most days: make lunches easy to pack, or say what to pick at a canteen.');
  if (lifestyle?.cooks === 'someoneElse') rules.push('Someone else cooks at home: keep recipes simple to hand over.');
  return { eligible: true, rules, neverUse: NEVER_USE, maxMinutes };
}
