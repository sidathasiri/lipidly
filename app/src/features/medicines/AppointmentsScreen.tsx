import { router } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { Alert, StyleSheet, View } from 'react-native';
import { dayOfMonth, fmtDate, fmtLongDate, fmtMonthShort, fmtTime } from '@/lib/format';
import { deleteAppointment } from '@/state/actions/tracking';
import { useUserData } from '@/state/hooks';
import { nowLocal } from '@/state/ids';
import { Button, Card, colors, DateTile, ListGroup, ListRow, Screen, ScreenState, Section, Text, TopBar } from '@/ui';

/** Upcoming appointment with reminders, and past visits (29, F7.9). */
export default function AppointmentsScreen() {
  const { appointments } = useUserData();
  const now = nowLocal();
  const upcoming = appointments.filter((a) => a.dateTime >= now).sort((a, b) => a.dateTime.localeCompare(b.dateTime));
  const past = appointments.filter((a) => a.dateTime < now).sort((a, b) => b.dateTime.localeCompare(a.dateTime));

  const remove = (id: string) =>
    Alert.alert('Remove appointment?', '', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => deleteAppointment(id) },
    ]);

  return (
    <Screen topBar={<TopBar right={<Button label="Add" icon={Plus} size="xs" onPress={() => router.push('/medicines/appointment-new')} />} />} gap={12}>
      <Text variant="h1" accessibilityRole="header">
        Appointments
      </Text>
      {upcoming.length === 0 && past.length === 0 && (
        <ScreenState kind="empty" title="No appointments yet" message="Add your next visit and we'll remind you the day before and two hours before." actionLabel="Add an appointment" onAction={() => router.push('/medicines/appointment-new')} />
      )}
      {upcoming.map((a) => (
        <Card key={a.id} tone="sky" size="hero" padding={18} onPress={() => remove(a.id)} accessibilityLabel={`Appointment with ${a.doctor} on ${fmtDate(a.dateTime)}. Tap to remove.`}>
          <View style={styles.decor} />
          <View style={styles.row}>
            <DateTile month={fmtMonthShort(a.dateTime)} day={dayOfMonth(a.dateTime)} tone="white" />
            <View style={{ flex: 1, gap: 3 }}>
              <Text variant="title">{a.doctor}</Text>
              <Text variant="small" color="onSky" style={{ fontSize: 14 }}>
                {fmtLongDate(a.dateTime).split(',')[0]}, {fmtTime(a.dateTime.slice(11, 16))}
                {a.note ? ` · ${a.note}` : ''}
              </Text>
              <Text variant="small" weight={400} color="onSky">
                Reminders: day before, 2 hours before
              </Text>
            </View>
          </View>
        </Card>
      ))}
      {past.length > 0 && (
        <Section title="Past">
          <ListGroup>
            {past.map((a) => (
              <ListRow key={a.id} title={fmtDate(a.dateTime)} subtitle={a.doctor} onPress={() => remove(a.id)} />
            ))}
          </ListGroup>
        </Section>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  decor: { position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: colors.skyStrong },
  row: { flexDirection: 'row', gap: 14 },
});
