import { MARKER_LABELS, STATUS_LABELS } from '@lipidly/rules';
import { router } from 'expo-router';
import { AlertCircle, BookOpen, CalendarClock, ChevronRight, FlaskConical, Sparkles } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { daysUntil, firstName, fmtLongDate, fmtTime, fmtWeekdayDate, greeting } from '@/lib/format';
import { setTestReminder } from '@/state/actions/onboarding';
import { dailyHabits } from '@/state/actions/plan-builder';
import { useOverview } from '@/state/hooks';
import { nowTime, today } from '@/state/ids';
import {
  Button,
  Callout,
  Card,
  Chip,
  colors,
  ColouredHeader,
  DateField,
  Icon,
  IconTile,
  ListGroup,
  ListRow,
  Mascot,
  ProgressRing,
  Screen,
  StatusChip,
  Tap,
  Text,
} from '@/ui';
import { habitVisual } from '../plan/habitVisual';
import { CheckInsCard } from './CheckInsCard';
import { WeeklyGoalCard } from './WeeklyGoalCard';

export default function HomeScreen() {
  const { data, profile, plan, proposal, latestReport, escalation } = useOverview();
  const name = firstName(profile?.name);
  const t = today();

  if (!latestReport) return <NoReportHome name={name} testReminder={data.testReminder} />;

  const todayCheckIn = data.checkIns[t];
  const total = dailyHabits(data, plan).length;
  const answered = todayCheckIn ? Object.keys(todayCheckIn.answers).length : 0;
  const focus = plan?.focus;
  const focusValue = focus ? latestReport.values[focus] : undefined;
  const focusStatus = focus ? latestReport.statuses[focus] : undefined;
  const next = nextReminder(data, plan);

  return (
    <Screen
      tabBar
      header={
        <ColouredHeader tone="tint" paddingBottom={20}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text variant="small" color="muted" style={{ fontSize: 14 }}>
                {fmtLongDate(t)}
              </Text>
              <Text variant="h1" accessibilityRole="header">
                {greeting()}
                {name ? `, ${name}` : ''}
              </Text>
              <Chip tone="white" label={escalation ? 'Tracking mode' : plan?.mode === 'maintenance' ? 'Maintenance mode' : 'Active mode'} style={{ marginTop: 8 }} />
            </View>
            {!escalation && <Mascot size={72} cheeks />}
          </View>
        </ColouredHeader>
      }
    >
      {proposal && (
        <Card tone="lilac" onPress={() => router.push('/plan/proposal')} accessibilityLabel="Your new plan is ready. Review it.">
          <View style={styles.row}>
            <IconTile icon={Sparkles} tone="white" size={38} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Your new plan is ready</Text>
              <Text variant="small" color="onLilac">
                Review the habits and commit to each one
              </Text>
            </View>
            <Icon icon={ChevronRight} color="onLilac" />
          </View>
        </Card>
      )}

      {escalation && (
        <Card onPress={() => router.push('/reports/doctor')} accessibilityLabel="Please see your doctor about your latest result">
          <View style={styles.row}>
            <IconTile icon={AlertCircle} tone="soft" size={38} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong">Please see your doctor</Text>
              <Text variant="small" color="muted">
                About your latest result. Tracking and reminders still work.
              </Text>
            </View>
            <Icon icon={ChevronRight} color="subtle" />
          </View>
        </Card>
      )}

      {plan && total > 0 && (
        <Card tone="primary" size="hero" raised padding={18} onPress={() => router.push('/check-in')} accessibilityLabel={`Today's check-in, ${answered} of ${total} answered`}>
          <View style={styles.row}>
            <ProgressRing done={answered} total={total} />
            <View style={{ flex: 1 }}>
              <Text variant="title" color="white" style={{ fontSize: 18 }}>
                {todayCheckIn ? 'Check-in done' : 'Today’s check-in'}
              </Text>
              <Text variant="small" weight={400} color="white" style={{ fontSize: 14 }}>
                {todayCheckIn ? 'Tap to change an answer' : `${total} quick questions · under a minute`}
              </Text>
            </View>
            <View style={styles.go}>
              <Icon icon={ChevronRight} color="primary" size={22} strokeWidth={3} />
            </View>
          </View>
        </Card>
      )}

      <View style={styles.pair}>
        {focus && focusValue !== undefined && focusStatus ? (
          <Card style={{ flex: 1, gap: 6 }} onPress={() => router.push(`/reports/marker/${focus}`)} accessibilityLabel={`Focus marker ${MARKER_LABELS[focus]}, ${focusValue} mg/dL, ${STATUS_LABELS[focusStatus]}`}>
            <Text variant="small" color="muted">
              Focus marker
            </Text>
            <Text variant="bodyStrong">{MARKER_LABELS[focus]}</Text>
            <View style={styles.value}>
              <Text variant="figure">
                {focusValue}
              </Text>
              <Text variant="caption" weight={600} color="muted">
                mg/dL
              </Text>
            </View>
            <StatusChip status={focusStatus} />
          </Card>
        ) : (
          <Card style={{ flex: 1, gap: 6 }} onPress={() => router.push(`/reports/${latestReport.id}`)}>
            <Text variant="small" color="muted">
              Latest report
            </Text>
            <Text variant="bodyStrong">{plan?.mode === 'maintenance' ? 'All in range' : 'See results'}</Text>
            <Text variant="small" color="muted">
              {latestReport.labName}
            </Text>
          </Card>
        )}
        {plan && (
          <Card tone="sky" style={{ flex: 1, gap: 4 }} onPress={() => router.push('/plan/retest')} accessibilityLabel={`Next retest in ${daysUntil(plan.retestDate)} days`}>
            <View style={styles.skyDecor} />
            <Text variant="small" color="onSky">
              Next retest
            </Text>
            <Text variant="stat" style={{ fontSize: 44 }}>
              {Math.max(0, daysUntil(plan.retestDate))}
            </Text>
            <Text variant="smallStrong" style={{ fontSize: 14 }}>
              days {'·'} {fmtWeekdayDate(plan.retestDate)}
            </Text>
          </Card>
        )}
      </View>

      {plan && <WeeklyGoalCard />}
      {plan && <CheckInsCard checkIns={data.checkIns} />}

      {next && (
        <Tap onPress={() => router.push(next.href)} style={styles.nextPill} accessibilityLabel={`Next: ${next.title} at ${fmtTime(next.time)}`}>
          <IconTile icon={next.icon} tone={next.tone} size={34} />
          <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
            Next: {next.title}
          </Text>
          <Text variant="smallStrong" weight={800} color="muted">
            {fmtTime(next.time)}
          </Text>
        </Tap>
      )}
    </Screen>
  );
}

