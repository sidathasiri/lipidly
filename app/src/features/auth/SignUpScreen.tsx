import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { signInWithGoogle, signUp } from '@/state/actions/auth';
import { Button, Callout, colors, Screen, Text, TextField } from '@/ui';
import { AuthHeader } from './AuthHeader';
import { GoogleButton } from './GoogleButton';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const emailOk = /\S+@\S+\.\S+/.test(email);

  const submit = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await signUp(name, email, password);
      router.push('/auth/verify');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setError(undefined);
    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <Screen keyboard padding="onboarding" gap={16} header={<AuthHeader title="Create your account" />}>
      <GoogleButton onPress={google} disabled={busy} />
      <View style={styles.orRow}>
        <View style={styles.rule} />
        <Text variant="small" color="muted">
          or with email
        </Text>
        <View style={styles.rule} />
      </View>
      <TextField label="Your name" value={name} onChangeText={setName} autoComplete="name" textContentType="name" placeholder="First and last name" />
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="At least 8 characters"
        hint="At least 8 characters."
      />
      {error && <Callout tone="soft">{error}</Callout>}
      <Button label="Create account" onPress={submit} loading={busy} disabled={!name.trim() || !emailOk || password.length < 8} />
      <View style={styles.footer}>
        <Text variant="bodyMedium" color="muted">
          Already have an account?
        </Text>
        <Button label="Sign in" variant="link" size="sm" onPress={() => router.replace('/auth/sign-in')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
