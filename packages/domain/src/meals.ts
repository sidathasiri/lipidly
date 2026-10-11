import { mealGuidance, type MealGuidance } from '@lipidly/rules';
import { activePlan, openEscalation } from './plan-builder';
import type { Ingredient, Meal, MealPlan, MealSlot, ShoppingCategory, UserData } from './types';

/** Meal plans (spec F13): a week of meal ideas written by the backend, plus its shopping list. */

export const MEAL_SLOTS: MealSlot[] = ['breakfast', 'morningSnack', 'lunch', 'afternoonSnack', 'dinner'];

export const SLOT_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  morningSnack: 'Morning snack',
  lunch: 'Lunch',
  afternoonSnack: 'Afternoon snack',
  dinner: 'Dinner',
};

export const SHOPPING_CATEGORIES: { value: ShoppingCategory; label: string }[] = [
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruit', label: 'Fruit' },
  { value: 'protein', label: 'Fish, meat, eggs and pulses' },
  { value: 'grains', label: 'Rice, grains and bread' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'pantry', label: 'Oils, nuts and pantry' },
  { value: 'spices', label: 'Herbs and spices' },
];

/** Who may get meal plans, and the rules the meals follow, from the user's current plan. */
export function mealGuidanceFor(d: UserData): MealGuidance | undefined {
  if (!d.profile) return undefined;
  return mealGuidance({ profile: d.profile, focusGroup: activePlan(d)?.focusGroup ?? null, escalated: !!openEscalation(d) });
}

export const latestMealPlan = (d: UserData): MealPlan | undefined => d.mealPlans?.[0];

/** Keeps only the new plan (and forgets ticks from older shopping lists). */
export function setMealPlan(d: UserData, plan: MealPlan) {
  d.mealPlans = [plan];
  d.shoppingChecked = d.shoppingChecked?.[plan.id] ? { [plan.id]: d.shoppingChecked[plan.id]! } : {};
}

export function replaceMeal(d: UserData, planId: string, date: string, meal: Meal): boolean {
  const day = d.mealPlans?.find((p) => p.id === planId)?.days.find((x) => x.date === date);
  const i = day?.meals.findIndex((m) => m.slot === meal.slot) ?? -1;
  if (!day || i < 0) return false;
  day.meals[i] = meal;
  return true;
}

export function toggleShoppingItem(d: UserData, planId: string, key: string) {
  const checked = new Set(d.shoppingChecked?.[planId] ?? []);
  if (checked.has(key)) checked.delete(key);
  else checked.add(key);
  d.shoppingChecked = { ...d.shoppingChecked, [planId]: [...checked] };
}

const round = (n: number) => (n >= 10 ? Math.round(n) : Math.round(n * 4) / 4);

/** "2 tbsp", "300 g", "1 piece", "to taste". */
export function formatAmount(quantity: number, unit: Ingredient['unit']): string {
  if (unit === 'to taste') return 'to taste';
  const q = round(quantity);
  const text = q % 1 === 0 ? String(q) : q.toFixed(2).replace(/0+$/, '');
  return unit === 'piece' ? text : `${text} ${unit}`;
}

export interface ShoppingItem {
  /** Stable key for ticking it off: the ingredient name. */
  key: string;
  name: string;
  /** Totals per unit, e.g. "2 piece · 3 tbsp". */
  amount: string;
}

/** The week's ingredients added up per name and unit, grouped by shop section. */
export function shoppingList(plan: MealPlan): { category: ShoppingCategory; label: string; items: ShoppingItem[] }[] {
  const byName = new Map<string, { category: ShoppingCategory; totals: Map<Ingredient['unit'], number> }>();
  for (const day of plan.days) {
    for (const meal of day.meals) {
      for (const ing of meal.ingredients) {
        const name = ing.name.trim().toLowerCase();
        if (!name) continue;
        const entry = byName.get(name) ?? { category: ing.category, totals: new Map() };
        entry.totals.set(ing.unit, (entry.totals.get(ing.unit) ?? 0) + (ing.unit === 'to taste' ? 0 : ing.quantity));
        byName.set(name, entry);
      }
    }
  }
  return SHOPPING_CATEGORIES.map(({ value, label }) => ({
    category: value,
    label,
    items: [...byName.entries()]
      .filter(([, e]) => e.category === value)
      .map(([name, e]) => ({
        key: name,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        amount: [...e.totals.entries()].map(([unit, q]) => formatAmount(q, unit)).join(' · '),
      }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  })).filter((s) => s.items.length > 0);
}
