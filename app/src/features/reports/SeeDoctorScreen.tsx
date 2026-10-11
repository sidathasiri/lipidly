import { MARKER_LABELS, STATUS_LABELS, statusOf } from '@lipidly/rules';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDayMonth } from '@/lib/format';
import { useOverview } from '@/state/hooks';
import { Button, Card, colors, Icon, IconButton, radius, Screen, ScreenState, statusColors, Tap, Text, TopBar } from '@/ui';

const CONDITION_LABELS = { heartDisease: 'heart disease', stroke: 'a stroke', diabetes: 'diabetes', kidneyDisease: 'kidney disease' } as const;

/**
 * Escalation: names the result that triggered it and advises a doctor; no app plan (23, F11.2).
 * The only screen besides lab results allowed to use the red status palette. No mascot here.
 */
export default function SeeDoctorScreen() {
  const insets = useSafeAreaInsets();
  const { data, profile } = useOverview();
  const esc = data.escalations[data.escalations.length - 1];

  if (!esc) {
    return (
      <Screen topBar={<TopBar />}>
        <ScreenState kind="empty" title="Nothing to show" />
      </Screen>
    );
  }

  const report = data.reports.find((r) => r.id === esc.reportId);
  const red = statusColors.escalation;
  const status = esc.marker && esc.value !== undefined ? statusOf(esc.marker, esc.value, profile?.sex ?? 'male') : undefined;

  const body =
    esc.rule === 'healthCondition'
      ? `You told us you have ${esc.conditions?.map((c) => CONDITION_LABELS[c]).join(' and ')}. Cholesterol care with ${esc.conditions?.length === 1 ? 'this condition' : 'these conditions'} needs your doctor, so Lipidly won't write a plan of its own. Take your latest report to your next visit.`
      : esc.rule === 'focusWorsened'
        ? 'This result went up by more than a fifth even though you kept your habits on most days. That needs your doctor’s view, so Lipidly won’t write a new plan for it. Book a visit and take this report with you.'
        : 'This is beyond what lifestyle habits alone should handle, so Lipidly won’t write a plan for it. Book a visit with your doctor in the next few days and take this report with you.';

  return (
    <Screen
      padding="onboarding"
      gap={14}
      overlay={<IconButton kind="close" onPress={() => router.dismissTo('/home')} />}
      header={
        <View style={[styles.header, { backgroundColor: red.bg, paddingTop: insets.top + 12 }]}>
          {/* Room for the floating close button. */}
          <View style={styles.closeSpace} />
          <View style={[styles.bang, { backgroundColor: red.fg }]}>
            <Text variant="figure" color="white">
              !
            </Text>
          </View>
          <Text variant="h1" style={{ color: red.title }} accessibilityRole="header">
            Please see your doctor about this result
          </Text>
        </View>
      }
      footer={
        <>
          <Button label="Add a doctor's appointment" onPress={() => router.push('/medicines/appointment-new')} />
          <Tap onPress={() => router.push('/urgent')} accessibilityLabel="Warning signs that need urgent care" style={{ alignItems: 'center', paddingVertical: 6 }}>
            <Text variant="bodyStrong" style={{ color: red.fg, fontSize: 15 }}>
              Warning signs that need urgent care
            </Text>
          </Tap>
        </>
      }
    >
      {esc.marker && esc.value !== undefined && (
        <View style={[styles.valueCard, { borderColor: red.ring }]}>
          <View>
            <Text variant="small" color="muted">
              {MARKER_LABELS[esc.marker]} {report ? `· ${fmtDayMonth(report.collectionDate)}` : ''}
            </Text>
            <Text variant="figure" style={{ fontSize: 30 }}>
              {esc.value}{' '}
              <Text variant="small" color="muted" style={{ fontSize: 14 }}>
                mg/dL
              </Text>
            </Text>
          </View>
          {status && (
            <View style={[styles.chip, { backgroundColor: red.bg }]}>
              <Text variant="smallStrong" weight={800} style={{ color: red.fg }}>
                {STATUS_LABELS[status]}
              </Text>
            </View>
          )}
        </View>
      )}
      <Text variant="body" color="inkSoft">
        {body}
      </Text>
      <Card padding={18} style={{ gap: 8 }}>
        <Text variant="bodyStrong" style={{ fontSize: 15 }}>
          What still works
        </Text>
        {['Your reports and trends', 'Medicine reminders', 'Habits your doctor gives you'].map((t) => (
          <View key={t} style={styles.works}>
            <Icon icon={Check} size={16} color="primary" strokeWidth={3} />
            <Text variant="body" color="inkSoft">
              {t}
            </Text>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  closeSpace: { height: 36 },
  header: { borderBottomLeftRadius: radius.headerBottom, borderBottomRightRadius: radius.headerBottom, paddingHorizontal: 24, paddingBottom: 24, gap: 14 },
  bang: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  valueCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 2 },
  chip: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  works: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
