import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Icon } from '../primitives/Icon';
import { Tap } from '../primitives/Pressables';
import { Text } from '../primitives/Text';
import { colors, radius } from '../theme';

const pad = (n: number) => String(n).padStart(2, '0');
const toIsoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fromIsoDate = (s: string) => {
  const [y, m, d] = s.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
};
const fromTime = (s: string) => {
  const [h, m] = s.split(':').map(Number) as [number, number];
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
};

interface DateFieldProps {
  label?: string;
  mode: 'date' | 'time';
  /** `YYYY-MM-DD` for dates, `HH:mm` for times. */
  value?: string;
  onChange: (value: string) => void;
  /** Shown in the field, e.g. "22 Sep 2026" or "9:00 pm". */
  display: string;
  placeholder?: string;
  minimumDate?: string;
  maximumDate?: string;
  /** Where the picker opens when there is no value yet. */
  initial?: string;
  /** Compact pill for list rows and reminder chips. */
  compact?: boolean;
}

/** Field-styled button that opens the native date or time picker. */
export function DateField({ label, mode, value, onChange, display, placeholder = 'Choose', minimumDate, maximumDate, initial, compact }: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const seed = value ?? initial;
  const current = seed ? (mode === 'date' ? fromIsoDate(seed) : fromTime(seed)) : new Date();
  const min = minimumDate ? fromIsoDate(minimumDate) : undefined;
  const max = maximumDate ? fromIsoDate(maximumDate) : undefined;

  const handle = (_e: DateTimePickerEvent, d?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (d) onChange(mode === 'date' ? toIsoDate(d) : toTime(d));
  };

  const press = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: current, mode, onChange: handle, minimumDate: min, maximumDate: max });
    } else {
      setOpen((o) => !o);
    }
  };

  const button = compact ? (
    <Tap onPress={press} accessibilityLabel={`${label ?? mode}: ${value ? display : placeholder}`} style={styles.compact}>
      <Text variant="smallStrong" weight={800} color="primary">
        {value ? display : placeholder}
      </Text>
    </Tap>
  ) : (
    <Tap onPress={press} accessibilityLabel={`${label ?? mode}: ${value ? display : placeholder}`} style={[styles.field, open && styles.fieldOpen]}>
      <Text variant="bodyMedium" color={value ? 'ink' : 'subtle'} style={{ flex: 1 }}>
        {value ? display : placeholder}
      </Text>
      <Icon icon={mode === 'date' ? CalendarDays : Clock} size={20} color="muted" />
    </Tap>
  );

  return (
    <View style={{ gap: 8 }}>
      {label && <Text variant="label">{label}</Text>}
      {button}
      {open && Platform.OS === 'ios' && (
        <View style={styles.picker}>
          <DateTimePicker value={current} mode={mode} display={mode === 'date' ? 'inline' : 'spinner'} onChange={handle} minimumDate={min} maximumDate={max} accentColor={colors.primary} themeVariant="light" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 54,
    borderRadius: radius.field,
    borderWidth: 2,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldOpen: { borderColor: colors.primary },
  compact: { backgroundColor: colors.primaryTint, borderRadius: radius.pill, paddingVertical: 6, paddingHorizontal: 12 },
  picker: { backgroundColor: colors.surface, borderRadius: radius.card, padding: 8 },
});
