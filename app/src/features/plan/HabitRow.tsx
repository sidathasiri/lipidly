import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { PlanHabit } from '@/state/types';
import { colors, Icon, IconTile, Tap, Text } from '@/ui';
import { habitLabel, habitVisual } from './habitVisual';

interface HabitRowProps {
  habit: PlanHabit;
  subtitle?: string;
  /** Trailing actions (commit / swap). Defaults to a chevron when tappable. */
  trailing?: ReactNode;
  onPress?: () => void;
}

/** One habit card: icon tile, title, subtitle. Doctor habits sit on a tint card with an overline. */
export function HabitRow({ habit, subtitle, trailing, onPress }: HabitRowProps) {
  const doctor = habit.source === 'doctor';
  const label = habitLabel(habit);
  const v = habitVisual(habit);
  return (
    <Tap
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={[label, habit.title, subtitle].filter(Boolean).join(', ')}
      style={[styles.card, { backgroundColor: doctor ? colors.primaryTint : colors.surface }]}
    >
      <IconTile icon={v.icon} tone={doctor ? 'white' : v.tone} size={40} />
      <View style={styles.text}>
        {label && (
          <Text variant="overline" color={doctor ? 'onPrimaryTint' : 'onLilac'}>
            {label}
          </Text>
        )}
        <Text variant="bodyStrong">{habit.title}</Text>
        {subtitle && (
          <Text variant="small" weight={400} color="muted">
            {subtitle}
          </Text>
        )}
      </View>
      {trailing ?? (onPress ? <Icon icon={ChevronRight} size={18} color="muted" /> : null)}
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 22, paddingVertical: 12, paddingHorizontal: 14 },
  text: { flex: 1, gap: 1 },
});
