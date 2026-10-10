import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { fmtTime } from '@/lib/format';
import { updateReminders } from '@/state/actions/tracking';
import { dailyHabits } from '@/state/actions/plan-builder';
import { useOverview } from '@/state/hooks';
import { Card, DateField, ListGroup, ListRow, Screen, Text, Toggle, TopBar } from '@/ui';

/** Times, quiet hours and per-type switches (33). */
export default function ReminderSettingsScreen() {
  const { data, plan } = useOverview();
  const r = data.reminders;
  const nudges = dailyHabits(data, plan)
    .filter((h) => h.source !== 'doctor' && h.reminderTime)
    .map((h) => `${h.title} ${fmtTime(h.reminderTime!)}`);

  return (
    <Screen gap={12}>
      <TopBar />
      <Text variant="h1" accessibilityRole="header">
        Reminders
      </Text>
      <ListGroup>
        <ListRow
          title="Daily check-in"
          subtitle={r.checkInEnabled ? undefined : 'Off'}
          trailing={
            <View style={styles.pair}>
              {r.checkInEnabled && <DateField compact mode="time" label="Check-in time" value={r.checkInTime} display={fmtTime(r.checkInTime)} onChange={(checkInTime) => updateReminders({ checkInTime })} />}
              <Toggle value={r.checkInEnabled} onChange={(checkInEnabled) => updateReminders({ checkInEnabled })} accessibilityLabel="Daily check-in reminder" />
            </View>
          }
        />
        <ListRow
          title="Habit nudges"
          subtitle={nudges.length ? nudges.join(' · ') : 'Set a time on a habit in your plan'}
          trailing={<Toggle value={r.habitNudges} onChange={(habitNudges) => updateReminders({ habitNudges })} accessibilityLabel="Habit nudges" />}
        />
        <ListRow title="Medicine doses" subtitle="At each dose time, even in quiet hours" value="Always on" onPress={() => router.push('/medicines')} chevron={false} />
        <ListRow title="Retest" subtitle="2 weeks and 2 days before" trailing={<Toggle value={r.retest} onChange={(retest) => updateReminders({ retest })} accessibilityLabel="Retest reminders" />} />
        <ListRow title="Weekly summary" subtitle="Sunday evening" trailing={<Toggle value={r.weeklySummary} onChange={(weeklySummary) => updateReminders({ weeklySummary })} accessibilityLabel="Weekly summary" />} />
        <ListRow title="Come-back nudge" subtitle="After 3 days without a check-in" trailing={<Toggle value={r.comeBack} onChange={(comeBack) => updateReminders({ comeBack })} accessibilityLabel="Come-back nudge" />} />
      </ListGroup>
      <Card tone="lilac" style={styles.quiet}>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong">Quiet hours</Text>
          <Text variant="small" color="onLilac">
            Medicine doses still remind you
          </Text>
        </View>
        <View style={styles.pair}>
          <DateField compact mode="time" label="Quiet hours start" value={r.quietStart} display={fmtTime(r.quietStart)} onChange={(quietStart) => updateReminders({ quietStart })} />
          <Text variant="small" color="onLilac">
            {'–'}
          </Text>
          <DateField compact mode="time" label="Quiet hours end" value={r.quietEnd} display={fmtTime(r.quietEnd)} onChange={(quietEnd) => updateReminders({ quietEnd })} />
        </View>
      </Card>
      <Text variant="small" weight={400} color="muted" style={{ fontSize: 14 }}>
        At most 3 reminders a day besides medicines. Notifications never show your results or medicine names.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  quiet: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
});
