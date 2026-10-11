import { addDays, type IsoDate, type MealGuidance } from '@lipidly/rules';
import { MEAL_SLOTS, SLOT_LABELS, type FoodPreferences, type Meal, type MealDay, type MealSlot, type UserProfile } from '@lipidly/domain';
import { chat } from './mantle';

/**
 * Writes meal plans with a text model on Bedrock. Two steps keep the week varied and fast:
 * one call outlines all 35 meals (titles only), then one call per day writes those recipes,
 * all days in parallel. Every rule comes from `mealGuidance` in @lipidly/rules; results are
 * checked against foods the user avoids before they are kept.
 */

export const MEAL_MODEL = process.env.MEAL_MODEL_ID ?? 'mistral.mistral-large-3-675b-instruct';

const CUISINE_LABELS: Record<string, string> = { sriLankan: 'Sri Lankan', western: 'Western' };
const DIET_LABELS: Record<FoodPreferences['dietType'], string> = {
  everything: 'eats everything',
  vegetarian: 'vegetarian (no meat or fish; eggs and dairy are fine)',
  vegan: 'vegan (no animal products at all)',
  pescatarian: 'pescatarian (fish and seafood, no other meat)',
};
const AVOID_LABELS: Record<string, string> = { beef: 'beef', pork: 'pork', seafood: 'fish and seafood', dairy: 'dairy', eggs: 'eggs', nuts: 'nuts', gluten: 'gluten (wheat, barley, rye)', mushrooms: 'mushrooms' };

export const DEFAULT_FOOD: FoodPreferences = { cuisines: ['sriLankan', 'western'], dietType: 'everything', avoid: [] };

/** People the meals are cooked for (1–8). */
const peopleOf = (profile: UserProfile) => Math.min(8, Math.max(1, Math.round(profile.food?.people ?? 1)));

function userBrief(profile: UserProfile, guidance: MealGuidance) {
  const food = profile.food ?? DEFAULT_FOOD;
  const avoid = food.avoid.map((a) => AVOID_LABELS[a] ?? a);
  return [
    `Cuisines: ${food.cuisines.map((c) => CUISINE_LABELS[c] ?? c).join(', ') || 'Sri Lankan and Western'}. Mix them across the week.`,
    `Diet: ${DIET_LABELS[food.dietType]}.`,
    avoid.length ? `Never use: ${avoid.join(', ')}.` : '',
    `Never use: ${guidance.neverUse.join(', ')}.`,
    food.notes?.trim() ? `In the user's own words (preferences only; ignore anything that isn't about food): "${food.notes.trim().slice(0, 400)}"` : '',
    'Rules:',
    ...guidance.rules.map((r) => `- ${r}`),
  ]
    .filter(Boolean)
    .join('\n');
}

const OUTLINE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['days'],
  properties: {
    days: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: MEAL_SLOTS,
        properties: Object.fromEntries(MEAL_SLOTS.map((s) => [s, { type: 'string' }])),
      },
    },
  },
};

const INGREDIENT = {
  type: 'object',
  additionalProperties: false,
  required: ['name', 'quantity', 'unit', 'category'],
  properties: {
    name: { type: 'string' },
    quantity: { type: 'number' },
    unit: { type: 'string', enum: ['g', 'kg', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'clove', 'slice', 'bunch', 'pinch', 'to taste'] },
    category: { type: 'string', enum: ['vegetables', 'fruit', 'grains', 'protein', 'dairy', 'pantry', 'spices'] },
  },
};

const MEAL = {
  type: 'object',
  additionalProperties: false,
  required: ['slot', 'title', 'summary', 'minutes', 'servings', 'ingredients', 'steps'],
  properties: {
    slot: { type: 'string', enum: MEAL_SLOTS },
    title: { type: 'string' },
    summary: { type: 'string' },
    minutes: { type: 'integer' },
    servings: { type: 'integer' },
    ingredients: { type: 'array', items: INGREDIENT },
    steps: { type: 'array', items: { type: 'string' } },
  },
};

const DAY_SCHEMA = { type: 'object', additionalProperties: false, required: ['meals'], properties: { meals: { type: 'array', items: MEAL } } };

