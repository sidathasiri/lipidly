import { MARKER_LABELS, type MarkerId, type Unit } from '@lipidly/rules';
import { router } from 'expo-router';
import { Fragment, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDate } from '@/lib/format';
import { reportProblem } from '@/services/support';
import { confirmDraft, draftFlags, setDraft } from '@/state/actions/reports';
import { useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import type { StoredMarker } from '@/state/types';
import {
  Button,
  colors,
  DateField,
  Divider,
  DocumentPreview,
  ScreenState,
  SegmentedControl,
  StepPill,
  Tap,
  Text,
  TextField,
  TopBar,
  ValueField,
} from '@/ui';
import { MARKER_ORDER } from './reportUtils';

const toText = (v: number) => (Number.isFinite(v) ? String(v) : '');

/**
 * Check extracted values against the original, which stays visible while editing (19).
 * Flags highlight but never block. Also used for "Enter values by hand" (F2.7).
 */
export default function ConfirmValuesScreen() {
  const insets = useSafeAreaInsets();
  const draft = useUserData().draft;
  const manual = draft?.source === 'manual';
  const [labName, setLabName] = useState(draft?.labName ?? '');
  const [date, setDate] = useState(draft?.collectionDate ?? today());
  const [editMeta, setEditMeta] = useState(manual);
  const [saving, setSaving] = useState(false);
  const [unit, setUnit] = useState<Unit>(draft?.markers[0]?.unit ?? 'mg/dL');
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((draft?.markers ?? []).map((m) => [m.marker, toText(m.value)])),
  );

  const markers: StoredMarker[] = useMemo(
    () =>
      [...(draft?.markers ?? [])]
        .sort((a, b) => MARKER_ORDER.indexOf(a.marker) - MARKER_ORDER.indexOf(b.marker))
        .map((m) => {
          const v = values[m.marker] ?? '';
          const n = v === '' ? NaN : Number(v);
          return { ...m, value: n, unit: manual ? unit : m.unit, edited: manual || n !== m.extractedValue };
        }),
    [draft, values, manual, unit],
  );

  const flags = useMemo(() => (draft ? draftFlags({ ...draft, collectionDate: date, markers }) : []), [draft, date, markers]);
  const flagFor = (m: MarkerId) => flags.find((f) => f.field === m);
  const dateFlag = flags.find((f) => f.field === 'collectionDate');
  const filled = markers.filter((m) => Number.isFinite(m.value)).length;

  if (!draft) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10 }]}>
        <View style={{ paddingHorizontal: 20 }}>
          <TopBar left="close" />
        </View>
        <ScreenState kind="empty" title="Nothing to check" message="Add a report to see its values here." actionLabel="Add a report" onAction={() => router.replace('/reports/add')} />
      </View>
    );
  }

  const close = () =>
    Alert.alert('Discard this report?', 'Nothing has been saved yet.', [
      { text: 'Keep checking', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setDraft(undefined);
          router.back();
        },
      },
    ]);

  const confirm = async () => {
    setSaving(true);
    try {
      const { reportId, escalated } = await confirmDraft({ labName, collectionDate: date, markers });
      if (escalated) router.replace('/reports/doctor');
      else router.replace({ pathname: '/reports/[id]', params: { id: reportId, fresh: '1' } });
    } catch (e) {
      Alert.alert('Couldn\u2019t save the report', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const firstFlagIndex = markers.findIndex((m) => flagFor(m.marker));

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.fixed, { paddingTop: insets.top + 10 }]}>
        <TopBar left="close" onLeft={close} title={manual ? 'Enter your values' : 'Check your values'} right={!manual && draft.pageCount > 1 ? <StepPill label={`1 of ${draft.pageCount}`} /> : undefined} />
        {!manual && (
          <DocumentPreview
            label="original report · page 1"
            highlight={firstFlagIndex >= 0 ? { x: 0.13, y: 0.25 + firstFlagIndex * 0.1, w: 0.62, h: 0.1 } : undefined}
            onPress={() => router.push('/reports/viewer')}
          />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {editMeta ? (
          <View style={{ gap: 10 }}>
            <TextField label="Lab name" value={labName} onChangeText={setLabName} placeholder="e.g. Lanka Diagnostics" />
            <DateField label="Collection date" mode="date" value={date} display={fmtDate(date)} maximumDate={today()} onChange={setDate} />
            {manual && (
              <View style={styles.unitRow}>
                <Text variant="label">Units on your report</Text>
                <SegmentedControl
                  options={[
                    { value: 'mg/dL', label: 'mg/dL' },
                    { value: 'mmol/L', label: 'mmol/L' },
                  ]}
                  value={unit}
                  onChange={setUnit}
                />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.meta}>
            <Text variant="small" color="muted">
              {draft.labName || 'Lab report'} {'·'} {fmtDate(date)}
            </Text>
            <Tap onPress={() => setEditMeta(true)} accessibilityLabel="Edit lab name and date">
              <Text variant="smallStrong" weight={800} color="primary">
                Edit
              </Text>
            </Tap>
          </View>
        )}
        {dateFlag && <FlagNote message={dateFlag.message} />}

        <View style={styles.card}>
          {markers.map((m, i) => {
            const flag = flagFor(m.marker);
            return (
              <Fragment key={m.marker}>
                {i > 0 && <Divider />}
                <View style={styles.valueRow}>
                  <View style={styles.valueLine}>
                    <Text variant="bodyMedium" weight={flag ? 800 : 600} style={{ flex: 1 }}>
                      {MARKER_LABELS[m.marker]}
                    </Text>
                    <ValueField
                      value={values[m.marker] ?? ''}
                      onChange={(v) => setValues((x) => ({ ...x, [m.marker]: v }))}
                      unit={m.marker === 'tcHdlRatio' ? '' : (m.unit ?? unit)}
                      flagged={!!flag}
                      accessibilityLabel={`${MARKER_LABELS[m.marker]} value`}
                    />
                  </View>
                  {flag && <FlagNote message={flag.message} />}
                </View>
              </Fragment>
            );
          })}
        </View>
        {manual && (
          <Text variant="small" weight={400} color="muted">
            Leave a value blank if your report doesn't show it.
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label="Confirm values" onPress={confirm} disabled={filled < 2 || saving} loading={saving} />
        <View style={styles.footNotes}>
          <Text variant="caption" weight={600} color="muted">
            Nothing is saved until you confirm
          </Text>
          {!manual && (
            <Tap onPress={() => reportProblem('extraction')} accessibilityLabel="Report a problem">
              <Text variant="caption" weight={600} color="muted">
                Report a problem
              </Text>
            </Tap>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function FlagNote({ message }: { message: string }) {
  return (
    <View style={styles.flag} accessibilityRole="alert">
      <Text variant="small" weight={500} color="onPrimaryTint" style={{ lineHeight: 18 }}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fixed: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16, gap: 8 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  unitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { backgroundColor: colors.surface, borderRadius: 24, paddingHorizontal: 14, paddingVertical: 2 },
  valueRow: { paddingVertical: 9, gap: 8 },
  valueLine: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  flag: { backgroundColor: colors.primaryTint, borderRadius: 14, paddingVertical: 8, paddingHorizontal: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  footNotes: { flexDirection: 'row', justifyContent: 'space-between' },
});
