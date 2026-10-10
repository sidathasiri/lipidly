import { forwardRef, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, fonts, motion, radius, shadows, sizes } from '../theme';

// ── Yes / No answer pair (check-in) ───────────────────────────────────────────

interface AnswerPairProps {
  value: boolean | undefined;
  onChange: (value: boolean) => void;
  yesLabel?: string;
  noLabel?: string;
}

/** Two equal pills. Unanswered: both tint. Yes: primary. No: ink. The other one turns soft. */
export function AnswerPair({ value, onChange, yesLabel = 'Yes', noLabel = 'No' }: AnswerPairProps) {
  const cell = (isYes: boolean) => {
    const picked = value === isYes;
    const unanswered = value === undefined;
    const bg = unanswered ? colors.primaryTint : picked ? (isYes ? colors.primary : colors.ink) : colors.surfaceSoft;
    const label = isYes ? yesLabel : noLabel;
    return (
      <Tap
        haptic
        onPress={() => onChange(isYes)}
        accessibilityRole="radio"
        accessibilityState={{ selected: picked }}
        accessibilityLabel={label}
        style={[styles.answer, { backgroundColor: bg }]}
      >
        <Text variant="bodyStrong" weight={unanswered || picked ? 800 : 600} color={unanswered ? 'primary' : picked ? 'white' : 'muted'}>
          {picked ? `✓ ${label}` : label}
        </Text>
      </Tap>
    );
  };
  return (
    <View style={styles.pair} accessibilityRole="radiogroup">
      {cell(true)}
      {cell(false)}
    </View>
  );
}

// ── Segmented control (Week / Month) ──────────────────────────────────────────

interface SegmentedProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}

export function SegmentedControl<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.segTrack} accessibilityRole="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={[styles.seg, active && styles.segActive]}
          >
            <Text variant="caption" weight={800} color={active ? 'ink' : 'muted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────

interface ToggleProps {
  value: boolean;
  onChange: (v: boolean) => void;
  accessibilityLabel: string;
}

/** 48×30 switch drawn to the design (RN Switch can't match it). */
export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  const { width, height, knob } = sizes.toggle;
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(value ? width - knob - 3 : 3, { duration: motion.chipMs }) }],
  }));
  return (
    <Pressable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={{ width, height, borderRadius: height / 2, backgroundColor: value ? colors.primary : colors.toggleOff, justifyContent: 'center' }}
    >
      <Animated.View style={[{ width: knob, height: knob, borderRadius: knob / 2, backgroundColor: colors.white }, knobStyle]} />
    </Pressable>
  );
}

// ── Text field ────────────────────────────────────────────────────────────────

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  /** Trailing unit or text inside the field, e.g. "cm". */
  suffix?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, hint, suffix, style, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldWrap}>
      {label && (
        <Text variant="label" color="ink">
          {label}
        </Text>
      )}
      <View style={[styles.field, focused && styles.fieldFocused, !!error && styles.fieldError]}>
        <TextInput
          ref={ref}
          placeholderTextColor={colors.subtle}
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[styles.input, style]}
        />
        {suffix && (
          <Text variant="small" color="muted">
            {suffix}
          </Text>
        )}
      </View>
      {error ? (
        <Text variant="small" color="ink">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="small" color="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});

// ── Six-digit code ────────────────────────────────────────────────────────────

interface CodeInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

/** Six boxes over one hidden input. The next empty box shows the focus ring and halo. */
export function CodeInput({ value, onChange, length = 6 }: CodeInputProps) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(true);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="Verification code">
      <View style={styles.codeRow}>
        {Array.from({ length }, (_, i) => {
          const active = focused && i === Math.min(value.length, length - 1);
          return (
            <View key={i} style={styles.codeCell}>
              {active && <View style={styles.codeHalo} />}
              <View style={[styles.codeBox, active && styles.codeBoxActive]}>
                <Text variant="figure">
                  {value[i] ?? ''}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoFocus
        maxLength={length}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={styles.hidden}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pair: { flexDirection: 'row', gap: 8 },
  answer: { flex: 1, height: sizes.answerButton, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segTrack: { flexDirection: 'row', backgroundColor: colors.surfaceSoft, borderRadius: 999, padding: 3 },
  seg: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 999 },
  segActive: { backgroundColor: colors.surface, ...shadows.segment },
  fieldWrap: { gap: 8 },
  field: {
    minHeight: 54,
    borderRadius: radius.field,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldFocused: { borderColor: colors.primary },
  fieldError: { borderColor: colors.ink },
  input: { flex: 1, fontFamily: fonts.body600, fontSize: 16, color: colors.ink, paddingVertical: 14 },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeCell: { flex: 1, height: 62 },
  codeHalo: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderRadius: radius.input + 4, backgroundColor: colors.primaryTint },
  codeBox: {
    flex: 1,
    borderRadius: radius.input,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBoxActive: { borderWidth: 2.5, borderColor: colors.primary },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