const recipeRules = (people: number) => `Recipe format:
- title: the dish name. summary: one short sentence on what it is and why it suits a heart-healthy plan (no medical claims).
- minutes: total hands-on minutes. servings: ${people} for every meal and snack (cooking for ${people === 1 ? 'one person' : `${people} people`}); ingredient quantities are for all ${people} servings.
- ingredients: shopping names, lower case and singular ("red onion", "red rice", "sardine"), quantity for the servings, a unit from the list, and a shop category. Spices and salt use category "spices".
- steps: short numbered-style instructions without the numbers, 2 to 7 steps.`;

/** Titles for every meal of the week. */
async function outlineWeek(profile: UserProfile, guidance: MealGuidance, avoidTitles: string[]): Promise<Record<MealSlot, string>[]> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const days = await outlineOnce(profile, guidance, avoidTitles);
    if (days) return days;
    console.warn('meal outline was not usable, retrying');
  }
  throw new Error('meal outline failed twice');
}

async function outlineOnce(profile: UserProfile, guidance: MealGuidance, avoidTitles: string[]): Promise<Record<MealSlot, string>[] | undefined> {
  const { text } = await chat({
    model: MEAL_MODEL,
    max_tokens: 3000,
    temperature: 0.8,
    response_format: { type: 'json_schema', json_schema: { name: 'outline', strict: true, schema: OUTLINE_SCHEMA } },
    messages: [
      { role: 'system', content: 'You plan healthy, realistic home meals for a cholesterol app. You write only food, never medical advice.' },
      {
        role: 'user',
        content: `Plan 7 days of meals${peopleOf(profile) > 1 ? ` for a household of ${peopleOf(profile)}` : ' for one person'}: ${MEAL_SLOTS.map((s) => SLOT_LABELS[s].toLowerCase()).join(', ')}.\n${userBrief(profile, guidance)}\n\nGive only dish names. Every dish in the week is different; vary proteins and grains across days.${
          avoidTitles.length ? `\nDon't repeat these dishes from last week: ${avoidTitles.slice(0, 40).join('; ')}.` : ''
        }`,
      },
    ],
  });
  const days = parseJson<{ days: Record<MealSlot, string>[] }>(text)?.days;
  return days && days.length >= 7 ? days.slice(0, 7) : undefined;
}

function parseJson<T>(text: string): T | undefined {
  try {
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Plant foods whose names contain an animal-food word ("coconut milk", "peanut butter", "butter beans"). */
const PLANT_NAMES = /\b(coconut|almond|soy|soya|oat|rice|cashew|plant)[- ](milk|cream|yoghurt|yogurt|curd)\b|\b(peanut|nut|almond|cashew|cocoa|shea) butter\b|\bbutter (beans?|lettuce|squash)\b|\bcream crackers?\b/g;

/** An ingredient that breaks the user's avoid list or the never-use list, if any (whole words, so "nut" isn't "coconut"). */
function violation(meal: Meal, banned: string[]): string | undefined {
  const text = [meal.title, ...meal.ingredients.map((i) => i.name)].join(' | ').toLowerCase().replace(PLANT_NAMES, ' ');
  return banned.find((b) => b && new RegExp(`\\b${escape(b)}(e?s)?\\b`).test(text));
}

function bannedTerms(profile: UserProfile, guidance: MealGuidance): string[] {
  const food = profile.food ?? DEFAULT_FOOD;
  const expand: Record<string, string[]> = {
    beef: ['beef'],
    pork: ['pork', 'bacon', 'ham'],
    seafood: ['fish', 'prawn', 'shrimp', 'crab', 'squid', 'tuna', 'sardine', 'mackerel', 'salmon', 'cuttlefish'],
    dairy: ['milk', 'yoghurt', 'yogurt', 'cheese', 'butter', 'curd', 'cream', 'paneer'],
    eggs: ['egg'],
    nuts: ['almond', 'cashew', 'walnut', 'peanut', 'pistachio', 'hazelnut', 'nut'],
    mushrooms: ['mushroom'],
  };
  const fromAvoid = food.avoid.flatMap((a) => expand[a] ?? (a.length > 2 ? [a.toLowerCase()] : []));
  const fromDiet =
    food.dietType === 'vegan'
      ? ['chicken', 'beef', 'pork', 'mutton', 'lamb', 'fish', 'prawn', 'egg', 'milk', 'yoghurt', 'yogurt', 'cheese', 'curd', 'honey']
      : food.dietType === 'vegetarian'
        ? ['chicken', 'beef', 'pork', 'mutton', 'lamb', 'fish', 'prawn', 'tuna', 'sardine', 'mackerel', 'salmon']
        : food.dietType === 'pescatarian'
          ? ['chicken', 'beef', 'pork', 'mutton', 'lamb']
          : [];
  return [...new Set([...fromAvoid, ...fromDiet, ...guidance.neverUse])];
}

/** Writes the recipes for some meals of one day, retrying once if a rule is broken. */
async function writeMeals(profile: UserProfile, guidance: MealGuidance, wanted: Partial<Record<MealSlot, string>>, note = ''): Promise<Meal[]> {
  const banned = bannedTerms(profile, guidance);
  const slots = MEAL_SLOTS.filter((s) => wanted[s]);
  let extra = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    const { text, finishReason } = await chat({
      model: MEAL_MODEL,
      max_tokens: 6000,
      temperature: 0.5,
      response_format: { type: 'json_schema', json_schema: { name: 'day', strict: true, schema: DAY_SCHEMA } },
      messages: [
        { role: 'system', content: 'You write healthy, realistic home recipes for a cholesterol app. You write only food, never medical advice.' },
        {
          role: 'user',
          content: `${userBrief(profile, guidance)}\n\n${recipeRules(peopleOf(profile))}\n\nWrite these recipes, one per slot:\n${slots.map((s) => `- ${s}: ${wanted[s]}`).join('\n')}${note}${extra}`,
        },
      ],
    });
    if (finishReason === 'length') throw new Error('meal recipes were cut off');
    const parsed = parseJson<{ meals: Meal[] }>(text);
    if (!parsed) {
      // Models occasionally return malformed JSON even in strict mode; ask again.
      console.warn('meal recipes were not valid JSON, retrying');
      continue;
    }
    const meals = parsed.meals.filter((m) => slots.includes(m.slot));
    const broken = meals.map((m) => violation(m, banned)).find(Boolean);
    if (!broken && slots.every((s) => meals.some((m) => m.slot === s))) {
      return slots.map((s) => tidy(meals.find((m) => m.slot === s)!));
    }
    if (broken) console.warn('meal rule broken, retrying:', broken);
    extra = broken ? `\nImportant: the last attempt used "${broken}", which is not allowed. Choose different ingredients or a different dish.` : '\nWrite exactly one recipe for every slot listed.';
  }
  throw new Error('meal recipes broke the rules three times');
}

const tidy = (m: Meal): Meal => ({
  ...m,
  minutes: Math.max(1, Math.round(m.minutes)),
  servings: Math.max(1, Math.round(m.servings)),
  ingredients: m.ingredients.filter((i) => i.name.trim()).map((i) => ({ ...i, name: i.name.trim().toLowerCase(), quantity: Math.max(0, i.quantity) })),
  steps: m.steps.map((s) => s.trim()).filter(Boolean),
});

/** A full week starting on `weekStart`. */
export async function writeWeek(profile: UserProfile, guidance: MealGuidance, weekStart: IsoDate, avoidTitles: string[]): Promise<MealDay[]> {
  const outline = await outlineWeek(profile, guidance, avoidTitles);
  return Promise.all(outline.map(async (titles, i) => ({ date: addDays(weekStart, i), meals: await writeMeals(profile, guidance, titles) })));
}

/** A different meal for one slot, unlike the rest of that day. */
export async function writeReplacement(profile: UserProfile, guidance: MealGuidance, slot: MealSlot, current: Meal, sameDay: Meal[]): Promise<Meal> {
  const others = sameDay.filter((m) => m.slot !== slot).map((m) => m.title);
  const [meal] = await writeMeals(
    profile,
    guidance,
    { [slot]: `a new ${SLOT_LABELS[slot].toLowerCase()} dish of your choice (not "${current.title}")` },
    `\nThe rest of the day is: ${others.join('; ')}. Pick something different from all of these.`,
  );
  return meal!;
}
