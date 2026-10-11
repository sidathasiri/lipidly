import { formatAmount, latestMealPlan, SLOT_LABELS, type MealSlot } from '@lipidly/domain';
import { useLocalSearchParams } from 'expo-router';
import { Clock, RefreshCw, Users } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { fmtWeekdayDate } from '@/lib/format';
import { swapMeal } from '@/state/actions/meals';
import { useUserData } from '@/state/hooks';
import { Button, Card, Chip, colors, Divider, IconTile, Screen, ScreenState, Section, Text, TopBar } from '@/ui';
import { SLOT_ICONS } from './mealVisual';

/** One meal: why it fits, ingredients, steps, and a swap for something else (F13). */
export default function MealDetailScreen() {
  const { date, slot } = useLocalSearchParams<{ date: string; slot: MealSlot }>();
  const plan = latestMealPlan(useUserData());
  const meal = plan?.days.find((d) => d.date === date)?.meals.find((m) => m.slot === slot);
  const [swapping, setSwapping] = useState(false);

  if (!plan || !meal) {
    return (
      <Screen>
        <TopBar />
        <ScreenState kind="error" title="Meal not found" message="Your meal plan may have changed." />
      </Screen>
    );
  }

  const swap = async () => {
    setSwapping(true);
    try {
      await swapMeal(plan.id, date, meal.slot);
    } catch (e) {
      Alert.alert('Couldn’t swap this meal', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setSwapping(false);
    }
  };

  return (
    <Screen gap={14} footer={<Button label={swapping ? 'Finding another meal…' : 'Swap this meal'} icon={RefreshCw} variant="secondary" onPress={swap} loading={swapping} />}>
      <TopBar title={`${SLOT_LABELS[meal.slot]} · ${fmtWeekdayDate(date)}`} />
      <View style={styles.head}>
        <IconTile icon={SLOT_ICONS[meal.slot].icon} tone={SLOT_ICONS[meal.slot].tone} size={48} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="h2" accessibilityRole="header">
            {meal.title}
          </Text>
          <View style={styles.chips}>
            <Chip label={`${meal.minutes} min`} icon={Clock} />
            <Chip label={meal.servings === 1 ? '1 serving' : `${meal.servings} servings`} icon={Users} />
          </View>
        </View>
      </View>
      <Text variant="body" color="muted">
        {meal.summary}
      </Text>
      <Section title="Ingredients">
        <Card padding={16} style={{ gap: 8 }}>
          {meal.ingredients.map((ing, i) => (
            <View key={`${ing.name}-${i}`}>
              {i > 0 && <Divider />}
              <View style={styles.ingredient}>
                <Text variant="bodyMedium" style={{ flex: 1 }}>
                  {ing.name.charAt(0).toUpperCase() + ing.name.slice(1)}
                </Text>
                <Text variant="small" color="muted">
                  {formatAmount(ing.quantity, ing.unit)}
                </Text>
              </View>
            </View>
          ))}
        </Card>
      </Section>
      <Section title="Steps">
        <View style={{ gap: 10 }}>
          {meal.steps.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={styles.stepNumber}>
                <Text variant="smallStrong" color="white">
                  {i + 1}
                </Text>
              </View>
              <Text variant="body" style={{ flex: 1 }}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  ingredient: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNumber: { width: 26, height: 26, borderRadius: 13, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
});
