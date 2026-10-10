import { router } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { fmtTime } from '@/lib/format';
import { requestNotificationPermission } from '@/services/notifications';
import { setHabitReminder } from '@/state/actions/plan';
import { updateReminders } from '@/state/actions/tracking';
import { useOverview } from '@/state/hooks';
import { Button, Callout, DateField, ListGroup, ListRow, Mascot, Screen, Text } from '@/ui';

/** Set reminder times and allow notifications, then land on Home (journey 1, steps 11–12). */
export default function RemindersSetupScreen() {
  const { data, plan } = useOverview();
  const [checkInTime, setCheckInTime] = useState(data.reminders.checkInTime);
  const [busy, setBusy] = useState(false);
  const habits = plan?.habits.filter((h) => h.source === 'app' && h.committed) ?? [];

  const finish = async (allow: boolean) => {
    setBusy(true);
    updateReminders({ checkInTime });
    if (allow) await requestNotificationPermission();
    setBusy(false);
    router.dismissTo('/home');
  };

  return (
    <Screen
      padding="onboarding"
      gap={16}
      contentStyle={{ paddingTop: 72 }}
      footer={
        <>
          <Button label="Allow reminders" icon={Bell} onPress={() => finish(true)} loading={busy} />
          <Button label="Not now" variant="ghost" onPress={() => finish(false)} />
        </>
      }
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <Text variant="displayL" style={{ flex: 1, fontSize: 32, lineHeight: 34 }} accessibilityRole="header">
          When should we remind you?
        </Text>
        <Mascot size={64} mood="happy" />
      </View>
      <Text variant="body" color="muted">
        One gentle nudge a day for your check-in, plus a reminder for habits with a time.
      </Text>
      <ListGroup>
        <ListRow
          title="Daily check-in"
          subtitle="Takes under a minute"
          trailing={<DateField compact mode="time" label="Check-in time" value={checkInTime} display={fmtTime(checkInTime)} onChange={setCheckInTime} />}
        />
        {habits.map((h) => (
          <ListRow
            key={h.id}
            title={h.title}
            subtitle="Habit nudge"
            trailing={
              <DateField
                compact
                mode="time"
                label={`${h.title} reminder`}
                value={h.reminderTime}
                display={h.reminderTime ? fmtTime(h.reminderTime) : 'Off'}
                placeholder="Set"
                onChange={(time) => setHabitReminder(plan!.id, h.id, time)}
              />
            }
          />
        ))}
      </ListGroup>
      <Callout tone="lilac">At most 3 reminders a day besides medicines. Notifications never show your results or medicine names.</Callout>
    </Screen>
  );
}
