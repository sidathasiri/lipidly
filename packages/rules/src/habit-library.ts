import type { Equipment, FocusGroup, Place } from './types';

export type HabitCategory = 'food' | 'activity' | 'alcohol' | 'smoking';
export type Effort = 'none' | 'gentle' | 'moderate';

export interface HabitNeeds {
  /** Extra minutes a day the habit takes. 0 = fits into what the user already does. */
  minutes: number;
  /** The user must be able to be active in at least one of these places. Omitted = anywhere. */
  places?: Place[];
  /** The user must have at least one of these. Omitted = no equipment. */
  equipment?: Exclude<Equipment, 'none'>[];
  effort: Effort;
  /** Needs the user to cook their own meals. */
  controlsMeals?: boolean;
  /** Only makes sense for someone who eats out a few times a week or more. */
  eatsOut?: boolean;
  smoker?: boolean;
  drinker?: boolean;
}

export interface Habit {
  id: string;
  focus: FocusGroup[];
  category: HabitCategory;
  title: string;
  shortTitle: string;
  /** One line shown under the title on swap and proposal lists. */
  summary: string;
  why: string;
  how: string;
  /** The yes/no check-in question. */
  question: string;
  /** Daily, or a weekly target of days. */
  timesPerWeek: number;
  needs: HabitNeeds;
  /** Local foods shown as chips on Habit detail. */
  foods?: string[];
  /** A doctor habit with the same key replaces this habit (F4.5). */
  conflictKey?: string;
  /** Harder versions offered as the habit gets easy (F14.1): level 2, level 3. The habit itself is level 1. */
  levelUps?: HabitLevel[];
}

export interface HabitLevel {
  title: string;
  shortTitle: string;
  question: string;
  /** Extra minutes a day at this level (must still fit the user's free time). */
  minutes: number;
}

/**
 * Draft habit library (spec: "Habit library"). Wording awaits clinician and dietitian review.
 * List order is the proposal priority within each focus.
 */
export const HABIT_LIBRARY_VERSION = 'habits-v2-draft';

