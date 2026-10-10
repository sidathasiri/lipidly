import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../primitives/Icon';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, radius, type ColorName } from '../theme';

// ── Round icon button (back / close) ──────────────────────────────────────────

interface IconButtonProps {
  kind?: 'back' | 'close';
  onPress?: () => void;
  /** `dark` for camera and viewer screens. */
  tone?: 'light' | 'dark';
}

export function IconButton({ kind = 'back', onPress, tone = 'light' }: IconButtonProps) {
  const dark = tone === 'dark';
  return (
    <Tap
      onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/home')))}
      accessibilityLabel={kind === 'back' ? 'Back' : 'Close'}
      hitSlop={8}
      style={[styles.iconBtn, { backgroundColor: dark ? colors.darkSurface : colors.surface }]}
    >
      <Icon icon={kind === 'back' ? ChevronLeft : X} size={20} color={dark ? 'white' : 'muted'} />
    </Tap>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────

interface TopBarProps {
  left?: 'back' | 'close' | 'none';
  onLeft?: () => void;
  title?: string;
  /** Right slot: a step chip ("1 of 2"), a count ("2/4") or an action. */
  right?: ReactNode;
  /** Centre slot replacing the title, e.g. a segmented progress bar. */
  center?: ReactNode;
  tone?: 'light' | 'dark';
}

export function TopBar({ left = 'back', onLeft, title, right, center, tone = 'light' }: TopBarProps) {
  return (
    <View style={styles.topBar}>
      {left === 'none' ? <View style={styles.side} /> : <IconButton kind={left} onPress={onLeft} tone={tone} />}
      <View style={styles.center}>
        {center ??
          (title ? (
            <Text variant="title" align="center" color={tone === 'dark' ? 'white' : 'ink'} numberOfLines={1}>
              {title}
            </Text>
          ) : null)}
      </View>
      {right ?? (center ? null : <View style={styles.side} />)}
    </View>
  );
}

/** "1 of 2"-style pill for the TopBar's right slot. */
export function StepPill({ label, tone = 'light' }: { label: string; tone?: 'light' | 'dark' }) {
  return (
    <View style={[styles.stepPill, { backgroundColor: tone === 'dark' ? colors.darkSurface : colors.surface }]}>
      <Text variant="smallStrong" color={tone === 'dark' ? 'white' : 'muted'}>
        {label}
      </Text>
    </View>
  );
}

// ── Coloured header ───────────────────────────────────────────────────────────

export type HeaderTone = 'tint' | 'primary' | 'sky' | 'lilac' | 'ice';

const HEADER_BG: Record<HeaderTone, string> = {
  tint: colors.primaryTint,
  primary: colors.primary,
  sky: colors.sky,
  lilac: colors.lilac,
  ice: colors.ice,
};

interface ColouredHeaderProps {
  tone: HeaderTone;
  children: ReactNode;
  /** Back / close button row above the content. */
  left?: 'back' | 'close';
  onLeft?: () => void;
  right?: ReactNode;
  paddingBottom?: number;
}

/** Full-bleed tinted block behind the status bar with 36px bottom corners. */
export function ColouredHeader({ tone, children, left, onLeft, right, paddingBottom = 24 }: ColouredHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { backgroundColor: HEADER_BG[tone], paddingTop: insets.top + 12, paddingBottom }]}>
      <StatusBar style={tone === 'primary' ? 'light' : 'dark'} />
      {(left || right) && (
        <View style={styles.headerRow}>
          {left ? <IconButton kind={left} onPress={onLeft} /> : <View />}
          {right}
        </View>
      )}
      {children}
    </View>
  );
}

/** Text colour that reads on each header tone. */
export const onHeader = (tone: HeaderTone): { title: ColorName; sub: ColorName } =>
  tone === 'primary' ? { title: 'white', sub: 'cyan' } : tone === 'sky' ? { title: 'ink', sub: 'onSky' } : { title: 'ink', sub: 'muted' };

const styles = StyleSheet.create({
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 44 },
  side: { width: 36 },
  center: { flex: 1, justifyContent: 'center' },
  stepPill: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.pill },
  header: {
    borderBottomLeftRadius: radius.headerBottom,
    borderBottomRightRadius: radius.headerBottom,
    paddingHorizontal: 20,
    gap: 12,
    overflow: 'hidden',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
