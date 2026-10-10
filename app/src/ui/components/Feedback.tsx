import { CloudOff, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Icon } from '../primitives/Icon';
import { Text } from '../primitives/Text';
import { colors, radius, type ColorName } from '../theme';
import { Button } from './Button';
import { Mascot, type MascotMood } from './Mascot';

// ── Callout ───────────────────────────────────────────────────────────────────

export type CalloutTone = 'tint' | 'sky' | 'lilac' | 'soft' | 'white';

const CALLOUT: Record<CalloutTone, { bg: string; title: ColorName; body: ColorName }> = {
  tint: { bg: colors.primaryTint, title: 'onPrimaryTint', body: 'onPrimaryTint' },
  sky: { bg: colors.sky, title: 'onSky', body: 'onSky' },
  lilac: { bg: colors.lilac, title: 'onLilac', body: 'onLilac' },
  soft: { bg: colors.surfaceSoft, title: 'ink', body: 'muted' },
  white: { bg: colors.surface, title: 'ink', body: 'muted' },
};

interface CalloutProps {
  tone?: CalloutTone;
  title?: string;
  children?: ReactNode;
  /** Small mascot beside the text (tips). */
  mascot?: MascotMood;
  icon?: LucideIcon;
  /** Inline action, e.g. "Undo" or "Edit". */
  action?: ReactNode;
}

/** Info block: "What changed", mascot tips, scope notices, disclaimers, check messages. */
export function Callout({ tone = 'tint', title, children, mascot, icon, action }: CalloutProps) {
  const t = CALLOUT[tone];
  return (
    <View style={[styles.callout, { backgroundColor: t.bg }]}>
      {mascot && <Mascot size={40} mood={mascot} />}
      {icon && !mascot && <Icon icon={icon} size={20} color={t.title} />}
      <View style={styles.calloutText}>
        {title && (
          <Text variant="bodyStrong" color={t.title}>
            {title}
          </Text>
        )}
        {typeof children === 'string' ? (
          <Text variant="body" color={t.body}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
      {action}
    </View>
  );
}

// ── Screen states ─────────────────────────────────────────────────────────────

interface ScreenStateProps {
  kind: 'loading' | 'empty' | 'error' | 'offline';
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const DEFAULTS: Record<ScreenStateProps['kind'], { title: string; message: string; mood: MascotMood }> = {
  loading: { title: 'Loading', message: '', mood: 'calm' },
  empty: { title: 'Nothing here yet', message: '', mood: 'happy' },
  error: { title: 'Something went wrong', message: 'Please try again in a moment.', mood: 'thinking' },
  offline: { title: 'You’re offline', message: 'Your check-ins and doses are saved on this phone and will sync later.', mood: 'calm' },
};

/** The same loading / empty / error / offline look on every screen. */
export function ScreenState({ kind, title, message, actionLabel, onAction }: ScreenStateProps) {
  const d = DEFAULTS[kind];
  return (
    <View style={styles.state} accessibilityLiveRegion="polite">
      {kind === 'loading' ? <ActivityIndicator size="large" color={colors.primary} /> : <Mascot size={64} mood={d.mood} />}
      <Text variant="h3" align="center">
        {title ?? d.title}
      </Text>
      {(message ?? d.message) !== '' && (
        <Text variant="body" color="muted" align="center">
          {message ?? d.message}
        </Text>
      )}
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} size="sm" variant="secondary" />}
    </View>
  );
}

/** Thin banner shown at the top of data screens while offline. */
export function OfflineBanner() {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Icon icon={CloudOff} size={16} color="onSky" />
      <Text variant="small" color="onSky">
        Offline. Changes will sync when you reconnect.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  callout: { flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.card - 4, alignItems: 'flex-start' },
  calloutText: { flex: 1, gap: 4 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32, minHeight: 280 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.sky, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 14 },
});
