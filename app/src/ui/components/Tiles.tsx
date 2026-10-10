import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '../primitives/Icon';
import { PressableRaised, Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, radius, type ColorName, type TextVariant } from '../theme';

// ── Icon tile ─────────────────────────────────────────────────────────────────

export type TileTone = 'tint' | 'sky' | 'lilac' | 'ice' | 'soft' | 'cyan' | 'primary' | 'white' | 'dashed';

const TILE: Record<TileTone, { bg: string; fg: ColorName }> = {
  tint: { bg: colors.primaryTint, fg: 'primary' },
  sky: { bg: colors.sky, fg: 'skyIcon' },
  lilac: { bg: colors.lilac, fg: 'lilacIcon' },
  ice: { bg: colors.ice, fg: 'cyanBar' },
  soft: { bg: colors.surfaceSoft, fg: 'muted' },
  cyan: { bg: colors.cyan, fg: 'primaryDeep' },
  primary: { bg: colors.primary, fg: 'white' },
  white: { bg: colors.surface, fg: 'primary' },
  dashed: { bg: 'transparent', fg: 'primary' },
};

interface IconTileProps {
  icon?: LucideIcon;
  tone?: TileTone;
  size?: number;
}

/** Rounded square with a decor fill and an icon (34–44px). */
export function IconTile({ icon, tone = 'tint', size = 40 }: IconTileProps) {
  const t = TILE[tone];
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: size >= 40 ? radius.tile : radius.tileSmall, backgroundColor: t.bg },
        tone === 'dashed' && styles.dashed,
      ]}
    >
      {icon && <Icon icon={icon} size={Math.round(size * 0.5)} color={t.fg} />}
    </View>
  );
}

// ── Date tile ─────────────────────────────────────────────────────────────────

interface DateTileProps {
  month: string;
  day: string | number;
  tone?: 'primary' | 'tint' | 'white';
}

/** "SEP / 22" block on report and appointment cards. */
export function DateTile({ month, day, tone = 'tint' }: DateTileProps) {
  const bg = tone === 'primary' ? colors.primary : tone === 'white' ? colors.surface : colors.primaryTint;
  const fg: ColorName = tone === 'primary' ? 'white' : 'onPrimaryTint';
  return (
    <View style={[styles.date, { backgroundColor: bg }]}>
      <Text variant="overline" color={fg}>
        {month}
      </Text>
      <Text variant="h3" color={fg}>
        {day}
      </Text>
    </View>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────────

export type StatTone = 'primary' | 'sky' | 'lilac' | 'white' | 'tint';

const STAT: Record<StatTone, { bg: string; value: ColorName; label: ColorName }> = {
  primary: { bg: colors.primary, value: 'white', label: 'cyan' },
  sky: { bg: colors.sky, value: 'ink', label: 'onSky' },
  lilac: { bg: colors.lilac, value: 'ink', label: 'onLilac' },
  white: { bg: colors.surface, value: 'ink', label: 'muted' },
  tint: { bg: colors.primaryTint, value: 'onPrimaryTint', label: 'onPrimaryTint' },
};

interface StatTileProps {
  value: string | number;
  label: string;
  /** Small text after the value, e.g. "mg/dL" or "of 7". */
  unit?: string;
  /** Text above the value, e.g. "Next retest". */
  overline?: string;
  tone?: StatTone;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const STAT_VARIANT: Record<NonNullable<StatTileProps['size']>, TextVariant> = { sm: 'statS', md: 'stat', lg: 'statL' };

export function StatTile({ value, label, unit, overline, tone = 'white', size = 'md', footer, onPress, style }: StatTileProps) {
  const t = STAT[tone];
  const body = (
    <View style={[styles.stat, { backgroundColor: t.bg }, style]}>
      {overline && (
        <Text variant="small" color={t.label}>
          {overline}
        </Text>
      )}
      <View style={styles.statRow}>
        <Text variant={STAT_VARIANT[size]} color={t.value}>
          {value}
        </Text>
        {unit && (
          <Text variant="small" color={t.label}>
            {unit}
          </Text>
        )}
      </View>
      <Text variant="smallStrong" color={tone === 'primary' ? 'white' : 'ink'}>
        {label}
      </Text>
      {footer}
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} style={{ flex: 1 }} accessibilityLabel={`${overline ?? ''} ${value} ${unit ?? ''} ${label}`}>
      {body}
    </Tap>
  ) : (
    body
  );
}

// ── Source tile (add report / prescription) ───────────────────────────────────

export type SourceTone = 'primary' | 'sky' | 'lilac' | 'tint' | 'white';

const SOURCE_BG: Record<SourceTone, string> = {
  primary: colors.primary,
  sky: colors.sky,
  lilac: colors.lilac,
  tint: colors.primaryTint,
  white: colors.surface,
};
const SOURCE_ICON: Record<SourceTone, ColorName> = {
  primary: 'white',
  sky: 'skyIcon',
  lilac: 'lilacIcon',
  tint: 'primary',
  white: 'primary',
};

interface SourceTileProps {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  tone?: SourceTone;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Tile in the 2×2 "add a report / prescription" grids. The primary tile is raised teal. */
export function SourceTile({ icon, label, sublabel, tone = 'tint', onPress, style }: SourceTileProps) {
  const primary = tone === 'primary';
  const content = (
    <>
      <View style={[styles.sourceIcon, { backgroundColor: primary ? colors.primaryDecor : tone === 'white' ? colors.primaryTint : colors.surface }]}>
        <Icon icon={icon} size={20} color={SOURCE_ICON[tone]} />
      </View>
      <View style={{ gap: 2 }}>
        <Text variant="bodyStrong" color={primary ? 'white' : 'ink'}>
          {label}
        </Text>
        {sublabel && (
          <Text variant="small" color={primary ? 'cyan' : 'muted'}>
            {sublabel}
          </Text>
        )}
      </View>
    </>
  );
  if (primary) {
    return (
      <View style={style}>
        <PressableRaised onPress={onPress} accessibilityLabel={label} borderRadius={radius.card} shadowColor={colors.primaryPressed} depth={5} style={[styles.source, { backgroundColor: SOURCE_BG.primary }]}>
          {content}
        </PressableRaised>
      </View>
    );
  }
  return (
    <Tap onPress={onPress} accessibilityLabel={label} style={[styles.source, { backgroundColor: SOURCE_BG[tone] }, style]}>
      {content}
    </Tap>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dashed: { borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primaryDashed },
  date: { width: 54, paddingVertical: 8, borderRadius: radius.tile + 2, alignItems: 'center', gap: 0 },
  stat: { flex: 1, borderRadius: radius.card, padding: 16, gap: 4 },
  statRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  source: { borderRadius: radius.card, paddingVertical: 18, paddingHorizontal: 16, minHeight: 120, justifyContent: 'space-between', gap: 12 },
  sourceIcon: { width: 38, height: 38, borderRadius: radius.tileSmall, alignItems: 'center', justifyContent: 'center' },
});
