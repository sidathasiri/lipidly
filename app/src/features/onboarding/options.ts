import type { ChoiceOption } from '@/ui';
import type { Equipment, HealthCondition, LifestyleAnswers, PhysicalLimit, Place, TimeFree } from '@lipidly/rules';
import type { UserProfile } from '@/state/types';

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
