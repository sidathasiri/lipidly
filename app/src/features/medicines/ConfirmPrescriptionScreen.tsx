import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fmtDate, fmtTime } from '@/lib/format';
import type { ExtractedMedicine } from '@/services/extraction';
import { reportProblem } from '@/services/support';
import { confirmPrescription } from '@/state/actions/tracking';
import { Button, Card, colors, DateField, DocumentPreview, FieldBox, ScreenState, StepPill, Tap, Text, Toggle, TopBar } from '@/ui';
import { setPendingPrescription, usePendingPrescription } from './pendingPrescription';

const FIELDS: { key: keyof Omit<ExtractedMedicine, 'name' | 'times'>; label: string }[] = [
  { key: 'strength', label: 'Strength' },
  { key: 'dose', label: 'Dose' },
  { key: 'frequency', label: 'How often' },
  { key: 'timing', label: 'When' },
  { key: 'duration', label: 'How long' },
];

const blanks = (m: ExtractedMedicine) => [m.name, ...FIELDS.map((f) => m[f.key])].filter((v) => !v.trim()).length;

/**
 * Check each medicine line against the original (27). A field the app couldn't read is blank,
 * never guessed, and blocks confirmation until filled (F7.4).
 */
export default function ConfirmPrescriptionScreen() {
  const insets = useSafeAreaInsets();
  const rx = usePendingPrescription();
  const [meds, setMeds] = useState<ExtractedMedicine[]>(rx?.medicines ?? []);
  const [open, setOpen] = useState(0);
  const [addHabit, setAddHabit] = useState(true);
  const [addFollowUp, setAddFollowUp] = useState(true);

  if (!rx) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + 10, paddingHorizontal: 20 }]}>
        <TopBar left="close" />
        <ScreenState kind="empty" title="Nothing to check" message="Add a prescription to check it here." actionLabel="Add a prescription" onAction={() => router.replace('/medicines/add')} />
      </View>
    );
  }

  const totalBlanks = meds.reduce((n, m) => n + blanks(m), 0);
  const update = (i: number, patch: Partial<ExtractedMedicine>) => setMeds((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));

  const close = () =>
    Alert.alert('Discard this prescription?', 'Nothing has been saved yet.', [
      { text: 'Keep checking', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setPendingPrescription(undefined);
          router.back();
        },
      },
    ]);

  const confirm = () => {
    confirmPrescription({
      doctor: rx.doctor,
      date: rx.date,
      medicines: meds,
      doctorInstruction: addHabit ? rx.doctorInstruction : undefined,
      followUp: addFollowUp ? rx.followUp : undefined,
    });
    setPendingPrescription(undefined);
    router.dismissTo('/medicines');
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.fixed, { paddingTop: insets.top + 10 }]}>
        <TopBar left="close" onLeft={close} title="Check each medicine" right={<StepPill label={`${Math.min(open + 1, meds.length)} of ${meds.length}`} />} />
        <DocumentPreview label="original prescription" height={150} highlight={{ x: 0.1, y: 0.3 + open * 0.22, w: 0.7, h: 0.18 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {meds.map((m, i) =>
          i === open ? (
            <Card key={i} padding={16} selected style={{ gap: 10 }}>
              <View style={styles.head}>
                <Text variant="title">{m.name || 'Medicine'}</Text>
                <Text variant="caption" color="muted">
                  Line {i + 1}
                </Text>
              </View>
              {!m.name.trim() && <FieldBox label="Name" value={m.name} onChange={(name) => update(i, { name })} />}
              <View style={styles.grid}>
                {FIELDS.slice(0, 4).map((f) => (
                  <View key={f.key} style={styles.cell}>
                    <FieldBox label={f.label} value={m[f.key]} onChange={(v) => update(i, { [f.key]: v })} />
                  </View>
                ))}
              </View>
              <FieldBox label="How long" value={m.duration} onChange={(duration) => update(i, { duration })} />
              <View style={styles.reminder}>
                <Text variant="small" color="muted">
                  Reminder
                </Text>
                <DateField compact mode="time" label="Dose reminder" value={m.times[0]} display={m.times[0] ? fmtTime(m.times[0]) : 'Set'} onChange={(t) => update(i, { times: [t, ...m.times.slice(1)] })} />
              </View>
            </Card>
          ) : (
            <Tap key={i} onPress={() => setOpen(i)} style={styles.collapsed} accessibilityLabel={`Review ${m.name}`}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyStrong">{m.name}</Text>
                <Text variant="small" weight={400} color="muted">
                  Line {i + 1} {'·'} {m.strength} {'·'} {m.frequency.toLowerCase()}
                  {blanks(m) ? ' · needs a value' : ''}
                </Text>
              </View>
              <Text variant="smallStrong" weight={800} color="primary">
                Review
              </Text>
            </Tap>
          ),
        )}

        {rx.doctorInstruction && (
          <Card tone="lilac" padding={16} style={styles.inline}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="onLilac">
                Doctor's instruction found
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                "{rx.doctorInstruction.text}" {'→'} add as a habit
              </Text>
            </View>
            <Toggle value={addHabit} onChange={setAddHabit} accessibilityLabel="Add the doctor's instruction as a habit" />
          </Card>
        )}
        {rx.followUp && (
          <Card padding={16} style={styles.inline}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" color="muted">
                Follow-up visit
              </Text>
              <Text variant="bodyStrong" style={{ fontSize: 15 }}>
                {fmtDate(rx.followUp)} {'·'} {fmtTime(rx.followUp.slice(11, 16))}
              </Text>
            </View>
            <Toggle value={addFollowUp} onChange={setAddFollowUp} accessibilityLabel="Add the follow-up appointment" />
          </Card>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button label={`Confirm ${meds.length} ${meds.length === 1 ? 'medicine' : 'medicines'}`} onPress={confirm} disabled={totalBlanks > 0} />
        <View style={styles.notes}>
          <Text variant="caption" weight={600} color="muted">
            {totalBlanks > 0 ? 'Fill the blank to continue' : 'Nothing is saved until you confirm'}
          </Text>
          <Tap onPress={() => reportProblem('prescription')} accessibilityLabel="Report a problem">
            <Text variant="caption" weight={600} color="muted">
              Report a problem
            </Text>
          </Tap>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  fixed: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  scroll: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16, gap: 10 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', margin: -4 },
  cell: { width: '50%', padding: 4 },
  reminder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collapsed: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 24, padding: 16 },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { paddingHorizontal: 20, paddingTop: 10, gap: 8 },
  notes: { flexDirection: 'row', justifyContent: 'space-between' },
});