export const HABIT_LIBRARY: Habit[] = [
  // ── Triglycerides ──
  {
    id: 'no-sugary-drinks',
    focus: ['triglycerides', 'ldlNonHdl'],
    category: 'food',
    title: 'No sugary drinks today',
    shortTitle: 'No sugary drinks',
    summary: 'Plain tea, water or king coconut in place of fizzy drinks and sweet tea',
    why: 'Sugar in drinks turns into triglycerides quickly. Cutting it is one of the fastest ways to bring them down.',
    how: 'Swap soft drinks, cordial and sweet tea for water, plain tea or king coconut. Ask for tea with less sugar when you are out.',
    question: 'Did you skip sugary drinks today?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['King coconut', 'Plain tea', 'Lime juice, no sugar'],

    levelUps: [
      { title: 'No sugary drinks, and tea without sugar', shortTitle: 'No sugary drinks or sugar in tea', question: 'Did you skip sugary drinks and have your tea without sugar?', minutes: 0 },
    ],
  },
  {
    id: 'half-rice-dinner',
    focus: ['triglycerides'],
    category: 'food',
    title: 'Half the usual rice at dinner, with more vegetables',
    shortTitle: 'Half the usual rice',
    summary: 'Half a scoop of rice, more curries and greens',
    why: 'Large portions of white rice and refined starch can raise triglycerides. Vegetables add fibre and fill the plate.',
    how: 'Serve rice first and stop at half your usual scoop. Fill the gap with curries and greens.',
    question: 'Half your usual rice at dinner, with more vegetables?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['Gotukola mallum', 'Beans curry', 'Bandakka curry', 'Red rice'],

    levelUps: [
      { title: 'Half the usual rice at lunch and dinner, with more vegetables', shortTitle: 'Half rice at lunch and dinner', question: 'Half your usual rice at lunch and dinner, with more vegetables?', minutes: 0 },
    ],
  },
  {
    id: 'no-sweets-after-dinner',
    focus: ['triglycerides'],
    category: 'food',
    title: 'No sweets after dinner',
    shortTitle: 'No sweets after dinner',
    summary: 'Skip kavum, wattalappam and biscuits after the evening meal',
    why: 'Sweets late in the day add sugar your body stores as triglycerides overnight.',
    how: 'Keep sweets out of sight after dinner. If you want something, have a piece of fruit.',
    question: 'Did you skip sweets after dinner?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['Papaya', 'Guava', 'Orange'],
  },
  {
    id: 'brisk-walk-30',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: '30 minutes of brisk walking',
    shortTitle: '30-min brisk walk',
    summary: 'Fast enough that talking takes a little effort',
    why: 'Regular brisk walking helps lower triglycerides and can raise HDL.',
    how: 'Walk fast enough that you can talk but not sing. Split it into two 15-minute walks if that is easier.',
    question: 'Did you walk briskly for 30 minutes?',
    timesPerWeek: 7,
    needs: { minutes: 30, places: ['outdoors'], effort: 'moderate' },
    conflictKey: 'walk',

    levelUps: [
      { title: '40 minutes of brisk walking', shortTitle: '40-min brisk walk', question: 'Did you walk briskly for 40 minutes?', minutes: 40 },
    ],
  },
  {
    id: 'alcohol-free-day',
    focus: ['triglycerides'],
    category: 'alcohol',
    title: 'An alcohol-free day',
    shortTitle: 'Alcohol-free day',
    summary: 'No arrack, beer or toddy today',
    why: 'Alcohol raises triglycerides, even in small amounts.',
    how: 'Choose a soft drink without sugar or king coconut when others are drinking.',
    question: 'Was today alcohol-free?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none', drinker: true },
    conflictKey: 'alcohol',
  },

  // ── LDL / non-HDL ──
  {
    id: 'no-deep-fried',
    focus: ['ldlNonHdl', 'triglycerides'],
    category: 'food',
    title: 'No deep-fried food today',
    shortTitle: 'No deep-fried food',
    summary: 'Skip rolls, cutlets, wade and fried fish',
    why: 'Deep-fried food is high in the fats that raise LDL cholesterol.',
    how: 'Choose boiled, steamed or curried dishes. Ask for grilled fish in place of fried.',
    question: 'Did you skip deep-fried food today?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['Fish ambul thiyal', 'Steamed string hoppers', 'Boiled chickpeas'],
  },
  {
    id: 'fruit-for-short-eats',
    focus: ['ldlNonHdl', 'triglycerides'],
    category: 'food',
    title: 'Fruit or nuts in place of short eats',
    shortTitle: 'Fruit for short eats',
    summary: 'Guava, papaya or an orange at tea time',
    why: 'Short eats are often fried and made with refined flour. Fruit and a few nuts add fibre instead.',
    how: 'Keep fruit or a small handful of unsalted nuts with you for tea time.',
    question: 'Did you have fruit or nuts in place of short eats?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['Guava', 'Papaya', 'Orange', 'Peanuts, unsalted'],

    levelUps: [
      { title: 'Fruit or nuts in place of short eats and biscuits', shortTitle: 'No short eats or biscuits', question: 'Did you have fruit or nuts in place of short eats and biscuits?', minutes: 0 },
    ],
  },
  {
    id: 'veg-or-dhal-two-meals',
    focus: ['ldlNonHdl'],
    category: 'food',
    title: 'Vegetables or dhal with two meals',
    shortTitle: 'Veg or dhal twice',
    summary: 'A curry of vegetables or dhal at lunch and dinner',
    why: 'Fibre from vegetables and lentils helps lower LDL cholesterol.',
    how: 'Add a vegetable curry or parippu to lunch and dinner.',
    question: 'Did you have vegetables or dhal with two meals?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['Parippu', 'Mukunuwenna mallum', 'Polos curry'],

    levelUps: [
      { title: 'Vegetables or dhal with every meal', shortTitle: 'Veg or dhal every meal', question: 'Did you have vegetables or dhal with every meal?', minutes: 0 },
    ],
  },
  {
    id: 'high-fibre-breakfast',
    focus: ['ldlNonHdl'],
    category: 'food',
    title: 'A high-fibre breakfast',
    shortTitle: 'High-fibre breakfast',
    summary: 'Kurakkan, oats or red rice in place of white bread',
    why: 'Soluble fibre in the morning helps lower LDL cholesterol.',
    how: 'Choose kurakkan roti, oats or red-rice string hoppers over white bread.',
    question: 'Did you have a high-fibre breakfast?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none' },
    foods: ['Kurakkan roti', 'Oats kanda', 'Red-rice string hoppers'],

    levelUps: [
      { title: 'A high-fibre breakfast and a pulse at lunch', shortTitle: 'Fibre at breakfast and lunch', question: 'Did you have a high-fibre breakfast and a pulse (dhal, chickpeas or beans) at lunch?', minutes: 0 },
    ],
  },
  {
    id: 'less-oil-cooking',
    focus: ['ldlNonHdl'],
    category: 'food',
    title: 'Use less oil when cooking',
    shortTitle: 'Less cooking oil',
    summary: 'One spoon of oil per curry, and thin coconut milk',
    why: 'Coconut oil and thick coconut milk are high in saturated fat, which raises LDL.',
    how: 'Measure one spoon of oil per curry, and use thin milk (diya kiri) in place of thick.',
    question: 'Did you cook with less oil today?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none', controlsMeals: true },

    levelUps: [
      { title: 'A teaspoon of oil or less per dish', shortTitle: 'A teaspoon of oil per dish', question: 'Did you cook with a teaspoon of oil or less per dish?', minutes: 0 },
    ],
  },
  {
    id: 'lighter-eating-out',
    focus: ['ldlNonHdl', 'triglycerides'],
    category: 'food',
    title: 'A lighter choice when eating out',
    shortTitle: 'Lighter when eating out',
    summary: 'Rice and curry with more vegetables in place of kottu or fried rice',
    why: 'Canteen and takeaway food is often fried and oily. A lighter choice cuts fat and refined starch.',
    how: 'Pick rice and curry with extra vegetables, and leave the fried items.',
    question: 'Did you choose a lighter option when eating out?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none', eatsOut: true },
  },

  // ── HDL ──
  {
    id: 'smoke-free-day',
    focus: ['hdl'],
    category: 'smoking',
    title: 'A smoke-free day',
    shortTitle: 'Smoke-free day',
    summary: 'No cigarettes or beedi today',
    why: 'Stopping smoking helps raise HDL, the protective cholesterol.',
    how: 'Notice when you usually smoke and plan something else for that moment, like a short walk or a glass of water.',
    question: 'Was today smoke-free?',
    timesPerWeek: 7,
    needs: { minutes: 0, effort: 'none', smoker: true },
    conflictKey: 'smoking',
  },
  {
    id: 'activity-30',
    focus: ['hdl'],
    category: 'activity',
    title: '30 minutes of activity',
    shortTitle: '30 minutes active',
    summary: 'Any activity that gets you moving: walking, cycling, housework',
    why: 'Regular activity is one of the main ways to raise HDL.',
    how: 'Choose anything that warms you up: a walk, cycling, gardening or brisk housework.',
    question: 'Were you active for 30 minutes today?',
    timesPerWeek: 7,
    needs: { minutes: 30, effort: 'moderate' },
    conflictKey: 'walk',

    levelUps: [
      { title: '40 minutes of activity', shortTitle: '40 minutes active', question: 'Were you active for 40 minutes today?', minutes: 40 },
    ],
  },

  // ── Short and gentle movement (all focuses) ──
  {
    id: 'walk-after-dinner-10',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: 'A 10-minute walk after dinner',
    shortTitle: 'Walk after dinner',
    summary: '10 minutes, any pace',
    why: 'A short walk after a meal helps your body use the sugar and fat from that meal.',
    how: 'Walk around the house, garden or lane for 10 minutes after dinner. Any pace counts.',
    question: 'Did you walk for 10 minutes after dinner?',
    timesPerWeek: 7,
    needs: { minutes: 10, places: ['home', 'outdoors'], effort: 'gentle' },
    conflictKey: 'walk',

    levelUps: [
      { title: 'A 15-minute walk after dinner', shortTitle: '15-min walk after dinner', question: 'Did you walk for 15 minutes after dinner?', minutes: 15 },
      { title: 'A 20-minute walk after dinner', shortTitle: '20-min walk after dinner', question: 'Did you walk for 20 minutes after dinner?', minutes: 20 },
    ],
  },
  {
    id: 'take-the-stairs',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: 'Take the stairs',
    shortTitle: 'Take the stairs',
    summary: 'Stairs in place of the lift, every time today',
    why: 'Short bursts of activity through the day add up.',
    how: 'Use the stairs at work, home or the shops. Walk up one floor and take the lift the rest if needed.',
    question: 'Did you take the stairs today?',
    timesPerWeek: 7,
    needs: { minutes: 5, effort: 'moderate' },

    levelUps: [
      { title: 'Take the stairs every time', shortTitle: 'Stairs every time', question: 'Did you take the stairs every time today?', minutes: 5 },
    ],
  },
  {
    id: 'walk-on-calls',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: 'Walk during phone calls',
    shortTitle: 'Walk on calls',
    summary: 'Stand up and walk whenever you are on the phone',
    why: 'Moving more during the day, even slowly, helps your body handle fats.',
    how: 'Every time you take a call, stand up and walk around.',
    question: 'Did you walk during your phone calls?',
    timesPerWeek: 7,
    needs: { minutes: 10, places: ['home', 'outdoors'], effort: 'gentle' },
  },
  {
    id: 'gentle-walk',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: 'A short gentle walk',
    shortTitle: 'Gentle walk',
    summary: 'Slow and comfortable. Ask your doctor first if you have pain.',
    why: 'Gentle movement still helps, without straining an injury.',
    how: 'Walk slowly for 5 to 10 minutes on flat ground. Stop if it hurts, and ask your doctor what is safe for you.',
    question: 'Did you take a short gentle walk?',
    timesPerWeek: 7,
    needs: { minutes: 10, places: ['home', 'outdoors'], effort: 'gentle' },
    conflictKey: 'walk',

    levelUps: [
      { title: 'A 15-minute gentle walk', shortTitle: '15-min gentle walk', question: 'Did you take a 15-minute gentle walk?', minutes: 15 },
      { title: 'A 20-minute gentle walk', shortTitle: '20-min gentle walk', question: 'Did you take a 20-minute gentle walk?', minutes: 20 },
    ],
  },
  {
    id: 'home-routine',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: 'A 15-minute home routine',
    shortTitle: 'Home routine',
    summary: 'Marching, squats and arm circles, no equipment',
    why: 'A short routine at home gets your heart going without needing to go out.',
    how: 'March on the spot, do slow squats with a chair behind you, and arm circles. Rest when you need to.',
    question: 'Did you do your 15-minute home routine?',
    timesPerWeek: 7,
    needs: { minutes: 15, places: ['home'], effort: 'moderate' },

    levelUps: [
      { title: 'A 20-minute home routine', shortTitle: '20-min home routine', question: 'Did you do your 20-minute home routine?', minutes: 20 },
      { title: 'A 25-minute home routine', shortTitle: '25-min home routine', question: 'Did you do your 25-minute home routine?', minutes: 25 },
    ],
  },
  {
    id: 'machine-25',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: '20 to 30 minutes on your machine',
    shortTitle: 'Treadmill or bike',
    summary: 'Treadmill or exercise bike at a steady pace',
    why: 'Steady exercise most days helps lower triglycerides and raise HDL.',
    how: 'Go at a pace where you can talk but not sing. Start with 20 minutes and build up.',
    question: 'Did you spend 20 to 30 minutes on your treadmill or bike?',
    timesPerWeek: 7,
    needs: { minutes: 30, places: ['home'], equipment: ['treadmill', 'bicycle'], effort: 'moderate' },
    conflictKey: 'walk',

    levelUps: [
      { title: '35 minutes on your machine', shortTitle: '35 min on your machine', question: 'Did you spend 35 minutes on your treadmill or bike?', minutes: 35 },
    ],
  },
  {
    id: 'gym-or-swim',
    focus: ['triglycerides', 'ldlNonHdl', 'hdl'],
    category: 'activity',
    title: 'A gym session or a swim, three times a week',
    shortTitle: 'Gym or swim',
    summary: 'Three times a week',
    why: 'Regular longer sessions help lower triglycerides and raise HDL.',
    how: 'Book three sessions in your week. Mix steady cardio with light weights.',
    question: 'Did you go to the gym or swim today?',
    timesPerWeek: 3,
    needs: { minutes: 45, places: ['gym'], equipment: ['gym', 'pool'], effort: 'moderate' },
  },
];
