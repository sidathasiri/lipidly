import { latestMealPlan, shoppingList } from '@lipidly/domain';
import { CircleCheck, Circle } from 'lucide-react-native';
import { useMemo } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { fmtDayMonth } from '@/lib/format';
import { toggleShopping } from '@/state/actions/meals';
import { useUserData } from '@/state/hooks';
import { Button, colors, Icon, ListGroup, Screen, ScreenState, Section, Tap, Text, TopBar } from '@/ui';

/** Everything the week's meals need, added up and grouped by shop section, ticked off while shopping (F13). */
export default function ShoppingListScreen() {
  const data = useUserData();
  const plan = latestMealPlan(data);
  const sections = useMemo(() => (plan ? shoppingList(plan) : []), [plan]);
  const checked = new Set((plan && data.shoppingChecked?.[plan.id]) ?? []);

  if (!plan) {
    return (
      <Screen>
        <TopBar />
        <ScreenState kind="empty" title="No shopping list yet" message="Create a week of meal ideas first." />
      </Screen>
    );
  }

  const total = sections.reduce((n, s) => n + s.items.length, 0);
  const done = sections.reduce((n, s) => n + s.items.filter((i) => checked.has(i.key)).length, 0);
  const share = () =>
    Share.share({
      message: sections
        .map((s) => `${s.label}\n${s.items.filter((i) => !checked.has(i.key)).map((i) => `• ${i.name} (${i.amount})`).join('\n')}`)
        .filter((block) => block.includes('•'))
        .join('\n\n'),
    });

  return (
    <Screen gap={14} footer={<Button label="Share list" variant="secondary" onPress={share} disabled={done === total} />}>
      <TopBar />
      <View style={{ gap: 4 }}>
        <Text variant="h1" accessibilityRole="header">
          Shopping list
        </Text>
        <Text variant="body" color="muted">
          For your meals from {fmtDayMonth(plan.weekStart)} · {done} of {total} ticked
        </Text>
      </View>
      {sections.map((s) => (
        <Section key={s.category} title={s.label}>
          <ListGroup>
            {s.items.map((item) => {
              const isChecked = checked.has(item.key);
              return (
                <Tap
                  key={item.key}
                  onPress={() => toggleShopping(plan.id, item.key)}
                  style={styles.row}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={`${item.name}, ${item.amount}`}
                >
                  <Icon icon={isChecked ? CircleCheck : Circle} size={24} color={isChecked ? 'primary' : 'subtle'} />
                  <Text variant="bodyMedium" color={isChecked ? 'subtle' : 'ink'} style={[{ flex: 1 }, isChecked && styles.struck]}>
                    {item.name}
                  </Text>
                  <Text variant="small" color="muted">
                    {item.amount}
                  </Text>
                </Tap>
              );
            })}
          </ListGroup>
        </Section>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 52, borderBottomWidth: 1, borderBottomColor: colors.surfaceSoft },
  struck: { textDecorationLine: 'line-through' },
});
