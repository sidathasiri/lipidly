import { Phone } from 'lucide-react-native';
import { Linking, View } from 'react-native';
import { Button, Card, Screen, Text, TopBar } from '@/ui';

export const WARNING_SIGNS = [
  'Chest pain, pressure or tightness',
  'Sudden shortness of breath',
  'Face drooping, arm weakness or slurred speech',
  'Sudden severe pain in the upper stomach',
];

export const EMERGENCY = { label: 'Call 1990 (Suwa Seriya)', tel: 'tel:1990' };

/** Static list of warning signs that need urgent care, with the local emergency number (F11.4). */
export default function UrgentCareScreen() {
  return (
    <Screen gap={14} footer={<Button label={EMERGENCY.label} icon={Phone} variant="dark" onPress={() => Linking.openURL(EMERGENCY.tel)} />}>
      <TopBar left="close" />
      <Text variant="h1" accessibilityRole="header">
        Get urgent care now if you have
      </Text>
      <Card style={{ gap: 10 }}>
        {WARNING_SIGNS.map((s) => (
          <View key={s} style={{ flexDirection: 'row', gap: 10 }}>
            <Text variant="bodyStrong">{'·'}</Text>
            <Text variant="bodyMedium" style={{ flex: 1 }}>
              {s}
            </Text>
          </View>
        ))}
      </Card>
      <Text variant="body" color="muted">
        Don't wait for an appointment or a reply in the app. Call an ambulance or go to the nearest emergency unit.
      </Text>
    </Screen>
  );
}
