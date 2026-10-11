import { router } from 'expo-router';
import { Download, Trash2 } from 'lucide-react-native';
import { Alert, Linking, Share, StyleSheet, View } from 'react-native';
import { fmtDate } from '@/lib/format';
import { deleteAccount } from '@/state/actions/auth';
import { withdrawConsent } from '@/state/actions/onboarding';
import { useUserData } from '@/state/hooks';
import { Button, Card, ListGroup, ListRow, Screen, Text, TopBar } from '@/ui';

/** Consent, download data, delete account (34, F12.2–F12.4). Delete is neutral, not red. */
export default function PrivacyScreen() {
  const data = useUserData();
  const consent = data.consent;

  const download = () => {
    const { draft: _draft, ...rest } = data;
    Share.share({ title: 'My Lipidly data', message: JSON.stringify(rest, null, 2) });
  };

  const confirmDelete = () =>
    Alert.alert('Delete your account?', 'This permanently removes your account, reports, prescriptions and all history. It can’t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAccount();
            router.replace('/');
          } catch (e) {
            Alert.alert('Couldn\u2019t delete your account', e instanceof Error ? e.message : 'Please try again.');
          }
        },
      },
    ]);

  const withdraw = () =>
    Alert.alert('Withdraw consent?', 'Lipidly will stop processing your health data. You’ll need to give consent again to keep using the app.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Withdraw',
        onPress: () => {
          withdrawConsent();
          router.replace('/');
        },
      },
    ]);

  return (
    <Screen topBar={<TopBar />} gap={12}>
      <Text variant="h1" accessibilityRole="header">
        Privacy and data
      </Text>
      <Card style={{ gap: 12 }}>
        <View>
          <Text variant="overline" color="muted">
            Health data consent
          </Text>
          <Text variant="bodyMedium">{consent ? `Given on ${fmtDate(consent.givenAt.slice(0, 10))} · policy ${consent.policyVersion}` : 'Not given'}</Text>
        </View>
        <View style={styles.actions}>
          <Button label="View" variant="tint" size="xs" onPress={() => Linking.openURL('https://lipidly.app/privacy').catch(() => {})} />
          <Button label="Withdraw" variant="secondary" size="xs" onPress={withdraw} />
        </View>
      </Card>
      <ListGroup>
        <ListRow icon={Download} iconTone="sky" title="Download my data" subtitle="Reports, plans, check-ins and medicines" onPress={download} />
      </ListGroup>
      <ListGroup>
        <ListRow icon={Trash2} iconTone="soft" title="Delete account" subtitle="Permanently removes your account, reports, prescriptions and all history." onPress={confirmDelete} />
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: 8 },
});
