import { router } from 'expo-router';
import { Eye, FileText, Lock, SlidersHorizontal, type LucideIcon } from 'lucide-react-native';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import { giveConsent } from '@/state/actions/onboarding';
import { signOut } from '@/state/actions/auth';
import { Button, Card, IconTile, Screen, Text } from '@/ui';

const ITEMS: { icon: LucideIcon; tone: 'tint' | 'sky' | 'lilac'; title: string; body: string }[] = [
  { icon: FileText, tone: 'tint', title: 'What we collect', body: 'Your lab reports, prescriptions, profile and daily check-ins.' },
  { icon: Eye, tone: 'sky', title: 'Why', body: 'Only to build your plan and send your reminders.' },
  { icon: Lock, tone: 'lilac', title: 'Who sees it', body: 'Only you. Files are stored privately and never shared or sold.' },
  { icon: SlidersHorizontal, tone: 'tint', title: 'Your control', body: 'Download, delete or withdraw consent any time in Profile.' },
];

/** Explicit health-data consent before any upload (F1.3). */
export default function ConsentScreen() {
  return (
    <Screen
      padding="onboarding"
      gap={18}
      contentStyle={{ paddingTop: 72 }}
      footer={
        <>
          <Button
            label="I agree"
            onPress={() => {
              giveConsent();
              router.replace('/onboarding/profile');
            }}
          />
          <Button
            label="Not now"
            variant="ghost"
            onPress={() =>
              Alert.alert('Consent is needed', 'Lipidly can’t store your reports or build a plan without your consent. You can sign out and come back any time.', [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Sign out',
                  onPress: () => {
                    signOut();
                    router.replace('/');
                  },
                },
              ])
            }
          />
        </>
      }
    >
      <Text variant="displayL" style={{ fontSize: 32, lineHeight: 34 }} accessibilityRole="header">
        Your health data, in plain terms
      </Text>
      <View style={{ gap: 10 }}>
        {ITEMS.map((it) => (
          <Card key={it.title}>
            <View style={styles.row}>
              <IconTile icon={it.icon} tone={it.tone} size={44} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text variant="bodyStrong">{it.title}</Text>
                <Text variant="small" weight={400} color="muted" style={{ fontSize: 14, lineHeight: 20 }}>
                  {it.body}
                </Text>
              </View>
            </View>
          </Card>
        ))}
      </View>
      <Button label="Read the full privacy policy" variant="link" size="sm" style={{ alignSelf: 'flex-start' }} onPress={() => Linking.openURL('https://lipidly.app/privacy').catch(() => {})} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 14 },
});
