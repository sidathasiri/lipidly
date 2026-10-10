import { router, useLocalSearchParams } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';
import { useState } from 'react';
import { fmtTime } from '@/lib/format';
import { MAX_OWN_HABITS, medicineConflict, ownHabitsOf, questionFor, removeOwnHabit, saveOwnHabit } from '@/state/actions/ownHabits';
import { useUserData } from '@/state/hooks';
import { Button, Callout, colors, DateField, Screen, ScreenState, Text, TextField, TopBar } from '@/ui';

/**
 * Add or edit a habit the user picks (spec screen 38, F4.15–F4.17). Own habits show in the
 * check-in and summaries but never change the plan. `id` = "new" to add one.
 */
export default function OwnHabitScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const data = useUserData();
  const own = ownHabitsOf(data);
  const existing = own.find((h) => h.id === id);
  const isNew = id === 'new';

  const [title, setTitle] = useState(existing?.title ?? '');
  const [question, setQuestion] = useState(existing?.question ?? '');
  // The question follows the title until the user edits it themselves.
  const [questionEdited, setQuestionEdited] = useState(!!existing);
  const [reminder, setReminder] = useState(existing?.reminderTime);

  if (!isNew && !existing) {
    return (
      <Screen>
        <TopBar left="close" />
        <ScreenState kind="error" title="Habit not found" message="It may have been removed." />
      </Screen>
    );
  }
  if (isNew && own.length >= MAX_OWN_HABITS) {
    return (
      <Screen>
        <TopBar left="close" />
        <ScreenState
          kind="empty"
          title={`You have ${MAX_OWN_HABITS} own habits`}
          message="That's the most we track, so your check-in stays under a minute. Remove one to add another."
          actionLabel="Back to your plan"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const finalQuestion = (questionEdited ? question : questionFor(title)).trim();
  const conflict = medicineConflict(`${title} ${finalQuestion}`, data.medicines);
  const canSave = title.trim().length > 1 && finalQuestion.length > 3 && !conflict;

  const save = () => {
    saveOwnHabit({ id: existing?.id, title: title.trim(), question: finalQuestion, reminderTime: reminder });
    router.back();
  };

  const remove = () =>
    Alert.alert('Remove this habit?', 'It will leave your daily check-in. Past answers stay in your history.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          removeOwnHabit(existing!.id);
          router.back();
        },
      },
    ]);

  return (
    <Screen
      keyboard
      gap={14}
      footer={
        <>
          <Button label={isNew ? 'Add habit' : 'Save'} onPress={save} disabled={!canSave} />
          {!isNew && <Button label="Remove this habit" variant="ghost" onPress={remove} />}
        </>
      }
    >
      <TopBar left="close" />
      <View style={{ gap: 4 }}>
        <Text variant="h1" accessibilityRole="header">
          {isNew ? 'Add your own habit' : 'Edit your habit'}
        </Text>
        <Text variant="body" color="muted">
          Something you want to keep up alongside your plan.
        </Text>
      </View>

      <TextField
        label="Habit"
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Drink 8 glasses of water"
        maxLength={60}
        autoFocus={isNew}
        autoCapitalize="sentences"
        returnKeyType="next"
      />
      <TextField
        label="Check-in question"
        value={finalQuestion}
        onChangeText={(q) => {
          setQuestionEdited(true);
          setQuestion(q);
        }}
        placeholder="Did you … today?"
        maxLength={90}
        hint="We'll ask this each evening, with a yes or no answer."
      />
      {conflict && <Callout tone="soft">{conflict}</Callout>}

      <View style={styles.reminder}>
        <Text variant="bodyMedium" style={{ flex: 1 }}>
          Reminder
        </Text>
        <DateField compact mode="time" label="Reminder time" value={reminder} display={reminder ? fmtTime(reminder) : 'Off'} placeholder="Set a time" onChange={setReminder} />
        {reminder && <Button label="Off" variant="link" size="xs" onPress={() => setReminder(undefined)} />}
      </View>

      <Callout tone="lilac" title="How own habits work">
        <Text variant="body" color="onLilac">
          They show in your daily check-in and weekly summary with a "Your own" label. They don't change your plan or your retest, and you can have up to {MAX_OWN_HABITS}.
        </Text>
      </Callout>
    </Screen>
  );
}

const styles = StyleSheet.create({
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: 999, paddingVertical: 10, paddingLeft: 18, paddingRight: 10 },
});
