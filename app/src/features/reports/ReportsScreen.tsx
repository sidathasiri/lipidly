import { router } from 'expo-router';
import { ArrowLeftRight, Plus, TrendingDown } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { dayOfMonth, fmtMonth, fmtMonthShort } from '@/lib/format';
import { useUserData } from '@/state/hooks';
import { Button, Card, Chip, DateTile, Screen, ScreenState, SourceTile, StatusChip, Text } from '@/ui';
import { reportHeadline } from './reportUtils';

/** All reports, newest first, with headline status and shortcuts (15). */
export default function ReportsScreen() {
  const { reports } = useUserData();

  return (
    <Screen tabBar gap={12}>
      <View style={styles.titleRow}>
        <Text variant="h1" accessibilityRole="header">
          Reports
        </Text>
        <Button label="Add" icon={Plus} size="xs" variant="tint" onPress={() => router.push('/reports/add')} />
      </View>
      {reports.length === 0 && (
        <ScreenState kind="empty" title="No reports yet" message="Add a lipid profile report to see your results explained." actionLabel="Add a report" onAction={() => router.push('/reports/add')} />
      )}
      {reports.map((r, i) => {
        const h = reportHeadline(r);
        return (
          <Card key={r.id} onPress={() => router.push(`/reports/${r.id}`)} accessibilityLabel={`${r.labName} report, ${r.collectionDate}. ${h.worst?.label ?? 'All in range'}`}>
            <View style={styles.row}>
              <DateTile month={fmtMonthShort(r.collectionDate)} day={dayOfMonth(r.collectionDate)} tone={i === 0 ? 'primary' : 'tint'} />
              <View style={{ flex: 1, gap: 6 }}>
                <View style={styles.labRow}>
                  <Text variant="bodyStrong">{r.labName}</Text>
                  {i === 0 && <Chip tone="soft" label="Latest" />}
                </View>
                <View style={styles.chips}>
                  {h.worst ? <StatusChip status={h.worst.status} label={h.worst.label} /> : <StatusChip status="inRange" label="All in range" />}
                  {h.outOfRange > 0 && (
                    <Text variant="small" color="muted">
                      {h.outOfRange} out of range
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </Card>
        );
      })}
      {reports.length > 0 && (
        <View style={styles.tiles}>
          {reports.length > 1 && (
            <SourceTile
              icon={ArrowLeftRight}
              tone="sky"
              label={`Compare ${fmtMonth(reports[1]!.collectionDate)} → ${fmtMonth(reports[0]!.collectionDate)}`}
              onPress={() => router.push('/reports/compare')}
              style={{ flex: 1 }}
            />
          )}
          <SourceTile icon={TrendingDown} tone="lilac" label="Trends by marker" onPress={() => router.push('/reports/marker/triglycerides')} style={{ flex: 1 }} />
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  labRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  chips: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tiles: { flexDirection: 'row', gap: 10 },
});
