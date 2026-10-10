import { router } from 'expo-router';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  SlideInDown,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import { Text } from '../primitives/Text';
import { Tap } from '../primitives/Pressables';
import { colors, radius, shadows } from '../theme';

/** Diagonal stripe offsets for the document placeholder (wide enough for any phone). */
const STRIPES = Array.from({ length: 70 }, (_, i) => i * 22 - 600);

// ── Bottom sheet ──────────────────────────────────────────────────────────────

interface SheetProps {
  children: ReactNode;
  onDismiss?: () => void;
}

/** Bottom sheet over a dim backdrop (top radius 36). Used as a transparent-modal route. */
export function Sheet({ children, onDismiss = () => router.back() }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.sheetRoot}>
      <Animated.View entering={FadeIn.duration(150)} style={StyleSheet.absoluteFill}>
        <Pressable style={styles.backdrop} onPress={onDismiss} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View entering={SlideInDown.duration(260)} style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.grabber} />
        {children}
      </Animated.View>
    </View>
  );
}

// ── Document preview ──────────────────────────────────────────────────────────

interface DocumentPreviewProps {
  /** Placeholder label until real images are wired in, e.g. "original report · page 1". */
  label: string;
  height?: number;
  /** Highlighted source line, as fractions of the preview (x, y, width, height). */
  highlight?: { x: number; y: number; w: number; h: number };
  badge?: string;
  onPress?: () => void;
  dark?: boolean;
}

/** Striped stand-in for a document image, with an optional highlighted line. */
export function DocumentPreview({ label, height = 210, highlight, badge = 'Pinch to zoom', onPress, dark }: DocumentPreviewProps) {
  const stripe = dark ? colors.darkSurface2 : colors.line;
  const bg = dark ? colors.darkSurface : colors.surfaceSoft;
  const body = (
    <View style={[styles.doc, { height, backgroundColor: bg }]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        {STRIPES.map((x) => (
          <Line key={x} x1={x} y1={0} x2={x + 600} y2={600} stroke={stripe} strokeWidth={10} />
        ))}
      </Svg>
      <Text variant="small" color={dark ? 'subtle' : 'muted'} style={styles.docLabel}>
        {label}
      </Text>
      {highlight && (
        <View
          style={[
            styles.highlight,
            { left: `${highlight.x * 100}%`, top: `${highlight.y * 100}%`, width: `${highlight.w * 100}%`, height: `${highlight.h * 100}%` },
          ]}
        />
      )}
      {badge && (
        <View style={styles.badge}>
          <Text variant="smallStrong" weight={800}>
            {badge}
          </Text>
        </View>
      )}
    </View>
  );
  return onPress ? (
    <Tap onPress={onPress} accessibilityLabel={`Open ${label}`}>
      {body}
    </Tap>
  ) : (
    body
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────

const PIECES = [
  { x: 0.1, y: 0.13, s: 14, c: colors.cyan, round: true },
  { x: 0.77, y: 0.11, s: 22, c: colors.lilac, round: false },
  { x: 0.86, y: 0.3, s: 12, c: colors.sky, round: true },
  { x: 0.2, y: 0.35, s: 18, c: colors.lilacCheek, round: false },
  { x: 0.6, y: 0.06, s: 10, c: colors.white, round: true },
  { x: 0.4, y: 0.22, s: 12, c: colors.cyan, round: false },
  { x: 0.92, y: 0.5, s: 16, c: colors.cyan, round: true },
  { x: 0.05, y: 0.55, s: 12, c: colors.sky, round: false },
];

/** Static confetti shapes that fall into place over 1.2s. Static with Reduce Motion. */
export function Confetti() {
  const { width, height } = useWindowDimensions();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PIECES.map((p, i) => (
        <Piece key={i} {...p} left={p.x * width} top={p.y * height} delay={i * 60} />
      ))}
    </View>
  );
}

function Piece({ left, top, s, c, round, delay }: { left: number; top: number; s: number; c: string; round: boolean; delay: number }) {
  const reduced = useReducedMotion();
  const t = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) t.set(withDelay(delay, withTiming(1, { duration: 1200 - delay, easing: Easing.out(Easing.quad) })));
  }, [delay, reduced, t]);
  const style = useAnimatedStyle(() => {
    const v = t.get();
    return { opacity: v, transform: [{ translateY: (v - 1) * 120 }, { rotate: `${(1 - v) * 90 + (round ? 0 : 20)}deg` }] };
  });
  return <Animated.View style={[{ position: 'absolute', left, top, width: s, height: s, borderRadius: round ? s / 2 : 4, backgroundColor: c }, style]} />;
}

const styles = StyleSheet.create({
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.headerBottom,
    borderTopRightRadius: radius.headerBottom,
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 14,
  },
  grabber: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.dashedNeutral, alignSelf: 'center' },
  doc: { borderRadius: radius.card, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  docLabel: { fontFamily: 'Menlo', fontSize: 12 },
  highlight: { position: 'absolute', borderWidth: 2.5, borderColor: colors.primary, borderRadius: 8, backgroundColor: 'rgba(14,116,144,0.12)' },
  badge: { position: 'absolute', right: 12, bottom: 12, backgroundColor: colors.surface, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12, ...shadows.floating },
});
