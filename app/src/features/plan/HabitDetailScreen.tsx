import { habitById, needsDoctorAdvice, needsLabels } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtTime } from '@/lib/format';
import { setHabitReminder } from '@/state/actions/plan';
import { useOverview } from '@/state/hooks';
import { Button, Callout, Chip, colors, DateField, IconButton, radius, Screen, ScreenState, Section, Text, TopBar } from '@/ui';

/** Why it helps, how to do it, local food tips, reminder time (12). */
export default function HabitDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plan, proposal, profile } = useOverview();
  const owner = [plan, proposal].find((p) => p?.habits.some((h) => h.id === id));
  const ph = owner?.habits.find((h) => h.id === id);
  const habit = ph?.habitId ? habitById(ph.habitId) : undefined;

  if (!owner || !ph) {
    return (
      <Screen>
        <TopBar />
        <ScreenState kind="error" title="Habit not found" message="It may have been swapped." />
      </Screen>
    );
  }

  return (
    <Screen
      gap={12}
      header={
        <View style={[styles.scene, { paddingTop: insets.top }]}>
          <View style={[styles.plate, { left: '28%' }]} />
          <View style={[styles.plateHalf, { left: '28%' }]} />
          <View style={[styles.blob, { left: '53%', top: 96, width: 52, height: 40, backgroundColor: '#86EFAC' }]} />
          <View style={[styles.blob, { left: '55%', top: 146, width: 48, height: 44, backgroundColor: '#FDBA74' }]} />
          <View style={[styles.blob, { right: 68, top: 90, width: 22, height: 22, backgroundColor: colors.cyan }]} />
          <View style={{ position: 'absolute', left: 20, top: insets.top + 12 }}>
            <IconButton kind="back" />
          </View>
        </View>
      }
      footer={
        habit && owner.status === 'active' ? (
          <Button label="Swap this habit" variant="secondary" onPress={() => router.push({ pathname: '/plan/swap/[id]', params: { id: ph.id } })} />
        ) : undefined
      }
    >
      <Text variant="h2" accessibilityRole="header">
        {habit?.title ?? ph.title}
      </Text>
      {ph.source === 'doctor' ? (
        <Callout tone="tint" title="From your doctor">
          This instruction came from your doctor, so it always comes first. Ask your doctor if you have questions about it.
        </Callout>
      ) : (
        habit && (
          <>
            <View style={styles.chips}>
              {needsLabels(habit).map((l) => (
                <Chip key={l} label={l} />
              ))}
            </View>
            {profile && needsDoctorAdvice(habit, profile) && (
              <Callout tone="sky">You mentioned pain or an injury. Please ask your doctor what activity is safe for you before you start.</Callout>
            )}
            <Section title="Why it helps" gap={4}>
              <Text variant="body" color="muted">
                {habit.why}
              </Text>
            </Section>
            <Section title="How to do it" gap={4}>
              <Text variant="body" color="muted">
                {habit.how}
              </Text>
            </Section>
            {habit.foods && (
              <View style={styles.chips}>
                {habit.foods.map((f) => (
                  <View key={f} style={styles.food}>
                    <Text variant="smallStrong">{f}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )
      )}
      {ph.source === 'app' && (
        <View style={styles.reminder}>
          <Text variant="bodyMedium" style={{ flex: 1 }}>
            Reminder
          </Text>
          <DateField
            compact
            mode="time"
            label="Reminder time"
            value={ph.reminderTime}
            display={ph.reminderTime ? fmtTime(ph.reminderTime) : 'Off'}
            placeholder="Set a time"
            onChange={(time) => setHabitReminder(owner.id, ph.id, time)}
          />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  scene: { height: 220, backgroundColor: colors.ice, borderBottomLeftRadius: radius.headerBottom, borderBottomRightRadius: radius.headerBottom, overflow: 'hidden' },
  plate: { position: 'absolute', top: 70, width: 170, height: 170, borderRadius: 85, backgroundColor: colors.white },
  plateHalf: { position: 'absolute', top: 70, width: 85, height: 170, borderTopLeftRadius: 85, borderBottomLeftRadius: 85, backgroundColor: '#F1F5F9' },
  blob: { position: 'absolute', borderRadius: 999 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  food: { backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  reminder: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 10, paddingLeft: 18, paddingRight: 10 },
});
