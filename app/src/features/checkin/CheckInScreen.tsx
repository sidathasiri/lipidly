import { addDays, type IsoDate } from '@lipidly/rules';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { fmtWeekdayDate } from '@/lib/format';
import { saveCheckIn } from '@/state/actions/tracking';
import { useOverview } from '@/state/hooks';
import { today } from '@/state/ids';
import { AnswerPair, Button, Card, ChipGroup, IconTile, ProgressBar, Screen, ScreenState, Text, TopBar } from '@/ui';
import { habitVisual } from '../plan/habitVisual';

/** One yes/no card per habit; Done unlocks when every habit is answered (08). */
export default function CheckInScreen() {
  const { data, plan } = useOverview();
  const t = today();
  const [date, setDate] = useState<IsoDate>(t);
  const habits = plan?.habits.filter((h) => h.committed) ?? [];
  const [answers, setAnswers] = useState<Record<string, boolean>>(data.checkIns[t]?.answers ?? {});

  if (!plan || habits.length === 0) {
    return (
      <Screen>
        <TopBar left="close" />
        <ScreenState kind="empty" title="No habits to check in yet" message="Once you start a plan, your daily questions appear here." actionLabel="Go to Plan" onAction={() => router.replace('/plan')} />
      </Screen>
    );
  }

  const answered = habits.filter((h) => answers[h.id] !== undefined).length;
  const days = [t, addDays(t, -1), addDays(t, -2)];
  const labelFor = (d: IsoDate) => (d === t ? 'Today' : d === addDays(t, -1) ? 'Yesterday' : fmtWeekdayDate(d));

  const pickDate = (d: IsoDate) => {
    setDate(d);
    setAnswers(data.checkIns[d]?.answers ?? {});
  };

  const done = () => {
    saveCheckIn(date, answers);
    router.replace({ pathname: '/check-in-done', params: { date } });
  };

  return (
    <Screen gap={10} footer={<Button label="Done" onPress={done} disabled={answered < habits.length} />}>
      <TopBar left="close" center={<ProgressBar segments={habits.length} filled={answered} accessibilityLabel={`${answered} of ${habits.length} answered`} />} right={<Text variant="smallStrong" color="muted">{answered}/{habits.length}</Text>} />
      <Text variant="h1" style={{ fontSize: 28, marginVertical: 2 }} accessibilityRole="header">
        {date === t ? 'How did today go?' : `How did ${labelFor(date).toLowerCase() === 'yesterday' ? 'yesterday' : labelFor(date)} go?`}
      </Text>
      <ChipGroup dense options={days.map((d) => ({ value: d, label: labelFor(d) }))} value={[date]} onChange={([d]) => pickDate(d!)} />
      {habits.map((h) => {
        const v = habitVisual(h);
        const value = answers[h.id];
        return (
          <Card key={h.id} padding={14} selected={value === undefined && answered === habits.findIndex((x) => x.id === h.id)} style={{ gap: 10 }}>
            <View style={styles.q}>
              <IconTile icon={v.icon} tone={v.tone} size={38} />
              <View style={{ flex: 1 }}>
                {h.source === 'doctor' && (
                  <Text variant="overline" color="primary">
                    From your doctor
                  </Text>
                )}
                <Text variant="label">{h.question}</Text>
              </View>
            </View>
            <AnswerPair value={value} onChange={(yes) => setAnswers((a) => ({ ...a, [h.id]: yes }))} noLabel={value === false ? 'Not today' : 'No'} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  q: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
