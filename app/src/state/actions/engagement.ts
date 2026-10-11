import { markCelebrated, rateHabit, stepWeeklyGoal } from '@lipidly/domain';
import type { Difficulty } from '@lipidly/rules';
import { today } from '../ids';
import { updateUser } from '../store';

/** Weekly goal, weekly ratings and milestone celebrations (F14). Saved on the phone and synced. */

export function stepGoal(delta: 1 | -1) {
  const t = today();
  updateUser((d) => stepWeeklyGoal(d, t, delta));
}

export function rate(planHabitId: string, rating: Difficulty) {
  const t = today();
  updateUser((d) => rateHabit(d, t, planHabitId, rating));
}

export function celebrate(ids: string[]) {
  if (ids.length) updateUser((d) => markCelebrated(d, ids));
}
