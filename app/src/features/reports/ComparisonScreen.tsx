import { MARKER_LABELS, adherence, changeDirection, percentChange, type MarkerId } from '@lipidly/rules';
import { useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { StyleSheet, View } from 'react-native';
import { fmtDayMonth, fmtMonthYear } from '@/lib/format';
import { useUserData } from '@/state/hooks';
import { Chip, colors, Divider, Screen, ScreenState, StatTile, Text, TopBar } from '@/ui';
import { MARKER_ORDER } from './reportUtils';

const SHORT: Partial<Record<MarkerId, string>> = { totalCholesterol: 'Total' };

/** Before and after, with habits kept and doses taken; the wording never claims a cause (22, F8.2–F8.5). */
export default function ComparisonScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const data = useUserData();
  const i = id ? data.reports.findIndex((r) => r.id === id) : 0;
  const after = data.reports[i];
  const before = data.reports[i + 1];

  if (!after || !before) {
    return (
      <Screen topBar={<TopBar />}>
        <ScreenState kind="empty" title="Two reports needed" message="Comparison appears once you have two reports." />
      </Screen>
    );
  }

  const markers = MARKER_ORDER.filter((m) => before.values[m] !== undefined && after.values[m] !== undefined && m !== 'tcHdlRatio' && m !== 'vldl');
  const better = markers.filter((m) => changeDirection(m, before.values[m]!, after.values[m]!) === 'better').length;
  const tg = markers.includes('triglycerides') ? percentChange(before.values.triglycerides!, after.values.triglycerides!) : undefined;

  // Habits kept and doses taken between the two collection dates.
  const plan = data.plans.find((p) => p.sourceReportId === before.id);
  const habitIds = plan?.habits.filter((h) => h.source === 'app').map((h) => h.id) ?? [];
  const kept = habitIds.length ? adherence(Object.values(data.checkIns), habitIds, before.collectionDate, after.collectionDate) : undefined;
  const doses = data.doses.filter((d) => d.date > before.collectionDate && d.date <= after.collectionDate);
  const taken = doses.length ? doses.filter((d) => d.outcome === 'taken').length / doses.length : undefined;

  const words = ['No markers', 'One marker', 'Two markers', 'Three markers', 'Four markers', 'Five markers'];
  const title = `${fmtMonthYear(before.collectionDate).split(' ')[0]} to ${fmtMonthYear(after.collectionDate).split(' ')[0]}`;

  return (
    <Screen topBar={<TopBar />} gap={12}>
      <Text variant="h1" accessibilityRole="header">
        {title}
      </Text>
      <Text variant="body" color="muted">
        {words[better] ?? `${better} markers`} moved in a better direction.
        {tg !== undefined && after.statuses.triglycerides
          ? ` Triglycerides ${tg <= 0 ? 'fell' : 'rose'} ${Math.abs(tg)}% and are ${after.statuses.triglycerides === 'inRange' ? 'now in range' : `still in the ${after.statuses.triglycerides === 'veryHigh' ? 'very high' : after.statuses.triglycerides} band`}.`
          : ''}
      </Text>
      <View style={styles.table}>
        <View style={styles.tr}>
          <Text variant="caption" color="muted" style={styles.c1}>
            mg/dL
          </Text>
          <Text variant="caption" color="muted" style={styles.c}>
            {fmtDayMonth(before.collectionDate)}
          </Text>
          <Text variant="caption" color="muted" style={styles.c}>
            {fmtDayMonth(after.collectionDate)}
          </Text>
          <Text variant="caption" color="muted" style={[styles.c, { textAlign: 'right' }]}>
            Change
          </Text>
        </View>
        {markers.map((m) => {
          const b = before.values[m]!;
          const a = after.values[m]!;
          const dir = changeDirection(m, b, a);
          const pct = percentChange(b, a);
          const label = m === 'hdl' ? `${a - b >= 0 ? '+' : '−'}${Math.abs(a - b)}` : `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)}%`;
          return (
            <Fragment key={m}>
              <Divider />
              <View style={[styles.tr, { paddingVertical: 12 }]}>
                <Text variant="bodyMedium" weight={800} style={styles.c1}>
                  {SHORT[m] ?? MARKER_LABELS[m]}
                </Text>
                <Text variant="bodyMedium" weight={400} color="muted" style={styles.c}>
                  {b}
                </Text>
                <Text variant="bodyMedium" weight={800} style={styles.c}>
                  {a}
                </Text>
                <View style={[styles.c, { alignItems: 'flex-end' }]}>
                  <Chip tone={dir === 'better' ? 'tint' : 'soft'} label={label} style={{ alignSelf: 'flex-end' }} />
                </View>
              </View>
            </Fragment>
          );
        })}
      </View>
      {(kept !== undefined || taken !== undefined) && (
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {kept !== undefined && <StatTile tone="sky" size="sm" value={`${Math.round(kept * 100)}%`} label="days habits kept" />}
          {taken !== undefined && <StatTile tone="lilac" size="sm" value={`${Math.round(taken * 100)}%`} label="doses taken" />}
        </View>
      )}
      <Text variant="small" weight={400} color="muted">
        Results change for many reasons. Your doctor can tell you what this means for you.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  table: { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 6 },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  c1: { flex: 1.4 },
  c: { flex: 1 },
});
