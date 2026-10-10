import { addDays } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { fmtDate, fmtDayMonth, fmtTime } from '@/lib/format';
import { stopMedicine } from '@/state/actions/tracking';
import { useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import { Button, Callout, Card, DetailList, ListGroup, ListRow, Screen, ScreenState, Text, TopBar, WeekStrip } from '@/ui';
import { endDate } from './medicineUtils';

/** Fields exactly as written on the prescription, last 7 days, source (28, F7.7). */
export default function MedicineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { medicines, doses, prescriptions } = useUserData();
  const m = medicines.find((x) => x.id === id);

  if (!m) {
    return (
      <Screen>
        <TopBar />
        <ScreenState kind="error" title="Medicine not found" />
      </Screen>
    );
  }

  const rx = prescriptions.find((p) => p.id === m.prescriptionId);
  const end = endDate(m);
  const t = today();
  const days = Array.from({ length: 7 }, (_, i) => addDays(t, i - 6));
  const week = days.map((date) => {
    const events = doses.filter((d) => d.medicineId === m.id && d.date === date);
    const taken = events.length > 0 && events.every((e) => e.outcome === 'taken');
    const state = taken ? ('done' as const) : date === t ? ('today' as const) : date < m.startDate ? ('future' as const) : ('missed' as const);
    return { date, state };
  });
  const takenCount = week.filter((d) => d.state === 'done').length;
  const skippedCount = week.filter((d) => d.state === 'missed').length;

  const rows: [string, string][] = [
    ['Dose', m.dose],
    ['How often', [m.frequency, m.timing.toLowerCase()].filter(Boolean).join(', ')],
    ['Duration', end ? `${m.duration}, to ${fmtDayMonth(end)}` : m.duration || '–'],
    ['Reminder', m.times.map(fmtTime).join(', ')],
  ];

  return (
    <Screen
      gap={12}
      footer={
        <Button
          label="Stop tracking this medicine"
          variant="ghost"
          onPress={() =>
            Alert.alert('Stop tracking?', 'Reminders for this medicine will stop. Only change your medicines on your doctor’s advice.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Stop',
                onPress: () => {
                  stopMedicine(m.id);
                  router.back();
                },
              },
            ])
          }
        />
      }
    >
      <TopBar />
      <View>
        <Text variant="h1" accessibilityRole="header">
          {m.name} {m.strength}
        </Text>
        <Text variant="small" color="muted">
          As written on your prescription
        </Text>
      </View>
      <DetailList rows={rows} />
      <Card style={{ gap: 12 }}>
        <View style={styles.row}>
          <Text variant="bodyStrong">Last 7 days</Text>
          <Text variant="small" color="muted">
            {takenCount} taken {'·'} {skippedCount} skipped
          </Text>
        </View>
        <WeekStrip days={week} />
      </Card>
      {rx && (
        <ListGroup>
          <ListRow title="Source prescription" subtitle={`${fmtDate(rx.date)}${rx.doctor ? ` · ${rx.doctor}` : ''}`} onPress={() => router.push('/reports/viewer')} />
        </ListGroup>
      )}
      <Callout tone="soft">Questions about this medicine or side effects? Ask your doctor or pharmacist.</Callout>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 10 },
});
