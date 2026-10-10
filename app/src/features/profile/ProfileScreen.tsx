import { ageOn } from '@lipidly/rules';
import { router } from 'expo-router';
import { Bell, Database, Info, LogOut, Pencil, Shield, Sparkles } from 'lucide-react-native';
import { Alert, StyleSheet, View } from 'react-native';
import { signOut } from '@/state/actions/auth';
import { useAccount, useUserData } from '@/state/hooks';
import { today } from '@/state/ids';
import { loadSampleData } from '@/state/sample-data';
import { isSyncedSession } from '@/state/store';
import { colors, ColouredHeader, DetailList, ListGroup, ListRow, Screen, Text } from '@/ui';
import { ALCOHOL_OPTIONS, CONDITION_OPTIONS, labelOf, MEDICINE_OPTIONS, SEX_OPTIONS, SMOKING_OPTIONS, TIME_OPTIONS } from '../onboarding/options';

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('') || '?';

/** Personal, health and lifestyle details, and settings (32). */
export default function ProfileScreen() {
  const account = useAccount();
  const { profile } = useUserData();
  const name = profile?.name || account?.name || 'You';

  const rows: [string, string][] = profile
    ? [
        ['Age · sex', `${profile.dateOfBirth ? ageOn(profile.dateOfBirth, today()) : '–'} · ${labelOf(SEX_OPTIONS, profile.sex)}`],
        ['Height · weight', `${profile.heightCm ? `${profile.heightCm} cm` : '–'} · ${profile.weightKg ? `${profile.weightKg} kg` : '–'}`],
        ['Smoking · alcohol', `${labelOf(SMOKING_OPTIONS, profile.smokes)} · ${labelOf(ALCOHOL_OPTIONS, profile.alcohol)}`],
        ['Lipid medicine', labelOf(MEDICINE_OPTIONS, profile.takesLipidMedicine)],
        ['Health conditions', profile.conditions.length ? profile.conditions.map((c) => labelOf(CONDITION_OPTIONS, c)).join(', ') : 'None'],
      ]
    : [];

  return (
    <Screen
      tabBar
      gap={10}
      header={
        <ColouredHeader tone="tint" paddingBottom={18}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text variant="figure" color="white" style={{ fontSize: 22 }}>
                {initials(name)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="h2" accessibilityRole="header">
                {name}
              </Text>
              <Text variant="small" color="onPrimaryTint" style={{ fontSize: 14 }}>
                {account?.email}
              </Text>
            </View>
          </View>
        </ColouredHeader>
      }
    >
      {rows.length > 0 && <DetailList rows={rows} />}
      <ListGroup>
        <ListRow icon={Pencil} iconTone="tint" title="Edit profile" onPress={() => router.push({ pathname: '/onboarding/profile', params: { edit: '1' } })} />
        <ListRow
          icon={Sparkles}
          iconTone="lilac"
          title="What fits your life"
          value={profile ? labelOf(TIME_OPTIONS, profile.lifestyle.timeFree) : undefined}
          onPress={() => router.push({ pathname: '/onboarding/lifestyle', params: { edit: '1' } })}
        />
        <ListRow icon={Bell} iconTone="sky" title="Reminders" onPress={() => router.push('/profile/reminders')} />
        <ListRow icon={Shield} iconTone="tint" title="Privacy and data" onPress={() => router.push('/profile/privacy')} />
        <ListRow icon={Info} iconTone="ice" title="About Lipidly" onPress={() => router.push('/profile/about')} />
      </ListGroup>
      <ListGroup>
        <ListRow
          icon={LogOut}
          iconTone="soft"
          title="Sign out"
          chevron={false}
          onPress={() => {
            signOut();
            router.replace('/');
          }}
        />
        {/* Sample data is local only (it isn't on the server), so it's offered to the developer account only. */}
        {__DEV__ && !isSyncedSession() && (
          <ListRow
            icon={Database}
            iconTone="soft"
            title="Load sample data"
            subtitle="Developer only: fills the app with the design's sample user"
            chevron={false}
            onPress={() =>
              Alert.alert('Load sample data?', 'This replaces your data on this device with the sample user.', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Load', onPress: loadSampleData },
              ])
            }
          />
        )}
        {__DEV__ && <ListRow icon={Sparkles} iconTone="soft" title="Component gallery" subtitle="Developer only" onPress={() => router.push('/dev/ui')} />}
      </ListGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
