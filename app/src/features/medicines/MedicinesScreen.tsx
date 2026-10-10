import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Check, Pill, Plus } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { dayOfMonth, fmtMonthShort, fmtTime, fmtWeekdayDate } from '@/lib/format';
import { recordDose } from '@/state/actions/tracking';
import { useUserData } from '@/state/hooks';
import { nowLocal, nowTime, today } from '@/state/ids';
import { Button, Card, Chip, colors, DateTile, Icon, IconTile, ListGroup, ListRow, Screen, ScreenState, Section, Text } from '@/ui';
import { daysLeft, todaysDoses, type TodayDose } from './medicineUtils';

const SNOOZE_MINUTES = 10;

/** The dose to act on now: the latest one already due and unanswered, else the next one coming up. */
function currentDose(list: TodayDose[]) {
  const open = list.filter((d) => !d.event || d.event.outcome === 'snoozed');
  const now = nowTime();
  return [...open].reverse().find((d) => d.time <= now) ?? open[0];
}

/** Today's doses with Taken / Skipped / Snooze in thumb reach; medicine list; next appointment (25). */
export default function MedicinesScreen() {
  const { medicines, doses, appointments } = useUserData();
  const active = medicines.filter((m) => m.active);
  const list = todaysDoses(medicines, doses);
  const current = currentDose(list);
  const now = nowLocal();
  const nextAppt = appointments.filter((a) => a.dateTime >= now).sort((a, b) => a.dateTime.localeCompare(b.dateTime))[0];

  const act = (d: TodayDose, outcome: 'taken' | 'skipped' | 'snoozed') => {
    recordDose(d.medicine.id, today(), d.time, outcome);
    if (outcome === 'snoozed') {
      Notifications.scheduleNotificationAsync({
        content: { title: 'Lipidly', body: 'Reminder: time for your medicine.', data: { url: '/medicines' } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: SNOOZE_MINUTES * 60 },
      }).catch(() => {});
    }
  };

  return (
    <Screen tabBar gap={12}>
      <View style={styles.titleRow}>
        <Text variant="h1" accessibilityRole="header">
          Medicines
        </Text>
        <Button label="Add" icon={Plus} size="xs" onPress={() => router.push('/medicines/add')} />
      </View>

      {active.length === 0 ? (
        <ScreenState
          kind="empty"
          title="No medicines yet"
          message="Add a prescription or pharmacy label and we'll remind you at each dose. We only show what's written on it."
          actionLabel="Add a prescription"
          onAction={() => router.push('/medicines/add')}
        />
      ) : (
        <Section title="Today" gap={10}>
          {list.map((d) =>
            d === current ? (
              <DoseCard key={`${d.medicine.id}-${d.time}`} dose={d} onAct={(o) => act(d, o)} />
            ) : (
              <Card key={`${d.medicine.id}-${d.time}`} padding={14}>
                <View style={styles.doseRow}>
                  <IconTile icon={Pill} tone="lilac" size={42} />
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                      {d.medicine.name} {d.medicine.strength}
                    </Text>
                    <Text variant="small" weight={400} color="muted">
                      {fmtTime(d.time)} {'·'} {d.medicine.timing.toLowerCase()}
                    </Text>
                  </View>
                  {d.event?.outcome === 'taken' ? (
                    <Chip label="Taken" icon={Check} />
                  ) : d.event?.outcome === 'skipped' ? (
                    <Chip tone="soft" label="Skipped" />
                  ) : (
                    <Button label="Taken" size="xs" variant="tint" onPress={() => act(d, 'taken')} />
                  )}
                </View>
              </Card>
            ),
          )}
        </Section>
      )}

      {active.length > 0 && (
        <Section title="Your medicines" gap={10}>
          <ListGroup>
            {active.map((m) => {
              const left = daysLeft(m);
              return (
                <ListRow
                  key={m.id}
                  title={`${m.name} ${m.strength}`}
                  subtitle={[m.frequency, left !== undefined ? `${left} days left` : null].filter(Boolean).join(' · ')}
                  onPress={() => router.push({ pathname: '/medicines/[id]', params: { id: m.id } })}
                />
              );
            })}
          </ListGroup>
        </Section>
      )}

      <Card tone="sky" onPress={() => router.push('/medicines/appointments')} accessibilityLabel="Appointments">
        <View style={styles.doseRow}>
          {nextAppt && <DateTile month={fmtMonthShort(nextAppt.dateTime)} day={dayOfMonth(nextAppt.dateTime)} tone="white" />}
          <View style={{ flex: 1 }}>
            <Text variant="overline" color="onSky" style={{ fontSize: 12 }}>
              {nextAppt ? 'Next appointment' : 'Appointments'}
            </Text>
            <Text variant="bodyStrong">{nextAppt ? `${fmtWeekdayDate(nextAppt.dateTime)} · ${nextAppt.doctor}` : 'Add a follow-up visit'}</Text>
          </View>
        </View>
      </Card>
    </Screen>
  );
}

function DoseCard({ dose, onAct }: { dose: TodayDose; onAct: (o: 'taken' | 'skipped' | 'snoozed') => void }) {
  const m = dose.medicine;
  return (
    <Card tone="primary" size="hero" raised padding={16} style={{ gap: 14 }}>
      <View style={styles.doseRow}>
        <View style={styles.doseIcon}>
          <Icon icon={Pill} size={22} color="white" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" color="white">
            {m.name} {m.strength}
          </Text>
          <Text variant="small" weight={400} color="white">
            {fmtTime(dose.time)} {'·'} {m.dose}, {m.timing.toLowerCase()}
            {dose.event?.outcome === 'snoozed' ? ` · snoozed ${SNOOZE_MINUTES} min` : ''}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Taken" variant="white" size="md" onPress={() => onAct('taken')} style={{ flex: 1.4 }} />
        <Button label="Skipped" variant="primaryDeep" size="md" onPress={() => onAct('skipped')} style={{ flex: 1 }} />
        <Button label="Snooze" variant="primaryDeep" size="md" onPress={() => onAct('snoozed')} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  doseRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  doseIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primaryDecor, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', gap: 8 },
});
