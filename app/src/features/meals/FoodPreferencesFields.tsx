import { View } from 'react-native';
import type { FoodPreferences } from '@/state/types';
import { ChipGroup, Text, TextField } from '@/ui';
import { AVOID_OPTIONS, CUISINE_OPTIONS, DIET_OPTIONS, PEOPLE_OPTIONS, splitChoices } from '../onboarding/options';

/** The food-preference questions for meal ideas (F13), shared by onboarding and Profile → Food preferences. */
export function FoodPreferencesFields({ value: food, onChange }: { value: FoodPreferences; onChange: (food: FoodPreferences) => void }) {
  const set = (patch: Partial<FoodPreferences>) => onChange({ ...food, ...patch });
  const cuisines = splitChoices(food.cuisines, 'cuisine');
  const avoid = splitChoices(food.avoid, 'avoid');
  return (
    <View style={{ gap: 8 }}>
      <Text variant="small" color="muted">
        Cuisines you enjoy (add your own)
      </Text>
      <ChipGroup
        dense
        multiple
        options={CUISINE_OPTIONS}
        value={cuisines.chips}
        onChange={(chips) => set({ cuisines: [...chips, ...cuisines.other] })}
        other={{ values: cuisines.other, onChange: (other) => set({ cuisines: [...cuisines.chips, ...other] }) }}
      />
      <Text variant="small" color="muted">
        How you eat
      </Text>
      <ChipGroup dense options={DIET_OPTIONS} value={[food.dietType]} onChange={([dietType]) => set({ dietType: dietType! })} />
      <Text variant="small" color="muted">
        Foods to leave out
      </Text>
      <ChipGroup
        dense
        multiple
        options={AVOID_OPTIONS}
        value={avoid.chips}
        onChange={(chips) => set({ avoid: [...chips, ...avoid.other] })}
        other={{ values: avoid.other, onChange: (other) => set({ avoid: [...avoid.chips, ...other] }) }}
      />
      <Text variant="small" color="muted">
        Cooking for
      </Text>
      <ChipGroup dense options={PEOPLE_OPTIONS} value={[String(food.people ?? 1)]} onChange={([people]) => set({ people: Number(people) })} />
      <TextField
        label="Anything else? (optional)"
        value={food.notes ?? ''}
        onChangeText={(notes) => set({ notes })}
        placeholder="e.g. I like spicy food, quick breakfasts"
        multiline
        maxLength={400}
      />
    </View>
  );
}
