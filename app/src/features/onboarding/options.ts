import type { ChoiceOption } from '@/ui';
import type { Equipment, HealthCondition, LifestyleAnswers, PhysicalLimit, Place, TimeFree } from '@lipidly/rules';
import type { DietType, FoodPreferences, UserProfile } from '@/state/types';

/** Answer options shared by onboarding and profile editing. Labels follow the design copy. */

export const CONDITION_OPTIONS: ChoiceOption<HealthCondition | 'none'>[] = [
  { value: 'heartDisease', label: 'Heart disease' },
  { value: 'stroke', label: 'Stroke' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'kidneyDisease', label: 'Kidney disease' },
  { value: 'none', label: 'None of these' },
];

export const MEDICINE_OPTIONS: ChoiceOption<UserProfile['takesLipidMedicine']>[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'notSure', label: 'Not sure' },
];

export const SMOKING_OPTIONS: ChoiceOption<UserProfile['smokes']>[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'never', label: 'Never' },
];

export const ALCOHOL_OPTIONS: ChoiceOption<UserProfile['alcohol']>[] = [
  { value: 'never', label: 'Never' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'often', label: 'Most weeks' },
];

export const SEX_OPTIONS: ChoiceOption<UserProfile['sex']>[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const TIME_OPTIONS: ChoiceOption<TimeFree>[] = [
  { value: 'under15', label: 'Under 15 min' },
  { value: '15to30', label: '15–30 min' },
  { value: 'over30', label: 'Over 30 min' },
];

export const PLACE_OPTIONS: ChoiceOption<Place>[] = [
  { value: 'home', label: 'At home' },
  { value: 'outdoors', label: 'Outdoors nearby' },
  { value: 'gym', label: 'Gym or sports centre' },
];

export const EQUIPMENT_OPTIONS: ChoiceOption<Equipment>[] = [
  { value: 'none', label: 'None' },
  { value: 'treadmill', label: 'Treadmill' },
  { value: 'bicycle', label: 'Bicycle' },
  { value: 'gym', label: 'Gym' },
  { value: 'pool', label: 'Pool' },
];

export const LIMIT_OPTIONS: ChoiceOption<PhysicalLimit>[] = [
  { value: 'none', label: 'None' },
  { value: 'pain', label: 'Pain or injury' },
  { value: 'doctorLimited', label: 'Doctor has limited my activity' },
];

export const COOKS_OPTIONS: ChoiceOption<LifestyleAnswers['cooks']>[] = [
  { value: 'self', label: 'I do' },
  { value: 'someoneElse', label: 'Someone else' },
];

export const EATS_OUT_OPTIONS: ChoiceOption<LifestyleAnswers['eatsOut']>[] = [
  { value: 'rarely', label: 'Rarely' },
  { value: 'fewTimesAWeek', label: 'Few times a week' },
  { value: 'mostDays', label: 'Most days' },
];

export const DEFAULT_LIFESTYLE: LifestyleAnswers = {
  timeFree: '15to30',
  places: ['home'],
  equipment: ['none'],
  physicalLimit: 'none',
  cooks: 'self',
  eatsOut: 'rarely',
};

export const labelOf = <T extends string>(options: ChoiceOption<T>[], value: T) => options.find((o) => o.value === value)?.label ?? value;

/** "15–30 min · home or outdoors · no equipment", shown on the swap screen. */
export const lifestyleSummary = (l: LifestyleAnswers) => {
  const places = l.places.map((p) => ({ home: 'home', outdoors: 'outdoors', gym: 'gym' })[p]).join(' or ') || 'no place';
  const equipment = l.equipment.filter((e) => e !== 'none');
  return [labelOf(TIME_OPTIONS, l.timeFree), places, equipment.length ? equipment.join(', ') : 'no equipment'].join(' · ');
};

// ── Food preferences (meal plans, F13) ────────────────────────────────────────

export const CUISINE_OPTIONS: ChoiceOption<string>[] = [
  { value: 'sriLankan', label: 'Sri Lankan' },
  { value: 'western', label: 'Western' },
];

export const DIET_OPTIONS: ChoiceOption<DietType>[] = [
  { value: 'everything', label: 'I eat everything' },
  { value: 'pescatarian', label: 'Fish, no meat' },
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
];

export const AVOID_OPTIONS: ChoiceOption<string>[] = [
  { value: 'beef', label: 'Beef' },
  { value: 'pork', label: 'Pork' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'gluten', label: 'Gluten' },
  { value: 'mushrooms', label: 'Mushrooms' },
];

export const PEOPLE_OPTIONS: ChoiceOption<string>[] = [
  { value: '1', label: 'Just me' },
  { value: '2', label: '2' },
  { value: '4', label: '3–4' },
  { value: '6', label: '5 or more' },
];

export const DEFAULT_FOOD: FoodPreferences = { cuisines: ['sriLankan', 'western'], dietType: 'everything', avoid: [], people: 1 };

/** "Sri Lankan, Western · just me", for the Profile row. */
export const foodSummary = (food: FoodPreferences) => {
  const cuisines = food.cuisines.map((c) => CUISINE_OPTIONS.find((o) => o.value === c)?.label ?? c).join(', ');
  const people = food.people && food.people > 1 ? `${PEOPLE_OPTIONS.find((o) => o.value === String(food.people))?.label ?? food.people} people` : 'just me';
  return `${cuisines} · ${people}`;
};

const optionValues = (options: ChoiceOption<string>[]) => new Set(options.map((o) => o.value));
const CUISINE_VALUES = optionValues(CUISINE_OPTIONS);
const AVOID_VALUES = optionValues(AVOID_OPTIONS);

/** Splits stored lists into chip values and the user's own words (the chips' "+ Other"). */
export const splitChoices = (values: string[], kind: 'cuisine' | 'avoid') => {
  const known = kind === 'cuisine' ? CUISINE_VALUES : AVOID_VALUES;
  return { chips: values.filter((v) => known.has(v)), other: values.filter((v) => !known.has(v)) };
};
