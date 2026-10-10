import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { colors } from '../theme';

export type MascotMood = 'happy' | 'calm' | 'surprised' | 'thinking' | 'celebrating';

interface MascotProps {
  size?: number;
  /** `teal` on light backgrounds; `cyan` (with ink features) on teal backgrounds. */
  tone?: 'teal' | 'cyan';
  mood?: MascotMood;
  cheeks?: boolean;
  /** Bounce in once (celebration: 0.9 → 1.05 → 1 over ~500ms). Off with Reduce Motion. */
  bounce?: boolean;
}

const BASE = 72;

/**
 * "Lipi", the stand-in mascot built from simple shapes at a 72px base. Real artwork will replace it.
 * Never shown on the escalation screen.
 */
export function Mascot({ size = BASE, tone = 'teal', mood = 'happy', cheeks = false, bounce = false }: MascotProps) {
  const body = tone === 'teal' ? colors.primary : colors.cyan;
  const feature = tone === 'teal' ? colors.white : colors.ink;
  const reduced = useReducedMotion();
  const scale = useSharedValue(bounce && !reduced ? 0.9 : 1);

  useEffect(() => {
    if (bounce && !reduced) {
      scale.set(withSequence(withTiming(1.05, { duration: 250 }), withSpring(1, { damping: 8, stiffness: 180 })));
    }
  }, [bounce, reduced, scale]);

  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const k = size / BASE;

  return (
    <Animated.View style={[{ width: size, height: size }, anim]} accessible={false} importantForAccessibility="no-hide-descendants">
      <View
        style={[
          styles.inner,
          { backgroundColor: body, left: (size - BASE) / 2, top: (size - BASE) / 2, transform: [{ scale: k }] },
        ]}
      >
        <Eyes mood={mood} color={feature} />
        <Mouth mood={mood} color={feature} />
        {cheeks && (
          <>
            <View style={[styles.cheek, { left: 9 }]} />
            <View style={[styles.cheek, { right: 9 }]} />
          </>
        )}
      </View>
    </Animated.View>
  );
}

function Eyes({ mood, color }: { mood: MascotMood; color: string }) {
  if (mood === 'calm') {
    const line: ViewStyle = { position: 'absolute', top: 30, width: 10, height: 3, borderRadius: 2, backgroundColor: color };
    return (
      <>
        <View style={[line, { left: 20 }]} />
        <View style={[line, { right: 20 }]} />
      </>
    );
  }
  if (mood === 'celebrating') {
    const arc: ViewStyle = {
      position: 'absolute',
      top: 27,
      width: 11,
      height: 7,
      borderWidth: 3,
      borderBottomWidth: 0,
      borderColor: color,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    };
    return (
      <>
        <View style={[arc, { left: 19 }]} />
        <View style={[arc, { right: 19 }]} />
      </>
    );
  }
  const eye: ViewStyle = { position: 'absolute', top: 25, width: 8, height: 12, borderRadius: 4, backgroundColor: color };
  return (
    <>
      <View style={[eye, { left: 21 }]} />
      <View style={[eye, { right: 21 }]} />
    </>
  );
}

function Mouth({ mood, color }: { mood: MascotMood; color: string }) {
  switch (mood) {
    case 'surprised':
      return <View style={{ position: 'absolute', left: 31, top: 42, width: 10, height: 10, borderRadius: 5, borderWidth: 3, borderColor: color }} />;
    case 'thinking':
      return <View style={{ position: 'absolute', left: 29, top: 46, width: 14, height: 3, borderRadius: 2, backgroundColor: color }} />;
    case 'celebrating':
      return (
        <View
          style={{ position: 'absolute', left: 26, top: 41, width: 20, height: 11, backgroundColor: color, borderBottomLeftRadius: 11, borderBottomRightRadius: 11 }}
        />
      );
    default:
      return (
        <View
          style={{
            position: 'absolute',
            left: 27,
            top: 41,
            width: 18,
            height: 9,
            borderWidth: 3,
            borderTopWidth: 0,
            borderColor: color,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          }}
        />
      );
  }
}

const styles = StyleSheet.create({
  inner: {
    position: 'absolute',
    width: BASE,
    height: BASE,
    borderTopLeftRadius: BASE * 0.5,
    borderTopRightRadius: BASE * 0.5,
    borderBottomLeftRadius: BASE * 0.44,
    borderBottomRightRadius: BASE * 0.44,
  },
  cheek: { position: 'absolute', top: 40, width: 10, height: 6, borderRadius: 3, backgroundColor: colors.lilacCheek },
});
