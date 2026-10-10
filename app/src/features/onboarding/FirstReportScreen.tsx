import { router } from 'expo-router';
import { CircleDashed, PenLine } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { finishOnboarding } from '@/state/actions/onboarding';
import { startManualDraft } from '@/state/actions/reports';
import { Card, colors, ProgressBar, Screen, SourceTile, Text, TopBar } from '@/ui';

/** Start the first upload: add a report, enter by hand, or "I don't have one yet" (06). */
export default function FirstReportScreen() {
  return (
    <Screen padding="onboarding" gap={18}>
      <TopBar left="back" center={<ProgressBar segments={6} filled={6} accessibilityLabel="Step 6 of 6" />} />
      <Text variant="displayL" style={{ fontSize: 32, lineHeight: 34 }} accessibilityRole="header">
        Add your latest lipid report
      </Text>
      <Text variant="body" color="muted" style={{ fontSize: 16 }}>
        Your plan starts from your own numbers. You'll check every value before we use it.
      </Text>
      <Card
        tone="primary"
        size="hero"
        raised
        padding={22}
        accessibilityLabel="Add a report"
        onPress={() => {
          finishOnboarding();
          router.replace('/home');
          router.push('/reports/add');
        }}
      >
        <View style={styles.decor} />
        <View style={styles.paper} />
        <View style={{ gap: 14 }}>
          <Text variant="title" color="white" style={{ fontSize: 20 }}>
            Add a report
          </Text>
          <Text variant="small" color="white" weight={400} style={{ maxWidth: 200, fontSize: 14 }}>
            Photo, PDF or share from another app
          </Text>
        </View>
      </Card>
      <View style={styles.grid}>
        <SourceTile
          icon={PenLine}
          tone="sky"
          label="Enter values by hand"
          style={styles.tile}
          onPress={() => {
            finishOnboarding();
            startManualDraft();
            router.replace('/home');
            router.push('/reports/confirm');
          }}
        />
        <SourceTile
          icon={CircleDashed}
          tone="lilac"
          label="I don't have one yet"
          style={styles.tile}
          onPress={() => {
            finishOnboarding();
            router.replace('/home');
          }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  decor: { position: 'absolute', right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: colors.primaryDecor },
  paper: { position: 'absolute', right: 30, top: 24, width: 50, height: 64, borderRadius: 10, backgroundColor: colors.white, transform: [{ rotate: '8deg' }] },
  grid: { flexDirection: 'row', gap: 10 },
  tile: { flex: 1, minHeight: 150 },
});
