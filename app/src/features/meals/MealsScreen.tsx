import { latestMealPlan, MEAL_SLOTS, mealGuidanceFor, SLOT_LABELS } from '@lipidly/domain';
import { router } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { fmtWeekdayDate } from '@/lib/format';
import { startNewWeek, useMealJob } from '@/state/actions/meals';
import { useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import { isSyncedSession } from '@/state/store';
import { Button, Callout, Card, ChoiceChip, ListGroup, ListRow, ProgressBar, Screen, ScreenState, Text, TopBar } from '@/ui';
import { SLOT_ICONS } from './mealVisual';

/** "Sat 10" from "Saturday 10 October"-style dates, for the day chips. */
const dayChip = (date: string) => fmtWeekdayDate(date).split(' ').slice(0, 2).join(' ').replace(/^(\w{3})\w*/, '$1');

/** A week of AI-written meal ideas for the user's plan, one day at a time (F13). */
export default function MealsScreen() {
  const data = useUserData();
  const guidance = mealGuidanceFor(data);
  const plan = latestMealPlan(data);
  const job = useMealJob();
  const t = today();
  const [picked, setPicked] = useState<string>();
  const day = plan?.days.find((d) => d.date === picked) ?? plan?.days.find((d) => d.date === t) ?? plan?.days[0];
  const stale = !!plan && !plan.days.some((d) => d.date >= t);

  const newWeek = () =>
    Alert.alert('Make a new week?', 'This replaces your current meal ideas and shopping list.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'New week', onPress: startNewWeek },
    ]);

  const header = (
    <>
      <TopBar />
      <View style={{ gap: 4 }}>
        <Text variant="h1" accessibilityRole="header">
          Meal ideas
        </Text>
        <Text variant="body" color="muted">
          Heart-healthy meals for your plan and the food you like.
        </Text>
      </View>
    </>
  );

  if (!guidance?.eligible) {
    return (
      <Screen gap={12}>
        {header}
        <Callout tone="soft" title="Ask your doctor about meals">
          {guidance?.reason ?? 'Finish your profile to get meal ideas.'}
        </Callout>
      </Screen>
    );
  }

  if (job.running) {
    return (
      <Screen gap={12}>
        {header}
        <Card style={{ gap: 12 }}>
          <Text variant="title" accessibilityLiveRegion="polite">
            Writing your week of meals…
          </Text>
          <ProgressBar value={job.progress} height={12} accessibilityLabel="Meal plan progress" />
          <Text variant="small" color="muted">
            Usually about half a minute. You can leave this screen; your meals will be here when they’re ready.
          </Text>
        </Card>
      </Screen>
    );
  }

  if (!plan) {
    return (
      <Screen gap={12}>
        {header}
        {job.error && <Callout tone="soft">{job.error}</Callout>}
        <ScreenState
          kind="empty"
          title="No meal plan yet"
          message={
            isSyncedSession()
              ? 'Get a week of breakfast, lunch, dinner and snacks, with recipes and a shopping list.'
              : 'Sign in to an account to create meal plans.'
          }
          actionLabel={isSyncedSession() ? 'Create my week' : undefined}
          onAction={isSyncedSession() ? startNewWeek : undefined}
        />
        <Button label="Change food preferences" variant="link" size="sm" onPress={() => router.push('/profile/food')} />
      </Screen>
    );
  }

  return (
    <Screen
      gap={12}
      footer={<Button label="Shopping list" icon={ShoppingCart} variant="secondary" onPress={() => router.push('/plan/meals/shopping')} />}
    >
      {header}
      {job.error && <Callout tone="soft">{job.error}</Callout>}
      {stale && (
        <Callout tone="tint" title="This week has ended" action={<Button label="New week" size="xs" onPress={startNewWeek} />}>
          Make a fresh week of meal ideas.
        </Callout>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>
        {plan.days.map((d) => (
          <ChoiceChip key={d.date} dense label={d.date === t ? 'Today' : dayChip(d.date)} selected={d.date === day?.date} onPress={() => setPicked(d.date)} />
        ))}
      </ScrollView>
      {day && (
        <ListGroup>
          {MEAL_SLOTS.map((slot) => {
            const meal = day.meals.find((m) => m.slot === slot);
            if (!meal) return null;
            return (
              <ListRow
                key={slot}
                overline={SLOT_LABELS[slot]}
                title={meal.title}
                subtitle={`${meal.minutes} min`}
                icon={SLOT_ICONS[slot].icon}
                iconTone={SLOT_ICONS[slot].tone}
                onPress={() => router.push({ pathname: '/plan/meals/[date]', params: { date: day.date, slot } })}
              />
            );
          })}
        </ListGroup>
      )}
      <Text variant="caption" color="muted">
        Meal ideas written by AI within Lipidly’s heart-healthy rules. They’re not medical advice; follow your doctor if they’ve given you a diet.
      </Text>
      <View style={styles.links}>
        <Button label="New week" variant="link" size="sm" onPress={newWeek} />
        <Button label="Food preferences" variant="link" size="sm" onPress={() => router.push('/profile/food')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  days: { gap: 8, paddingVertical: 2 },
  links: { flexDirection: 'row', justifyContent: 'space-between' },
});
