import { addDays } from '@lipidly/rules';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { fmtDate, fmtTime } from '@/lib/format';
import { addAppointment } from '@/state/actions/tracking';
import { today } from '@/state/ids';
import { Button, DateField, Screen, Text, TextField, TopBar } from '@/ui';

export default function NewAppointmentScreen() {
  const [date, setDate] = useState(addDays(today(), 7));
  const [time, setTime] = useState('10:00');
  const [doctor, setDoctor] = useState('');
  const [note, setNote] = useState('');

  const save = () => {
    addAppointment({ dateTime: `${date}T${time}`, doctor: doctor.trim(), note: note.trim() || undefined });
    router.back();
  };

  return (
    <Screen topBar={<TopBar left="close" />} keyboard gap={14} footer={<Button label="Save appointment" onPress={save} disabled={!doctor.trim()} />}>
      <Text variant="h1" accessibilityRole="header">
        Add an appointment
      </Text>
      <TextField label="Doctor" value={doctor} onChangeText={setDoctor} placeholder="e.g. Dr. S. Fernando" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1.3 }}>
          <DateField label="Date" mode="date" value={date} display={fmtDate(date)} minimumDate={today()} onChange={setDate} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="Time" mode="time" value={time} display={fmtTime(time)} onChange={setTime} />
        </View>
      </View>
      <TextField label="Place or note (optional)" value={note} onChangeText={setNote} placeholder="e.g. Nawaloka OPD" />
      <Text variant="small" weight={400} color="muted">
        We'll remind you the day before and two hours before.
      </Text>
    </Screen>
  );
}
