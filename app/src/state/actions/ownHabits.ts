import { MAX_OWN_HABITS, ownHabitsOf } from '@lipidly/domain';
import { newId } from '../ids';
import { updateUser } from '../store';
import type { OwnHabit } from '../types';

export { MAX_OWN_HABITS, medicineConflict, ownAsPlanHabits, ownHabitsOf, questionFor } from '@lipidly/domain';

export function saveOwnHabit(habit: Omit<OwnHabit, 'id'> & { id?: string }) {
  updateUser((d) => {
    const list = ownHabitsOf(d);
    if (habit.id) {
      d.ownHabits = list.map((h) => (h.id === habit.id ? { ...h, ...habit, id: h.id } : h));
    } else if (list.length < MAX_OWN_HABITS) {
      d.ownHabits = [...list, { ...habit, id: newId('own_') }];
    }
  });
}

export function removeOwnHabit(id: string) {
  updateUser((d) => {
    d.ownHabits = ownHabitsOf(d).filter((h) => h.id !== id);
  });
}
