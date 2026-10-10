import { MARKER_LABELS, addDays, weeklySummary } from '@lipidly/rules';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { fmtDayMonth, fmtTime, fmtWeekdayDate } from '@/lib/format';
import { MAX_OWN_HABITS, ownAsPlanHabits } from '@/state/actions/ownHabits';
import { useOverview } from '@/state/hooks';
import { today } from '@/state/ids';
import { AddRow, Button, Callout, Card, Chip, colors, ColouredHeader, Screen, ScreenState, Section, StatusChip, Text } from '@/ui';
import { HabitRow } from './HabitRow';

/** The current plan: focus marker, habits, retest date and mode (11). */
export default function PlanScreen() {
  const { data, plan, proposal, latestReport, escalation } = useOverview();

  if (!plan) {
    return (
      <Screen tabBar>
        <Text variant="h1" accessibilityRole="header">
          Your plan
        </Text>
        {proposal ? (
          <Callout tone="tint" title="Your plan is ready to review" action={<Button label="Review" size="xs" onPress={() => router.push('/plan/proposal')} />}>
            Commit to each habit to start.
          </Callout>
        ) : (
          <ScreenState
            kind="empty"
            title="No plan yet"
            message="Add a lab report and we'll suggest two or three habits that fit your life."
            actionLabel="Add a report"
            onAction={() => router.push('/reports/add')}
          />
        )}
      </Screen>
    );
  }

  const source = data.reports.find((r) => r.id === plan.sourceReportId) ?? latestReport;
  const focus = plan.focus;
  const value = focus && source ? source.values[focus] : undefined;
  const status = focus && source ? source.statuses[focus] : undefined;
  const habits = plan.habits.filter((h) => h.committed);
  const own = ownAsPlanHabits(data);
  const week = weeklySummary(Object.values(data.checkIns), [...habits, ...own].map((h) => h.id), addDays(today(), -6));
  const keptLine = (id: string, reminder?: string) =>
    [`Kept ${week.keptDays[id] ?? 0} of 7 days`, reminder ? fmtTime(reminder) : null].filter(Boolean).join(' \u00b7 ');

  return (
    <Screen
      tabBar
      header={
        <ColouredHeader tone="primary" paddingBottom={20}>
          <View style={styles.decor} />
          <View style={styles.titleRow}>
            <Text variant="h1" color="white" accessibilityRole="header">
              Your plan
            </Text>
            <Chip label={escalation ? 'Tracking' : plan.mode === 'maintenance' ? 'Maintenance mode' : 'Active mode'} />
          </View>
          {focus && value !== undefined && status ? (
            <View style={{ gap: 6 }}>
              <Text variant="smallStrong" color="white" style={{ fontSize: 14 }}>
                Focus marker
              </Text>
              <View style={styles.focusRow}>
                <Text variant="title" color="white" style={{ fontSize: 22 }}>
                  {MARKER_LABELS[focus]} {'·'} {value} mg/dL
                </Text>
                <StatusChip status={status} />
              </View>
              <Text variant="small" weight={400} color="white" style={{ fontSize: 14, lineHeight: 20 }}>
                Chosen because it's the marker furthest from range on your {source ? fmtDayMonth(source.collectionDate) : 'latest'} report.
              </Text>
            </View>
          ) : (
            <Text variant="body" color="white">
              {escalation
                ? 'Your doctor guides your plan for now. Lipidly keeps your tracking and reminders going.'
                : 'All your results are in range. Keep the habits that help you stay there.'}
            </Text>
          )}
        </ColouredHeader>
      }
    >
      {proposal && (
        <Callout tone="lilac" title="An updated plan is ready" action={<Button label="Review" size="xs" onPress={() => router.push('/plan/proposal')} />}>
          Based on your latest report.
        </Callout>
      )}
      {escalation && (
        <Callout tone="soft" title="Please see your doctor" action={<Button label="Why" size="xs" variant="tint" onPress={() => router.push('/reports/doctor')} />}>
          No app habits while a doctor reviews your result.
        </Callout>
      )}
      <Section title={plan.mode === 'maintenance' ? 'Habits to keep' : 'Daily habits'}>
        <View style={{ gap: 8 }}>
          {habits.length === 0 && (
            <Text variant="body" color="muted">
              No habits in this plan.
            </Text>
          )}
          {habits.map((h) => (
            <HabitRow
              key={h.id}
              habit={h}
              subtitle={h.source === 'doctor' ? undefined : keptLine(h.id, h.reminderTime)}
              onPress={() => router.push({ pathname: '/plan/habit/[id]', params: { id: h.id } })}
            />
          ))}
        </View>
      </Section>
      <Section title="Your own habits">
        <View style={{ gap: 8 }}>
          {own.map((h) => (
            <HabitRow key={h.id} habit={h} subtitle={keptLine(h.id, h.reminderTime)} onPress={() => router.push({ pathname: '/plan/own/[id]', params: { id: h.id } })} />
          ))}
          {own.length < MAX_OWN_HABITS && (
            <AddRow
              label="Add your own habit"
              caption={own.length === 0 ? 'Track something extra in your check-in. It won\u2019t change your plan.' : `You can add ${MAX_OWN_HABITS - own.length} more.`}
              onPress={() => router.push({ pathname: '/plan/own/[id]', params: { id: 'new' } })}
            />
          )}
        </View>
      </Section>
      <Card style={styles.retest}>
        <View style={{ flex: 1 }}>
          <Text variant="small" color="muted">
            Retest date
          </Text>
          <Text variant="title">{fmtWeekdayDate(plan.retestDate)} {plan.retestDate.slice(0, 4)}</Text>
        </View>
        <Button label="Change" size="xs" variant="tint" onPress={() => router.push('/plan/retest')} />
      </Card>
      <Button label="Weekly summary" variant="secondary" size="sm" onPress={() => router.push('/weekly-summary')} />
      {data.plans.some((p) => p.status === 'past') && <Button label="View past plans" variant="link" size="sm" onPress={() => router.push('/plan/past')} style={{ alignSelf: 'center' }} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  decor: { position: 'absolute', right: -40, top: 30, width: 160, height: 160, borderRadius: 80, backgroundColor: colors.primaryDecor },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 },
  focusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  retest: { flexDirection: 'row', alignItems: 'center', borderRadius: 22 },
});
