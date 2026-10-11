import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { fmtWeekdayDate, plural } from '@/lib/format';
import { commitHabit, startPlan } from '@/state/actions/plan';
import { useOverview } from '@/state/hooks';
import { Button, Callout, Card, Chip, Screen, ScreenState, Text, TopBar } from '@/ui';
import { HabitRow } from './HabitRow';

/** Accept a new or updated plan: what changed, "I can do this" per habit, swap (14). */
export default function PlanProposalScreen() {
  const { data, proposal } = useOverview();

  if (!proposal) {
    return (
      <Screen topBar={<TopBar />}>
        <ScreenState kind="empty" title="No plan to review" message="A new plan appears here after you confirm a report." />
      </Screen>
    );
  }

  const isFirst = !data.plans.some((p) => p.status !== 'proposed');
  const appHabits = proposal.habits.filter((h) => h.source === 'app');
  const doctorHabits = proposal.habits.filter((h) => h.source === 'doctor');
  const left = appHabits.filter((h) => !h.committed).length;

  const start = () => {
    startPlan(proposal.id);
    if (isFirst) router.replace('/onboarding/reminders');
    else router.dismissTo('/plan');
  };

  return (
    <Screen topBar={<TopBar />}
      gap={12}
      footer={
        <>
          {left > 0 && (
            <Text variant="small" color="muted" align="center">
              {plural(left, 'habit')} left to commit to
            </Text>
          )}
          <Button label="Start plan" onPress={start} disabled={left > 0} />
        </>
      }
    >
      <Text variant="h1" accessibilityRole="header">
        {isFirst ? 'Your plan' : 'Your updated plan'}
      </Text>
      <Callout tone="tint" title={isFirst ? 'Why this focus' : 'What changed'}>
        {proposal.summary}
      </Callout>
      {proposal.suggestDoctor && <Callout tone="sky">It may help to talk to your doctor about this result at your next visit.</Callout>}
      <Text variant="small" color="muted">
        Habits that fit your answers {'·'} tap to commit
      </Text>
      <View style={{ gap: 8 }}>
        {appHabits.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            onPress={() => router.push({ pathname: '/plan/habit/[id]', params: { id: h.id } })}
            trailing={
              h.committed ? (
                <Chip label="Committed" icon={Check} />
              ) : (
                <View style={styles.actions}>
                  {proposal.focusGroup && <Button label="Swap" variant="ghost" size="xs" onPress={() => router.push({ pathname: '/plan/swap/[id]', params: { id: h.id } })} />}
                  <Button label="I can do this" size="xs" onPress={() => commitHabit(proposal.id, h.id)} />
                </View>
              )
            }
          />
        ))}
      </View>
      {doctorHabits.map((h) => (
        <Card key={h.id} padding={14} style={styles.inline}>
          <Text variant="bodyMedium" weight={500} color="muted">
            From your doctor
          </Text>
          <Text variant="bodyStrong" style={{ flexShrink: 1, textAlign: 'right' }}>
            {h.title}
          </Text>
        </Card>
      ))}
      <Card padding={14} style={styles.inline}>
        <Text variant="bodyMedium" weight={500} color="muted">
          Retest {'·'} {fmtWeekdayDate(proposal.retestDate)}
        </Text>
        <Button label="Change" variant="link" size="xs" onPress={() => router.push({ pathname: '/plan/retest', params: { planId: proposal.id } })} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
});
