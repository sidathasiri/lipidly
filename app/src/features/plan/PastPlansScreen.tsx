import { MARKER_LABELS } from '@lipidly/rules';
import { View } from 'react-native';
import { fmtDate } from '@/lib/format';
import { useUserData } from '@/state/hooks';
import { Card, Chip, Screen, ScreenState, Text, TopBar } from '@/ui';

/** Earlier plans, newest first (F4.9). */
export default function PastPlansScreen() {
  const plans = useUserData()
    .plans.filter((p) => p.status === 'past')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  return (
    <Screen gap={12}>
      <TopBar />
      <Text variant="h1" accessibilityRole="header">
        Past plans
      </Text>
      {plans.length === 0 && <ScreenState kind="empty" title="No past plans yet" />}
      {plans.map((p) => (
        <Card key={p.id} style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodyStrong">{p.focus ? MARKER_LABELS[p.focus] : p.escalationId ? 'Doctor-led' : 'Maintenance'}</Text>
            <Chip tone="soft" label={`From ${fmtDate(p.startDate)}`} />
          </View>
          <Text variant="small" weight={400} color="muted">
            {p.habits.map((h) => h.title).join(' · ') || 'No habits'}
          </Text>
        </Card>
      ))}
    </Screen>
  );
}
