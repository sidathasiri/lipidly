import { MARKER_LABELS, bandRanges, statusOf, type MarkerId } from '@lipidly/rules';
import { router, useLocalSearchParams } from 'expo-router';
import { Fragment } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { MARKER_INFO } from '@/content/markers';
import { fmtMonth } from '@/lib/format';
import { useUserData } from '@/state/hooks';
import { Card, ChoiceChip, colors, Divider, Screen, ScreenState, Section, StatusChip, StatusDot, Text, TopBar, TrendChart } from '@/ui';
import { MARKER_ORDER, unitLabel } from './reportUtils';

/** Trend chart across all reports, plain-language explanation, status bands (21, F8.1). */
export default function MarkerDetailScreen() {
  const { marker: param } = useLocalSearchParams<{ marker: string }>();
  const marker = (MARKER_ORDER.includes(param as MarkerId) ? param : 'triglycerides') as MarkerId;
  const { reports, profile } = useUserData();
  const series = [...reports]
    .reverse()
    .filter((r) => r.values[marker] !== undefined)
    .map((r) => ({ label: fmtMonth(r.collectionDate), value: r.values[marker]! }));
  const latest = series[series.length - 1];
  const sex = profile?.sex ?? 'male';
  const status = latest ? statusOf(marker, latest.value, sex) : undefined;
  const bands = bandRanges(marker, sex);
  const available = MARKER_ORDER.filter((m) => reports.some((r) => r.values[m] !== undefined));

  return (
    <Screen gap={12}>
      <TopBar />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
        {available.map((m) => (
          <ChoiceChip key={m} dense label={MARKER_LABELS[m]} selected={m === marker} onPress={() => router.setParams({ marker: m })} />
        ))}
      </ScrollView>
      <Text variant="h1" accessibilityRole="header">
        {MARKER_LABELS[marker]}
      </Text>
      {!latest ? (
        <ScreenState kind="empty" title="No values yet" message="This marker appears once a report includes it." />
      ) : (
        <>
          <View style={styles.valueRow}>
            <Text variant="displayXL">{latest.value}</Text>
            <Text variant="bodyMedium" color="muted">
              {unitLabel(marker)}
            </Text>
            {status && <StatusChip status={status} />}
          </View>
          {bands.length > 0 && (
            <Card>
              <TrendChart marker={marker} sex={sex} points={series} />
            </Card>
          )}
          <Section title="What it is" gap={4}>
            <Text variant="body" color="muted">
              {MARKER_INFO[marker].what}
            </Text>
          </Section>
          {bands.length > 0 && (
            <View style={styles.bands}>
              {bands.map((b, i) => {
                const here = b.status === status || (status === 'veryHigh' && b.status === 'veryHigh');
                return (
                  <Fragment key={b.status}>
                    {i > 0 && <Divider />}
                    <View style={styles.bandRow}>
                      <View style={styles.bandLabel}>
                        <StatusDot status={b.status} />
                        <Text variant="small" weight={here ? 800 : 500} style={{ fontSize: 14 }}>
                          {({ inRange: 'In range', borderline: 'Borderline', high: 'High', veryHigh: 'Very high', low: 'Low' } as const)[b.status]}
                          {here ? ' · you are here' : ''}
                        </Text>
                      </View>
                      <Text variant="small" weight={here ? 800 : 500} color={here ? 'ink' : 'muted'} style={{ fontSize: 14 }}>
                        {b.label}
                      </Text>
                    </View>
                  </Fragment>
                );
              })}
            </View>
          )}
          <Text variant="caption" weight={600} color="muted">
            Your doctor interprets these results for you.
          </Text>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  bands: { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 4 },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  bandLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
