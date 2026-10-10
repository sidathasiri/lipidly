import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Status } from '@lipidly/rules';
import { STATUS_LABELS } from '@lipidly/rules';
import { Icon } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import { colors, statusColors, type ColorName } from '../theme';

export type ChipTone = 'tint' | 'soft' | 'white' | 'sky' | 'lilac' | 'primary' | 'onPrimary';

const TONE: Record<ChipTone, { bg: string; fg: ColorName }> = {
  tint: { bg: colors.primaryTint, fg: 'onPrimaryTint' },
  soft: { bg: colors.surfaceSoft, fg: 'muted' },
  white: { bg: colors.surface, fg: 'primary' },
  sky: { bg: colors.sky, fg: 'onSky' },
  lilac: { bg: colors.lilac, fg: 'onLilac' },
  primary: { bg: colors.primary, fg: 'white' },
  onPrimary: { bg: colors.primaryDecor, fg: 'white' },
};

interface ChipProps {
  label: string;
  tone?: ChipTone;
  icon?: LucideIcon;
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Non-interactive tag: "Active mode", "Best run · 9 days", "✓ Committed", needs and food chips. */
export function Chip({ label, tone = 'tint', icon, dense = true, style }: ChipProps) {
  const t = TONE[tone];
  return (
    <View style={[styles.chip, { backgroundColor: t.bg }, dense ? styles.dense : styles.roomy, style]}>
      {icon && <Icon icon={icon} size={14} color={t.fg} />}
      <Text variant={dense ? 'smallStrong' : 'bodyMedium'} color={t.fg} weight={800}>
        {label}
      </Text>
    </View>
  );
}

/** Maps a rule-engine status to its colour pair. Low HDL and very high use the red pair. */
const statusPair = (status: Status) =>
  status === 'inRange' ? statusColors.inRange : status === 'borderline' ? statusColors.borderline : statusColors.high;

interface StatusChipProps {
  status: Status;
  /** Overrides the label, e.g. "Triglycerides high". */
  label?: string;
  /** Fixed width 82 in results lists. */
  fixedWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Lab result status. Always shows a text label as well as colour (F3.4). */
export function StatusChip({ status, label, fixedWidth, style }: StatusChipProps) {
  const pair = statusPair(status);
  return (
    <View
      style={[styles.status, { backgroundColor: pair.bg }, fixedWidth ? styles.fixed : null, style]}
      accessibilityLabel={`Status: ${label ?? STATUS_LABELS[status]}`}
    >
      <Text variant="caption" weight={800} style={{ color: pair.fg }} numberOfLines={1}>
        {label ?? STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

/** Small status dot for legends; always paired with a label by the caller. */
export function StatusDot({ status, size = 10 }: { status: Status; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: statusPair(status).fg }} />;
}

export { statusPair };

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, alignSelf: 'flex-start' },
  dense: { paddingVertical: 6, paddingHorizontal: 12 },
  roomy: { paddingVertical: 8, paddingHorizontal: 14 },
  status: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 999, alignSelf: 'flex-start', alignItems: 'center' },
  fixed: { width: 82 },
});
