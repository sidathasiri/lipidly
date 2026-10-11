import { weeklyGoalFor } from '@lipidly/domain';
import { router } from 'expo-router';
import { Trophy } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { stepGoal } from '@/state/actions/engagement';
import { useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import { Button, Card, colors, IconTile, Text } from '@/ui';

/** This week's bonus goal (F14.3): tick it off as you go; links to meal ideas or Learn where it helps. */
export function WeeklyGoalCard() {
  const current = weeklyGoalFor(useUserData(), today());
  if (!current) return null;
  const { goal, count } = current;
  const done = count >= goal.target;
  const link = goal.link === 'meals' ? { label: 'Meal ideas', go: () => router.push('/plan/meals') } : goal.link === 'learn' ? { label: 'Learn', go: () => router.push('/learn/lipid-profile') } : undefined;

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.head}>
        <IconTile icon={Trophy} tone={done ? 'tint' : 'lilac'} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text variant="overline" color="primary">
            This week&apos;s bonus goal
          </Text>
          <Text variant="label">{goal.title}</Text>
          <Text variant="small" weight={400} color="muted">
            {done ? 'Goal complete. Nice work!' : goal.detail}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.dots} accessibilityLabel={`${count} of ${goal.target} done`}>
          {Array.from({ length: goal.target }, (_, i) => (
            <View key={i} style={[styles.dot, i < count && styles.dotDone]} />
          ))}
        </View>
        {count > 0 && <Button label="Undo" size="xs" variant="link" onPress={() => stepGoal(-1)} />}
        {link && !done && <Button label={link.label} size="xs" variant="tint" onPress={link.go} />}
        {!done && <Button label={goal.target > 1 ? 'Done one' : 'Done'} size="xs" onPress={() => stepGoal(1)} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dots: { flexDirection: 'row', gap: 6, flex: 1 },
  dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.line },
  dotDone: { backgroundColor: colors.primary },
});
