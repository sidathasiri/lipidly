import { MARKER_LABELS, selectFocus, type MarkerId } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { fmtDate, fmtMonth } from '@/lib/format';
import { useOverview } from '@/state/hooks';
import { previousReport } from '@/state/actions/reports';
import { Button, Callout, Card, colors, Divider, RangeGauge, Screen, ScreenState, StatusChip, Tap, Text, TopBar } from '@/ui';
import { orderedMarkers, unitLabel } from './reportUtils';

/** Each marker with value, status, range and change since the last report; the focus marker named (20). */
export default function ResultsScreen() {
  const { id, fresh } = useLocalSearchParams<{ id: string; fresh?: string }>();
  const { data, profile, proposal } = useOverview();
  // `latest` opens the newest report (used by links that don't know the ID).
  const report = id === 'latest' ? data.reports[0] : data.reports.find((r) => r.id === id);

  if (!report || !profile) {
    return (
      <Screen topBar={<TopBar />}>
        <ScreenState kind="error" title="Report not found" />
      </Screen>
    );
  }

  const prev = previousReport(data.reports, report.id);
  const plan = data.plans.find((p) => p.sourceReportId === report.id && p.status !== 'past');
  const escalation = data.escalations.find((e) => e.reportId === report.id);
  const focus = plan?.focus ?? (escalation ? null : selectFocus(report.values, profile.sex));
  const hasProposal = proposal?.sourceReportId === report.id;

  return (
    <Screen topBar={<TopBar />}
      gap={10}
      footer={
        hasProposal ? (
          <Button label={data.plans.some((p) => p.status !== 'proposed') ? 'See your updated plan' : 'See your plan'} onPress={() => router.push('/plan/proposal')} />
        ) : fresh ? (
          <Button label="Done" onPress={() => router.dismissTo('/home')} />
        ) : undefined
      }
    >
      <View>
        <Text variant="small" color="muted" style={{ fontSize: 14 }}>
          {fmtDate(report.collectionDate)} {'·'} {report.labName}
        </Text>
        <Text variant="h1" accessibilityRole="header">
          Your results
        </Text>
      </View>

      {escalation ? (
        <Card onPress={() => router.push('/reports/doctor')} accessibilityLabel="Please see your doctor about this result">
          <Text variant="bodyStrong">Please see your doctor about this result</Text>
          <Text variant="small" color="muted">
            Lipidly won't write a plan for it. Tap to see why.
          </Text>
        </Card>
      ) : focus ? (
        <Card tone="primary" padding={18} style={{ borderRadius: 26 }}>
          <View style={styles.decor} />
          <Text variant="overline" color="white" style={{ fontSize: 12 }}>
            Focus marker
          </Text>
          <Text variant="title" color="white" style={{ fontSize: 19 }}>
            {MARKER_LABELS[focus]}
          </Text>
          <Text variant="small" weight={400} color="white" style={{ fontSize: 14, lineHeight: 20 }}>
            It's furthest from range, so your plan targets it first.
          </Text>
        </Card>
      ) : (
        <Card tone="tint">
          <Text variant="bodyStrong" color="onPrimaryTint">
            All your results are in range
          </Text>
          <Text variant="small" color="onPrimaryTint">
            Your plan moves to Maintenance: keep the habits that help.
          </Text>
        </Card>
      )}

      <View style={styles.list}>
        {orderedMarkers(report).map((m, i) => {
          const value = report.values[m.marker];
          const status = report.statuses[m.marker];
          const before = prev?.values[m.marker];
          return (
            <Fragment key={m.marker}>
              {i > 0 && <Divider />}
              <MarkerRow
                marker={m.marker}
                value={value}
                status={status}
                change={before !== undefined && value !== undefined ? { delta: value - before, since: fmtMonth(prev!.collectionDate) } : undefined}
                sex={profile.sex}
              />
            </Fragment>
          );
        })}
      </View>

      <Text variant="caption" weight={600} color="muted">
        Your doctor interprets these results for you. Lipidly only helps with habits.
      </Text>
      <View style={styles.links}>
        {report.source !== 'manual' && <Button label="View original" variant="link" size="xs" onPress={() => router.push('/reports/viewer')} />}
        {prev && <Button label={`Compare with ${fmtMonth(prev.collectionDate)}`} variant="link" size="xs" onPress={() => router.push({ pathname: '/reports/compare', params: { id: report.id } })} />}
      </View>
      {hasProposal && plan?.summary && <Callout tone="tint">{plan.summary}</Callout>}
    </Screen>
  );
}

function MarkerRow({
  marker,
  value,
  status,
  change,
  sex,
}: {
  marker: MarkerId;
  value?: number;
  status?: Parameters<typeof StatusChip>[0]['status'];
  change?: { delta: number; since: string };
  sex: 'male' | 'female' | 'other';
}) {
  const arrow = change ? (change.delta < 0 ? '↓' : change.delta > 0 ? '↑' : '→') : '';
  return (
    <Tap onPress={() => router.push(`/reports/marker/${marker}`)} accessibilityLabel={`${MARKER_LABELS[marker]} ${value ?? ''} ${unitLabel(marker)}`} style={styles.row}>
      <View style={styles.line}>
        <Text variant="bodyMedium" weight={800} style={{ flex: 1 }}>
          {MARKER_LABELS[marker]}
        </Text>
        <Text variant="bodyStrong">
          {value ?? '–'}{' '}
          <Text variant="caption" weight={600} color="muted" style={{ fontSize: 11 }}>
            {unitLabel(marker)}
          </Text>
        </Text>
        {status ? <StatusChip status={status} fixedWidth /> : <View style={{ width: 82 }} />}
      </View>
      <View style={styles.line}>
        {value !== undefined && status ? <RangeGauge marker={marker} value={value} sex={sex} /> : <View style={{ flex: 1 }} />}
        <Text variant="caption" weight={500} color="muted" style={styles.change}>
          {change ? (change.delta === 0 ? `Same as ${change.since}` : `${arrow} ${Math.abs(change.delta)} since ${change.since}`) : ''}
        </Text>
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  decor: { position: 'absolute', right: -24, top: -24, width: 100, height: 100, borderRadius: 50, backgroundColor: colors.primaryDecor },
  list: { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4 },
  row: { paddingVertical: 10, gap: 6 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  change: { width: 92, textAlign: 'right' },
  links: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
});
