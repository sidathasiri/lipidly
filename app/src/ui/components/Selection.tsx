import { StyleSheet, View } from 'react-native';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors } from '../theme';

interface RadioCardProps {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
  /** Shown at 55% opacity and cannot be picked; the subtitle should say why. */
  disabled?: boolean;
}

/** Selectable card with a radio. Selected = primary ring and a 7px-border radio. */
export function RadioCard({ title, subtitle, selected, onPress, disabled }: RadioCardProps) {
  return (
    <Tap
      onPress={onPress}
      disabled={disabled}
      haptic
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: !!disabled }}
      accessibilityLabel={[title, subtitle].filter(Boolean).join('. ')}
      style={[styles.card, selected && styles.selected, disabled && styles.disabled]}
    >
      <View style={[styles.radio, selected ? styles.radioOn : styles.radioOff]} />
      <View style={styles.text}>
        <Text variant="bodyStrong">{title}</Text>
        {subtitle && (
          <Text variant="small" weight={400} color="muted">
            {subtitle}
          </Text>
        )}
      </View>
    </Tap>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 22, paddingVertical: 14, paddingHorizontal: 16 },
  selected: { borderWidth: 2.5, borderColor: colors.primary, margin: -2.5 },
  disabled: { opacity: 0.55 },
  radio: { width: 24, height: 24, borderRadius: 12 },
  radioOn: { borderWidth: 7, borderColor: colors.primary },
  radioOff: { borderWidth: 2, borderColor: colors.subtle },
  text: { flex: 1, gap: 2 },
});
