import type { LifestyleAnswers } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { saveLifestyle } from '@/state/actions/onboarding';
import { useUserData } from '@/state/hooks';
import { Button, ChipGroup, ProgressBar, Screen, Section, Text, TopBar } from '@/ui';
import type { FoodPreferences } from '@/state/types';
import { FoodPreferencesFields } from '../meals/FoodPreferencesFields';
import { COOKS_OPTIONS, DEFAULT_FOOD, DEFAULT_LIFESTYLE, EATS_OUT_OPTIONS, EQUIPMENT_OPTIONS, LIMIT_OPTIONS, PLACE_OPTIONS, TIME_OPTIONS } from './options';

/**
 * "What fits your life" (36): five questions that decide which habits are offered (F1.9), and,
 * during onboarding, food preferences for meal ideas (F13). With `edit=1` it is opened from Profile
 * and saves in place (food preferences then live on their own screen).
 */
export default function LifestyleScreen() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const editing = edit === '1';
  const profile = useUserData().profile;
  const [l, setL] = useState<LifestyleAnswers>(profile?.lifestyle ?? DEFAULT_LIFESTYLE);
  const set = (patch: Partial<LifestyleAnswers>) => setL((x) => ({ ...x, ...patch }));
  const setOther = (key: keyof NonNullable<LifestyleAnswers['other']>, values: string[]) => set({ other: { ...l.other, [key]: values } });
  const [food, setFood] = useState<FoodPreferences>(profile?.food ?? DEFAULT_FOOD);

  const save = () => {
    // Food preferences are asked here during onboarding; afterwards they have their own screen.
    saveLifestyle(l, editing ? undefined : food);
    if (editing) router.back();
    else router.replace('/onboarding/first-report');
  };

  return (
    <Screen padding="onboarding" gap={14} footer={<Button label={editing ? 'Save' : 'Continue'} onPress={save} disabled={(l.places.length === 0 && !l.other?.places?.length) || (!editing && food.cuisines.length === 0)} />}>
      <TopBar left="back" center={editing ? undefined : <ProgressBar segments={6} filled={5} accessibilityLabel="Step 5 of 6" />} />
      <View style={{ gap: 4 }}>
        <Text variant="h1" accessibilityRole="header">
          What fits your life
        </Text>
        <Text variant="body" color="muted">
          We'll only suggest habits you can do.
        </Text>
      </View>
      <Section title="Free time for activity on a normal day" gap={6}>
        <ChipGroup dense options={TIME_OPTIONS} value={[l.timeFree]} onChange={([timeFree]) => set({ timeFree: timeFree! })} />
      </Section>
      <Section title="Where can you be active?" gap={6}>
        <ChipGroup dense multiple options={PLACE_OPTIONS} value={l.places} onChange={(places) => set({ places })} other={{ values: l.other?.places ?? [], onChange: (v) => setOther('places', v) }} />
      </Section>
      <Section title="Equipment you can use" gap={6}>
        <ChipGroup
          dense
          multiple
          exclusiveValue="none"
          options={EQUIPMENT_OPTIONS}
          value={l.equipment}
          onChange={(equipment) => set({ equipment: equipment.length ? equipment : ['none'] })}
          other={{ values: l.other?.equipment ?? [], onChange: (v) => setOther('equipment', v) }}
        />
      </Section>
      <Section title="Physical limits" gap={6}>
        <ChipGroup
          dense
          options={LIMIT_OPTIONS}
          value={[l.physicalLimit]}
          onChange={([physicalLimit]) => set({ physicalLimit: physicalLimit! })}
          other={{ values: l.other?.physicalLimits ?? [], onChange: (v) => setOther('physicalLimits', v) }}
        />
      </Section>
      <Section title="Meals" gap={8}>
        <Text variant="small" color="muted">
          Who cooks at home?
        </Text>
        <ChipGroup dense options={COOKS_OPTIONS} value={[l.cooks]} onChange={([cooks]) => set({ cooks: cooks! })} />
        <Text variant="small" color="muted">
          Eat out or from a canteen
        </Text>
        <ChipGroup dense options={EATS_OUT_OPTIONS} value={[l.eatsOut]} onChange={([eatsOut]) => set({ eatsOut: eatsOut! })} />
      </Section>
      {!editing && (
        <Section title="Food you like" gap={8}>
          <Text variant="small" color="muted">
            For your meal ideas. You can change these later in Profile.
          </Text>
          <FoodPreferencesFields value={food} onChange={setFood} />
        </Section>
      )}
    </Screen>
  );
}