/** The next reminder still to come today: a habit nudge or a medicine dose. Never names the medicine on Home. */
function nextReminder(data: ReturnType<typeof useOverview>['data'], plan: ReturnType<typeof useOverview>['plan']) {
  const now = nowTime();
  const items = [
    ...dailyHabits(data, plan)
      .filter((h) => h.source !== 'doctor' && h.reminderTime)
      .map((h) => ({ title: h.title, time: h.reminderTime!, href: '/plan' as const, ...habitVisual(h) })),
    ...data.medicines
      .filter((m) => m.active)
      .flatMap((m) => m.times.map((time) => ({ title: 'Medicine dose', time, href: '/medicines' as const, icon: CalendarClock, tone: 'tint' as const }))),
  ].filter((i) => i.time > now);
  return items.sort((a, b) => a.time.localeCompare(b.time))[0];
}

/** 07b: no report yet. The user can explore and set a reminder to get tested. */
function NoReportHome({ name, testReminder }: { name: string; testReminder?: string }) {
  return (
    <Screen
      tabBar
      header={
        <ColouredHeader tone="tint" paddingBottom={20}>
          <View style={{ gap: 2 }}>
            <Text variant="small" color="muted" style={{ fontSize: 14 }}>
              {fmtLongDate(today())}
            </Text>
            <Text variant="h1" accessibilityRole="header">
              Welcome{name ? `, ${name}` : ''}
            </Text>
          </View>
        </ColouredHeader>
      }
    >
      <Card size="hero" padding={20} style={{ gap: 12 }}>
        <View style={styles.emptyScene}>
          <View style={[styles.emptyBlob, { backgroundColor: colors.ice, width: 150, height: 150, left: 20, top: 10 }]} />
          <View style={[styles.emptyBlob, { backgroundColor: colors.lilac, width: 40, height: 40, right: 40, top: 20 }]} />
          <View style={styles.emptyPaper}>
            <Icon icon={FlaskConical} color="primary" size={28} />
          </View>
          <View style={{ position: 'absolute', right: 60, bottom: 0 }}>
            <Mascot size={64} mood="happy" />
          </View>
        </View>
        <Text variant="h2">No report yet</Text>
        <Text variant="body" color="muted">
          A lipid profile blood test gives you a starting point. When you have one, add it and we'll build your plan.
        </Text>
        <Button label="Add a report" onPress={() => router.push('/reports/add')} />
      </Card>
      <ListGroup>
        <ListRow
          icon={CalendarClock}
          iconTone="sky"
          title="Remind me to get tested"
          subtitle={testReminder ? `On ${fmtWeekdayDate(testReminder)}` : 'One reminder on a day you choose'}
          trailing={
            <DateField compact mode="date" value={testReminder} display="Change" placeholder="Set" minimumDate={today()} onChange={(d) => setTestReminder(d)} />
          }
        />
      </ListGroup>
      <View style={styles.pair}>
        <Card tone="lilac" style={{ flex: 1, gap: 18 }} onPress={() => router.push('/learn/lipid-profile')}>
          <IconTile icon={BookOpen} tone="white" size={36} />
          <Text variant="bodyStrong">What a lipid profile measures</Text>
        </Card>
        <Card tone="sky" style={{ flex: 1, gap: 18 }} onPress={() => router.push('/learn/prepare')}>
          <IconTile icon={FlaskConical} tone="white" size={36} />
          <Text variant="bodyStrong">How to prepare for the test</Text>
        </Card>
      </View>
      <Callout tone="soft">Lipidly supports healthy habits and does not replace your doctor.</Callout>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  go: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  pair: { flexDirection: 'row', gap: 10 },
  value: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  skyDecor: { position: 'absolute', right: -20, bottom: -20, width: 80, height: 80, borderRadius: 40, backgroundColor: colors.skyStrong },
  nextPill: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 10, paddingLeft: 10, paddingRight: 16 },
  emptyScene: { height: 150 },
  emptyBlob: { position: 'absolute', borderRadius: 999 },
  emptyPaper: {
    position: 'absolute',
    left: 60,
    top: 30,
    width: 74,
    height: 96,
    borderRadius: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
});
