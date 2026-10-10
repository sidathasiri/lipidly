import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Icon } from '../primitives/Icon';
import { PressableRaised, Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, radius, type ColorName, type TextVariant } from '../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'onPrimary' | 'white' | 'primaryDeep' | 'tint' | 'dark' | 'link' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: LucideIcon;
  /** Layout only (flex, margin, alignSelf). */
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
}

const HEIGHT: Record<ButtonSize, number> = { lg: 56, md: 52, sm: 46, xs: 36 };
const LABEL: Record<ButtonSize, TextVariant> = { lg: 'title', md: 'bodyStrong', sm: 'bodyStrong', xs: 'smallStrong' };

const LOOK: Record<ButtonVariant, { bg?: string; fg: ColorName; border?: string; shadow?: string }> = {
  primary: { bg: colors.primary, fg: 'white', shadow: colors.primaryPressed },
  secondary: { bg: colors.surface, fg: 'ink', border: colors.line },
  onPrimary: { bg: colors.surface, fg: 'primary', shadow: colors.primaryPressed },
  /** Flat white pill on a teal card (dose actions). */
  white: { bg: colors.surface, fg: 'primary' },
  primaryDeep: { bg: colors.primaryDeep, fg: 'white' },
  tint: { bg: colors.primaryTint, fg: 'primary' },
  dark: { bg: colors.ink, fg: 'white' },
  link: { fg: 'primary' },
  ghost: { fg: 'muted' },
};

/** All buttons in the app. Primary and on-primary buttons are "raised" (solid shadow, press-down). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled,
  loading,
  icon,
  style,
  accessibilityHint,
}: ButtonProps) {
  const look = LOOK[variant];
  const textOnly = variant === 'link' || variant === 'ghost';
  const isDisabled = disabled || loading;
  const fg: ColorName = isDisabled && variant === 'primary' ? 'white' : look.fg;
  const content = (
    <View style={styles.row}>
      {loading ? <ActivityIndicator color={colors[fg]} /> : icon ? <Icon icon={icon} size={size === 'xs' ? 16 : 20} color={fg} /> : null}
      <Text variant={LABEL[size]} color={fg} weight={textOnly && variant === 'ghost' ? 600 : undefined} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
        {label}
      </Text>
    </View>
  );

  if (textOnly) {
    return (
      <Tap onPress={onPress} disabled={isDisabled} accessibilityLabel={label} accessibilityHint={accessibilityHint} style={[styles.text, style]} hitSlop={8}>
        {content}
      </Tap>
    );
  }

  const bg = isDisabled && variant === 'primary' ? colors.primaryDisabled : look.bg;
  return (
    <View style={style}>
      <PressableRaised
        onPress={onPress}
        disabled={isDisabled}
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        borderRadius={radius.pill}
        shadowColor={look.shadow}
        depth={look.shadow ? 5 : 0}
        style={[
          styles.face,
          { height: HEIGHT[size], backgroundColor: bg, paddingHorizontal: size === 'lg' ? 20 : size === 'xs' ? 14 : 10 },
          look.border ? { borderWidth: 2, borderColor: look.border } : null,
          isDisabled && variant !== 'primary' ? { opacity: 0.5 } : null,
        ]}
      >
        {content}
      </PressableRaised>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { alignItems: 'center', justifyContent: 'center', paddingVertical: 6 },
});
