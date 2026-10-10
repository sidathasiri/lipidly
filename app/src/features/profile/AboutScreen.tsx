import { HABIT_LIBRARY_VERSION, RULESET } from '@lipidly/rules';
import Constants from 'expo-constants';
import { Phone } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { Button, Card, DetailList, ListGroup, ListRow, Logo, Screen, Text, TopBar } from '@/ui';
import { EMERGENCY, WARNING_SIGNS } from './UrgentCareScreen';

/** Disclaimer, urgent warning signs, contact and version (35). */
export default function AboutScreen() {
  return (
    <Screen gap={12}>
      <TopBar />
      <View style={{ alignItems: 'flex-start', paddingVertical: 8 }}>
        <Logo variant="lockup" height={40} />
      </View>
      <Text variant="h1" accessibilityRole="header">
        About Lipidly
      </Text>
      <Text variant="body" color="muted">
        Lipidly supports healthy habits for cholesterol and triglycerides. It does not diagnose, prescribe or replace your doctor. Your doctor's instructions always come first.
      </Text>
      <Card style={{ gap: 8 }}>
        <Text variant="bodyStrong">Get urgent care now if you have</Text>
        {WARNING_SIGNS.map((s) => (
          <Text key={s} variant="bodyMedium" weight={500}>
            {'·'} {s}
          </Text>
        ))}
        <View style={{ marginTop: 6 }}>
          <Button label={EMERGENCY.label} icon={Phone} variant="dark" onPress={() => Linking.openURL(EMERGENCY.tel)} />
        </View>
      </Card>
      <ListGroup>
        <ListRow title="Contact us" onPress={() => Linking.openURL('mailto:hello@lipidly.app').catch(() => {})} />
      </ListGroup>
      <DetailList
        rows={[
          ['Content reviewed by', 'Clinical reviewer (to be named)'],
          ['Version', `${Constants.expoConfig?.version ?? '0.1.0'} · ${RULESET.version} · ${HABIT_LIBRARY_VERSION}`],
        ]}
      />
    </Screen>
  );
}
