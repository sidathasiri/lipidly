import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, fonts, radius } from '../theme';
import { Button } from './Button';

// ── Value field (Confirm values, manual entry) ────────────────────────────────

interface ValueFieldProps {
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  /** Consistency check failed: primary border on tint. Never blocks. */
  flagged?: boolean;
  accessibilityLabel: string;
  placeholder?: string;
}

/** 76×38 editable pill with a unit label beside it. */
export function ValueField({ value, onChange, unit, flagged, accessibilityLabel, placeholder }: ValueFieldProps) {
  return (
    <View style={styles.valueRow}>
      <TextInput
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        selectTextOnFocus
        placeholder={placeholder ?? '–'}
        placeholderTextColor={colors.subtle}
        accessibilityLabel={accessibilityLabel}
        style={[styles.value, flagged && styles.valueFlagged]}
      />
      <Text variant="caption" weight={600} color="muted" style={styles.unit}>
        {unit ?? ''}
      </Text>
    </View>
  );
}

// ── Field box (Confirm prescription) ──────────────────────────────────────────

interface FieldBoxProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** Blank fields block confirmation until filled (F7.4: never guessed). */
  blankMessage?: string;
}

/**
 * Label + value in a soft box; tap to edit. A blank field shows the dashed teal
 * "Couldn't read this" state with an Add button.
 */
export function FieldBox({ label, value, onChange, blankMessage = 'Couldn’t read this. Please fill in.' }: FieldBoxProps) {
  const [editing, setEditing] = useState(false);
  const blank = !value.trim();

  if (editing) {
    return (
      <View style={[styles.box, styles.boxEditing]}>
        <Text variant="caption" color="muted">
          {label}
        </Text>
        <TextInput
          autoFocus
          value={value}
          onChangeText={onChange}
          onBlur={() => setEditing(false)}
          onSubmitEditing={() => setEditing(false)}
          returnKeyType="done"
          accessibilityLabel={label}
          style={styles.boxInput}
        />
      </View>
    );
  }
  if (blank) {
    return (
      <View style={[styles.box, styles.boxBlank]}>
        <View style={{ flex: 1 }}>
          <Text variant="caption" color="onPrimaryTint">
            {label}
          </Text>
          <Text variant="small" color="onPrimaryTint">
            {blankMessage}
          </Text>
        </View>
        <Button label="Add" size="xs" onPress={() => setEditing(true)} />
      </View>
    );
  }
  return (
    <Tap onPress={() => setEditing(true)} accessibilityLabel={`${label}: ${value}. Tap to edit`} style={styles.box}>
      <Text variant="caption" color="muted">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </Tap>
  );
}

const styles = StyleSheet.create({
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  value: {
    width: 76,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontFamily: fonts.body800,
    fontSize: 16,
    color: colors.ink,
    padding: 0,
  },
  valueFlagged: { backgroundColor: colors.primaryTint, borderWidth: 2.5, borderColor: colors.primary },
  unit: { width: 44 },
  box: { flex: 1, backgroundColor: colors.background, borderRadius: radius.field, paddingVertical: 8, paddingHorizontal: 12, gap: 1 },
  boxEditing: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.surface },
  boxBlank: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryTint, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.primary },
  boxInput: { fontFamily: fonts.body800, fontSize: 16, color: colors.ink, padding: 0, minHeight: 22 },
});
