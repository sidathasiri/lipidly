import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, fonts } from '../theme';

interface ChoiceChipProps {
  label: string;
  selected?: boolean;
  dense?: boolean;
  onPress?: () => void;
  /** Fills its grid cell at 50px tall (the three-option rows in Profile setup). */
  block?: boolean;
}

/** Selectable pill. Selected = primary fill with "✓ " prefix. */
export function ChoiceChip({ label, selected, dense, onPress, block }: ChoiceChipProps) {
  return (
    <Tap
      onPress={onPress}
      haptic
      accessibilityRole={'checkbox'}
      accessibilityState={{ checked: !!selected }}
      accessibilityLabel={label}
      style={[
        styles.chip,
        dense ? styles.dense : styles.normal,
        block && styles.block,
        selected ? styles.selected : styles.unselected,
      ]}
    >
      <Text
        variant={dense ? 'small' : 'bodyMedium'}
        weight={selected ? 700 : 600}
        color={selected ? 'white' : 'ink'}
        align="center"
      >
        {selected && !block ? `✓ ${label}` : label}
      </Text>
    </Tap>
  );
}

export interface ChoiceOption<T extends string> {
  value: T;
  label: string;
}

interface ChipGroupProps<T extends string> {
  options: ChoiceOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  multiple?: boolean;
  dense?: boolean;
  /** `grid` = equal columns, 50px tall (Yes / No / Not sure). */
  layout?: 'wrap' | 'grid';
  columns?: number;
  /** A value that clears every other choice when picked (e.g. "None of these"). */
  exclusiveValue?: T;
  /** Shows "+ Other"; typed values become selected chips. */
  other?: { values: string[]; onChange: (values: string[]) => void };
}

/** Single- or multi-select set of choice chips, with optional "+ Other". */
export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  multiple,
  dense,
  layout = 'wrap',
  columns = 3,
  exclusiveValue,
  other,
}: ChipGroupProps<T>) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const toggle = (v: T) => {
    if (!multiple) return onChange([v]);
    if (v === exclusiveValue) return onChange(value.includes(v) ? [] : [v]);
    const rest = value.filter((x) => x !== exclusiveValue);
    onChange(rest.includes(v) ? rest.filter((x) => x !== v) : [...rest, v]);
  };

  const commitOther = () => {
    const text = draft.trim();
    if (text && other && !other.values.includes(text)) other.onChange([...other.values, text]);
    setDraft('');
    setAdding(false);
  };

  if (layout === 'grid') {
    return (
      <View style={styles.grid}>
        {options.map((o) => (
          <View key={o.value} style={{ width: `${100 / columns}%`, padding: 4 }}>
            <ChoiceChip label={o.label} block selected={value.includes(o.value)} onPress={() => toggle(o.value)} />
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {options.map((o) => (
        <ChoiceChip key={o.value} label={o.label} dense={dense} selected={value.includes(o.value)} onPress={() => toggle(o.value)} />
      ))}
      {other?.values.map((v) => (
        <ChoiceChip key={`other-${v}`} label={v} dense={dense} selected onPress={() => other.onChange(other.values.filter((x) => x !== v))} />
      ))}
      {other &&
        (adding ? (
          <TextInput
            autoFocus
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={commitOther}
            onBlur={commitOther}
            placeholder="Type and press done"
            placeholderTextColor={colors.subtle}
            returnKeyType="done"
            style={[styles.otherInput, dense ? styles.dense : styles.normal]}
          />
        ) : (
          <Tap onPress={() => setAdding(true)} accessibilityLabel="Add other" style={[styles.chip, styles.other, dense ? styles.dense : styles.normal]}>
            <Text variant={dense ? 'small' : 'bodyMedium'} weight={700} color="primary">
              + Other
            </Text>
          </Tap>
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -4 },
  chip: { borderRadius: 999, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  normal: { paddingVertical: 10, paddingHorizontal: 16 },
  dense: { paddingVertical: 6, paddingHorizontal: 12 },
  block: { height: 50, paddingVertical: 0 },
  unselected: { backgroundColor: colors.surface, borderColor: colors.line },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  other: { borderStyle: 'dashed', borderColor: colors.primaryDashed, backgroundColor: 'transparent' },
  otherInput: {
    minWidth: 150,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    fontFamily: fonts.body600,
    fontSize: 15,
    color: colors.ink,
  },
});
