import { MARKER_LABELS, habitById, nextSwapDate, swapOptions } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { fmtDayMonth } from '@/lib/format';
import { swapHabit } from '@/state/actions/plan';
import { useOverview } from '@/state/hooks';
import { today } from '@/state/ids';
import { Button, RadioCard, Screen, ScreenState, Tap, Text, TopBar } from '@/ui';
import { lifestyleSummary } from '../onboarding/options';

/** Only habits that fit the user's answers; doctor-covered habits shown but disabled (13). */
export default function SwapHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, plan, proposal, profile } = useOverview();
  const owner = [proposal, plan].find((p) => p?.habits.some((h) => h.id === id));
  const current = owner?.habits.find((h) => h.id === id);
  const [picked, setPicked] = useState<string>();

  if (!owner || !current || !owner.focusGroup || !profile) {
    return (
      <Screen>
        <TopBar left="close" />
        <ScreenState kind="empty" title="Nothing to swap" message="This habit can't be swapped." />
      </Screen>
    );
  }

  const gate = owner.status === 'active' ? nextSwapDate(owner.lastSwap, today()) : { allowed: true as const };
  const doctorKeys = data.doctorHabits.flatMap((h) => h.conflictKeys);
  const inPlan = owner.habits.flatMap((h) => (h.habitId ? [h.habitId] : []));
  const options = swapOptions(owner.focusGroup, profile, inPlan, doctorKeys);
  const focusName = owner.focus ? MARKER_LABELS[owner.focus] : 'Your';

  const confirm = () => {
    if (!picked) return;
    const res = swapHabit(owner.id, current.id, picked);
    if (res.ok) router.back();
  };

  return (
    <Screen gap={12} footer={<Button label="Swap habit" onPress={confirm} disabled={!picked || !gate.allowed} />}>
      <TopBar left="close" />
      <Text variant="h1" style={{ fontSize: 28, lineHeight: 30 }} accessibilityRole="header">
        Swap "{current.title}"
      </Text>
      <View style={{ gap: 4 }}>
        <Text variant="body" color="muted">
          {focusName} habits that fit your answers
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }}>
          <Text variant="small" weight={400} color="muted">
            {lifestyleSummary(profile.lifestyle)} {'·'}{' '}
          </Text>
          <Tap onPress={() => router.push({ pathname: '/onboarding/lifestyle', params: { edit: '1' } })} accessibilityLabel="Edit your answers">
            <Text variant="smallStrong" color="primary">
              Edit
            </Text>
          </Tap>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {options.length === 0 && (
          <Text variant="body" color="muted">
            No other habits fit your answers right now. Editing your answers may show more.
          </Text>
        )}
        {options.map((o) => (
          <RadioCard
            key={o.habit.id}
            title={o.habit.title}
            subtitle={o.disabledReason ? 'Already covered by your doctor’s habit' : o.habit.summary}
            selected={picked === o.habit.id}
            disabled={!!o.disabledReason || !gate.allowed}
            onPress={() => setPicked(o.habit.id)}
          />
        ))}
      </View>
      {owner.status === 'active' && (
        <Text variant="small" weight={400} color="muted" style={{ fontSize: 14 }}>
          You can swap one habit every two weeks.
          {gate.allowed ? '' : ` Next swap opens ${fmtDayMonth(gate.opensOn!)}.`}
        </Text>
      )}
      {picked && habitById(picked)?.category === 'activity' && profile.lifestyle.physicalLimit === 'pain' && (
        <Text variant="small" color="muted">
          Please ask your doctor what activity is safe for you first.
        </Text>
      )}
    </Screen>
  );
}
