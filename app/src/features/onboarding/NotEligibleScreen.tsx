import { ineligibleReason } from '@lipidly/rules';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import { Button, Card, colors, Mascot, radius, Screen, Text } from '@/ui';

const COPY = {
  pregnant: {
    body: 'You told us you’re pregnant. Cholesterol and diet needs change a lot during pregnancy, so habits should come from your doctor or midwife, not from an app.',
    suggest: 'Take your latest lab report to your next antenatal visit and ask what it means for you.',
  },
  under18: {
    body: 'Lipidly is made for adults aged 18 and over. Cholesterol in younger people needs a doctor’s care, not an app’s suggestions.',
    suggest: 'Show your lab report to your family doctor or paediatrician and ask what it means for you.',
  },
};

/** Under-18 or pregnant users see a kind explanation and cannot create a plan (F1.6). */
export default function NotEligibleScreen() {
  const insets = useSafeAreaInsets();
  const profile = useUserData().profile;
  const reason = (profile && ineligibleReason(profile, today())) || 'pregnant';
  const copy = COPY[reason];

  return (
    <Screen
      padding="onboarding"
      gap={16}
      header={
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={[styles.circle, { left: '27%', top: 90, width: 180, height: 180, backgroundColor: colors.skyStrong }]} />
          <View style={[styles.circle, { right: 50, top: 84, width: 30, height: 30, backgroundColor: colors.lilac }]} />
          <View style={styles.mascot}>
            <Mascot size={130} mood="calm" />
          </View>
        </View>
      }
      footer={<Button label="Edit my answers" variant="secondary" onPress={() => router.replace('/onboarding/profile')} />}
    >
      <Text variant="h1" accessibilityRole="header">
        Lipidly can't make a plan for you right now
      </Text>
      <Text variant="body" color="muted" style={{ fontSize: 16, lineHeight: 25 }}>
        {copy.body}
      </Text>
      <Card padding={18}>
        <Text variant="bodyStrong">What we suggest</Text>
        <Text variant="body" color="muted">
          {copy.suggest}
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { height: 300, backgroundColor: colors.sky, borderBottomLeftRadius: radius.headerBottom + 4, borderBottomRightRadius: radius.headerBottom + 4, overflow: 'hidden' },
  circle: { position: 'absolute', borderRadius: 999 },
  mascot: { position: 'absolute', alignSelf: 'center', top: 120 },
});
