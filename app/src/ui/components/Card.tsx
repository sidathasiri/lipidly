import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { PressableRaised, Tap } from '../primitives/Pressables';
import { colors, radius } from '../theme';

export type CardTone = 'white' | 'tint' | 'sky' | 'lilac' | 'ice' | 'soft' | 'primary' | 'primaryDeep';

const BG: Record<CardTone, string> = {
  white: colors.surface,
  tint: colors.primaryTint,
  sky: colors.sky,
  lilac: colors.lilac,
  ice: colors.ice,
  soft: colors.surfaceSoft,
  primary: colors.primary,
  primaryDeep: colors.primaryDeep,
};

interface CardProps {
  children: ReactNode;
  tone?: CardTone;
  /** `hero` = radius 28 (hero cards); default radius 24. */
  size?: 'default' | 'hero' | 'compact';
  /** Solid "raised" shadow under a primary card (`0 6px 0 #155E75`). */
  raised?: boolean;
  /** 2.5px primary ring: selected, or a question still to answer. */
  selected?: boolean;
  padding?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const RADIUS = { default: radius.card, hero: radius.cardLarge, compact: 18 } as const;

export function Card({
  children,
  tone = 'white',
  size = 'default',
  raised,
  selected,
  padding = 16,
  onPress,
  accessibilityLabel,
  style,
}: CardProps) {
  const r = RADIUS[size];
  const face: StyleProp<ViewStyle> = [
    { backgroundColor: BG[tone], borderRadius: r, padding, overflow: 'hidden' },
    selected ? styles.ring : null,
    style,
  ];

  if (raised) {
    return (
      <PressableRaised
        onPress={onPress}
        disabled={!onPress}
        haptic={!!onPress}
        accessibilityLabel={accessibilityLabel}
        borderRadius={r}
        shadowColor={colors.primaryPressed}
        depth={6}
        style={face}
      >
        {children}
      </PressableRaised>
    );
  }
  if (onPress) {
    return (
      <Tap onPress={onPress} accessibilityLabel={accessibilityLabel} style={face}>
        {children}
      </Tap>
    );
  }
  return <View style={face}>{children}</View>;
}

const styles = StyleSheet.create({
  ring: { borderWidth: 2.5, borderColor: colors.primary, margin: -2.5 },
});
