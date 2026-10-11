import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { saveFoodPreferences } from '@/state/actions/onboarding';
import { useUserData } from '@/state/hooks';
import type { FoodPreferences } from '@/state/types';
import { Button, Screen, Text, TopBar } from '@/ui';
import { DEFAULT_FOOD } from '../onboarding/options';
import { FoodPreferencesFields } from './FoodPreferencesFields';

/** Profile → Food preferences: what meal ideas are written around (F13.4). */
export default function FoodPreferencesScreen() {
  const profile = useUserData().profile;
  const [food, setFood] = useState<FoodPreferences>(profile?.food ?? DEFAULT_FOOD);

  const save = () => {
    saveFoodPreferences(food);
    router.back();
  };

  return (
    <Screen gap={14} footer={<Button label="Save" onPress={save} disabled={!profile || food.cuisines.length === 0} />}>
      <TopBar />
      <View style={{ gap: 4 }}>
        <Text variant="h1" accessibilityRole="header">
          Food preferences
        </Text>
        <Text variant="body" color="muted">
          Your meal ideas are written around these. Changes apply to your next week of meals.
        </Text>
      </View>
      <FoodPreferencesFields value={food} onChange={setFood} />
    </Screen>
  );
}
