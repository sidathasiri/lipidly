import { weekDots } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plural } from '@/lib/format';
import { useOverview } from '@/state/hooks';
import { dailyHabits } from '@/state/actions/plan-builder';
import { today } from '@/state/ids';
import { Button, colors, Confetti, Mascot, radius, Screen, Text, WeekStrip } from '@/ui';

/** Closes the loop for the day: celebration, the week so far, encouragement (09). */
export default function CheckInDoneScreen() {
  const insets = useSafeAreaInsets();
  const { date } = useLocalSearchParams<{ date?: string }>();
  const { data, plan } = useOverview();
  const day = date ?? today();
  const checkIn = data.checkIns[day];
  const habits = dailyHabits(data, plan);
  const kept = habits.filter((h) => checkIn?.answers[h.id]).length;
  const missed = habits.find((h) => checkIn?.answers[h.id] === false);
  const week = weekDots(Object.keys(data.checkIns), today());
  const weekCount = week.filter((d) => d.state === 'done').length;

  const message =
    kept === habits.length
      ? `You kept all ${habits.length} habits. Lovely work.`
      : `You kept ${kept} of ${habits.length} habits.${missed ? ` Tomorrow is a fresh go at “${missed.title.toLowerCase()}”.` : ''}`;

  return (
    <Screen background="primary" scroll={false} padding="onboarding" contentStyle={{ paddingTop: insets.top + 80 }} footer={<Button label="Close" variant="onPrimary" onPress={() => router.dismissTo('/home')} />}>
      <Confetti />
      <View style={styles.center}>
        <Mascot size={122} tone="cyan" mood="celebrating" bounce />
        <Text variant="hero" color="white" align="center" accessibilityRole="header">
          That's today done!
        </Text>
        <Text variant="body" color="white" align="center" style={{ fontSize: 16 }}>
          {message}
        </Text>
      </View>
      <View style={styles.panel}>
        <Text variant="smallStrong" color="cyan">
          This week so far
        </Text>
        <WeekStrip days={week} variant="onPrimary" />
        <Text variant="smallStrong" color="white" align="center">
          {plural(weekCount, 'check-in')} this week
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 14, marginBottom: 28 },
  panel: { backgroundColor: colors.primaryDeep, borderRadius: radius.card, padding: 18, gap: 14 },
});
