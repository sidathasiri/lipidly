import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { motion } from '../theme';

interface RaisedProps extends Omit<PressableProps, 'style' | 'children'> {
  children: ReactNode;
  /** Face style: background, radius, padding, size. */
  style?: StyleProp<ViewStyle>;
  /** Colour of the solid "raised" shadow under the face, e.g. #155E75. */
  shadowColor?: string;
  /** Height of the solid shadow (5 for buttons, 6 for cards). 0 = flat. */
  depth?: number;
  borderRadius: number;
  haptic?: boolean;
}

/**
 * The design's raised press: a solid offset shadow (`0 5px 0 #155E75`) under the face.
 * On press the face moves down 3px over 80ms and the shadow shrinks to 2px.
 */
export function PressableRaised({
  children,
  style,
  shadowColor,
  depth = 5,
  borderRadius,
  disabled,
  haptic = true,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: RaisedProps) {
  const reduced = useReducedMotion();
  const y = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }));
  const showShadow = !!shadowColor && depth > 0 && !disabled;
  const travel = showShadow ? Math.min(3, depth) : 0;

  return (
    <Pressable
      {...rest}
      disabled={disabled}
      accessibilityRole={rest.accessibilityRole ?? 'button'}
      accessibilityState={{ disabled: !!disabled, ...rest.accessibilityState }}
      onPressIn={(e) => {
        y.set(reduced ? travel : withTiming(travel, { duration: motion.pressMs }));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        y.set(reduced ? 0 : withTiming(0, { duration: motion.pressMs }));
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={{ paddingBottom: showShadow ? depth : 0 }}
    >
      {showShadow && (
        <View style={[StyleSheet.absoluteFill, { top: depth, backgroundColor: shadowColor, borderRadius }]} />
      )}
      <Animated.View style={[{ borderRadius }, style, face]}>{children}</Animated.View>
    </Pressable>
  );
}

interface TapProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

/** Flat pressable for rows, chips and icon buttons: dims slightly while pressed. */
export function Tap({ style, haptic = false, onPress, ...rest }: TapProps) {
  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      onPress={(e) => {
        if (haptic) Haptics.selectionAsync().catch(() => {});
        onPress?.(e);
      }}
      style={({ pressed }) => [style, pressed && !rest.disabled ? { opacity: 0.72 } : null]}
    />
  );
}
