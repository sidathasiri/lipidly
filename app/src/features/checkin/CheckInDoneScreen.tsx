import { MILESTONE_TEXT, newMilestones } from '@lipidly/domain';
import { addDays, streaks, weekDots } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plural } from '@/lib/format';
import { celebrate } from '@/state/actions/engagement';
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

  const t = today();
  const dates = Object.keys(data.checkIns);
  const streak = streaks(dates, t).current;
  const comeback = day === t && dates.length > 1 && !data.checkIns[addDays(t, -1)];
  const weekly = habits.find((h) => h.source === 'weekly');
  const message = dayMessage({ kept, total: habits.length, streak, comeback, missedTitle: missed?.title, keptWeekly: !!(weekly && checkIn?.answers[weekly.id]) });

  // Milestones reached by this check-in are celebrated once (F14.4).
  const [milestone] = useState(() => newMilestones(data, t));
  useEffect(() => {
    celebrate(milestone);
  }, [milestone]);
  const highlight = milestone[0] ? MILESTONE_TEXT[milestone[0]] : undefined;

  return (
    <Screen background="primary" scroll={false} padding="onboarding" contentStyle={{ paddingTop: insets.top + 80 }} footer={<Button label="Close" variant="onPrimary" onPress={() => router.dismissTo('/home')} />}>
      <Confetti />
      <View style={styles.center}>
        <Mascot size={122} tone="cyan" mood="celebrating" bounce />
        <Text variant="hero" color="white" align="center" accessibilityRole="header">
          {highlight?.title ?? (streak >= 3 ? `${streak} days in a row!` : 'That\'s today done!')}
        </Text>
        {highlight && (
          <Text variant="bodyMedium" color="cyan" align="center" style={{ fontSize: 16 }}>
            {highlight.body}
          </Text>
        )}
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

/** The day's message varies with how it went, so check-ins don't read the same every day (F14.5). */
function dayMessage(x: { kept: number; total: number; streak: number; comeback: boolean; missedTitle?: string; keptWeekly: boolean }): string {
  const bonus = x.keptWeekly ? ' And you kept this week’s habit too.' : '';
  if (x.total > 0 && x.kept === x.total) return `You kept all ${x.total} habits. Lovely work.${bonus}`;
  if (x.comeback) return `Welcome back! You kept ${x.kept} of ${x.total} today. Picking it up again is what counts.`;
  if (x.kept === 0) return 'Thanks for checking in honestly. Tomorrow is a fresh start.';
  return `You kept ${x.kept} of ${x.total} habits.${x.missedTitle ? ` Tomorrow is a fresh go at “${x.missedTitle.toLowerCase()}”.` : ''}${bonus}`;
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', gap: 14, marginBottom: 28 },
  panel: { backgroundColor: colors.primaryDeep, borderRadius: radius.card, padding: 18, gap: 14 },
});
