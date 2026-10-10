import { addDays, startOfWeek, weeklySummary } from '@lipidly/rules';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fmtDayMonth, fmtMonth } from '@/lib/format';
import { saveCheckIn } from '@/state/actions/tracking';
import { useOverview } from '@/state/hooks';
import { dailyHabits } from '@/state/actions/plan-builder';
import { today } from '@/state/ids';
import { Button, Callout, Card, colors, ProgressBar, Screen, ScreenState, Text, TextField, TopBar } from '@/ui';

const BAR_COLORS = [colors.lilacBar, colors.cyanBar, colors.skyBar, colors.primary];

/** Days checked in and how often each habit was kept this week (F5.4, design 10). */
export default function WeeklySummaryScreen() {
  const { data, plan } = useOverview();
  const t = today();
  const start = startOfWeek(t);
  const end = addDays(start, 6);
  const [weight, setWeight] = useState(data.checkIns[t]?.weightKg ? String(data.checkIns[t]!.weightKg) : '');

  if (!plan) {
    return (
      <Screen>
        <TopBar />
        <ScreenState kind="empty" title="No plan yet" message="Your weekly summary appears once you start a plan." />
      </Screen>
    );
  }

  const habits = dailyHabits(data, plan);
  const summary = weeklySummary(Object.values(data.checkIns), habits.map((h) => h.id), start);
  const elapsed = Math.min(7, Math.round((Date.parse(t) - Date.parse(start)) / 86400000) + 1);
  const trickiest = habits.filter((h) => h.source === 'app').sort((a, b) => (summary.keptDays[a.id] ?? 0) - (summary.keptDays[b.id] ?? 0))[0];
  const range = `${fmtDayMonth(start).split(' ')[0]} – ${fmtDayMonth(end).split(' ')[0]} ${fmtMonth(end)}`;

  return (
    <Screen gap={12}>
      <TopBar />
      <View>
        <Text variant="small" color="muted" style={{ fontSize: 14 }}>
          {range}
        </Text>
        <Text variant="h1" accessibilityRole="header">
          Your week
        </Text>
      </View>
      <Card tone="primary" size="hero" padding={20}>
        <View style={styles.hero}>
          <Text variant="statL" color="white">
            {summary.daysCheckedIn}
          </Text>
          <View>
            <Text variant="title" color="white">
              of {elapsed} days
            </Text>
            <Text variant="bodyMedium" color="cyan">
              checked in
            </Text>
          </View>
        </View>
      </Card>
      <Card style={{ gap: 14 }}>
        {habits.map((h, i) => (
          <View key={h.id} style={{ gap: 6 }}>
            <View style={styles.habitRow}>
              <Text variant="label" style={{ flex: 1 }}>
                {h.title}
                {h.source !== 'app' && (
                  <Text variant="small" color="muted">
                    {h.source === 'doctor' ? ' · doctor' : ' · your own'}
                  </Text>
                )}
              </Text>
              <Text variant="smallStrong" color="muted">
                {summary.keptDays[h.id] ?? 0} days
              </Text>
            </View>
            <ProgressBar value={(summary.keptDays[h.id] ?? 0) / 7} height={12} fill={BAR_COLORS[i % BAR_COLORS.length]} accessibilityLabel={`${h.title}: kept ${summary.keptDays[h.id] ?? 0} of 7 days`} />
          </View>
        ))}
      </Card>
      {trickiest && (summary.keptDays[trickiest.id] ?? 0) < summary.daysCheckedIn && (
        <Callout tone="tint" mascot="calm">
          {`“${trickiest.title}” was the trickiest this week. If it keeps feeling hard, you can swap it for another that fits.`}
        </Callout>
      )}
      <Card style={{ gap: 10 }}>
        <Text variant="bodyStrong">
          Weight this week{' '}
          <Text variant="small" color="muted">
            (optional)
          </Text>
        </Text>
        <View style={styles.weightRow}>
          <View style={{ flex: 1 }}>
            <TextField value={weight} onChangeText={setWeight} keyboardType="decimal-pad" suffix="kg" placeholder="e.g. 77.5" accessibilityLabel="Weight in kilograms" />
          </View>
          <Button label="Save" size="sm" variant="tint" disabled={!Number(weight) || !data.checkIns[t]} onPress={() => saveCheckIn(t, data.checkIns[t]!.answers, Number(weight))} />
        </View>
        {!data.checkIns[t] && (
          <Text variant="small" weight={400} color="muted">
            Do today's check-in first, then add your weight here.
          </Text>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  habitRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
