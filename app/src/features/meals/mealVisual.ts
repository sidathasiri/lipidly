import type { MealSlot } from '@lipidly/domain';
import { Apple, Coffee, Cookie, Salad, Soup, type LucideIcon } from 'lucide-react-native';
import type { TileTone } from '@/ui/components/Tiles';

/** Icon and tile colour per meal slot, shared by the meal list and the meal detail. */
export const SLOT_ICONS: Record<MealSlot, { icon: LucideIcon; tone: TileTone }> = {
  breakfast: { icon: Coffee, tone: 'sky' },
  morningSnack: { icon: Apple, tone: 'ice' },
  lunch: { icon: Salad, tone: 'tint' },
  afternoonSnack: { icon: Cookie, tone: 'ice' },
  dinner: { icon: Soup, tone: 'lilac' },
};
