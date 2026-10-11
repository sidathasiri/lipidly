import { habitById } from '@lipidly/rules';
import {
  Apple,
  Bike,
  CakeSlice,
  CigaretteOff,
  CupSoda,
  Dumbbell,
  Footprints,
  Salad,
  Soup,
  Star,
  Stethoscope,
  UtensilsCrossed,
  Wheat,
  WineOff,
  type LucideIcon,
} from 'lucide-react-native';
import type { PlanHabit } from '@/state/types';

type Tone = 'tint' | 'sky' | 'lilac' | 'ice';

const BY_ID: Record<string, { icon: LucideIcon; tone: Tone }> = {
  'no-sugary-drinks': { icon: CupSoda, tone: 'lilac' },
  'half-rice-dinner': { icon: Soup, tone: 'ice' },
  'no-sweets-after-dinner': { icon: CakeSlice, tone: 'lilac' },
  'no-deep-fried': { icon: UtensilsCrossed, tone: 'ice' },
  'fruit-for-short-eats': { icon: Apple, tone: 'lilac' },
  'veg-or-dhal-two-meals': { icon: Salad, tone: 'ice' },
  'high-fibre-breakfast': { icon: Wheat, tone: 'ice' },
  'alcohol-free-day': { icon: WineOff, tone: 'tint' },
  'smoke-free-day': { icon: CigaretteOff, tone: 'tint' },
  'machine-25': { icon: Bike, tone: 'sky' },
  'gym-or-swim': { icon: Dumbbell, tone: 'sky' },
};

/** Small label naming where a habit came from: "From your doctor", "Your own", "Habit of the week", or none for core habits. */
export const habitLabel = (h: Pick<PlanHabit, 'source'>): string | undefined =>
  h.source === 'doctor' ? 'From your doctor' : h.source === 'own' ? 'Your own' : h.source === 'weekly' ? 'Habit of the week' : undefined;

/** Icon and tile tone for a habit, consistent across Home, Plan, Check-in and summaries. */
export function habitVisual(h: Pick<PlanHabit, 'source' | 'habitId'>): { icon: LucideIcon; tone: Tone } {
  if (h.source === 'doctor') return { icon: Stethoscope, tone: 'tint' };
  if (h.source === 'own') return { icon: Star, tone: 'lilac' };
  const known = h.habitId ? BY_ID[h.habitId] : undefined;
  if (known) return known;
  const category = h.habitId ? habitById(h.habitId)?.category : undefined;
  if (category === 'activity') return { icon: Footprints, tone: 'sky' };
  return { icon: UtensilsCrossed, tone: 'ice' };
}
