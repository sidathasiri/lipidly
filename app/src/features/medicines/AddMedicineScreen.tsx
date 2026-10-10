import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { fmtTime } from '@/lib/format';
import { addMedicine } from '@/state/actions/tracking';
import { Button, Callout, ChipGroup, DateField, Screen, Section, Text, TextField, TopBar } from '@/ui';
import { FREQUENCY_TIMES } from './medicineUtils';

const FREQUENCIES = Object.keys(FREQUENCY_TIMES);

/** Add a medicine by hand (F7.5). Fields as the user reads them from the label. */
export default function AddMedicineScreen() {
  const [name, setName] = useState('');
  const [strength, setStrength] = useState('');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [timing, setTiming] = useState('');
  const [duration, setDuration] = useState('');
  const [times, setTimes] = useState(FREQUENCY_TIMES['Once daily']!);

  const save = () => {
    addMedicine({ name: name.trim(), strength: strength.trim(), dose: dose.trim(), frequency, timing: timing.trim(), duration: duration.trim(), times });
    router.dismissTo('/medicines');
  };

  return (
    <Screen keyboard gap={14} footer={<Button label="Save medicine" onPress={save} disabled={!name.trim() || !dose.trim()} />}>
      <TopBar left="close" />
      <Text variant="h1" accessibilityRole="header">
        Add a medicine
      </Text>
      <TextField label="Name" value={name} onChangeText={setName} placeholder="As written on the label" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Strength" value={strength} onChangeText={setStrength} placeholder="e.g. 10 mg" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="Dose" value={dose} onChangeText={setDose} placeholder="e.g. 1 tablet" />
        </View>
      </View>
      <Section title="How often">
        <ChipGroup
          dense
          options={FREQUENCIES.map((f) => ({ value: f, label: f }))}
          value={[frequency]}
          onChange={([f]) => {
            setFrequency(f!);
            setTimes(FREQUENCY_TIMES[f!]!);
          }}
        />
      </Section>
      <TextField label="When" value={timing} onChangeText={setTiming} placeholder="e.g. after breakfast, at night" />
      <TextField label="How long" value={duration} onChangeText={setDuration} placeholder="e.g. 30 days" />
      <Section title="Reminder times">
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {times.map((t, i) => (
            <DateField key={i} compact mode="time" label={`Dose ${i + 1} time`} value={t} display={fmtTime(t)} onChange={(v) => setTimes((ts) => ts.map((x, j) => (j === i ? v : x)))} />
          ))}
        </View>
      </Section>
      <Callout tone="soft">Lipidly only reminds you; it never suggests or changes a medicine or dose.</Callout>
    </Screen>
  );
}
