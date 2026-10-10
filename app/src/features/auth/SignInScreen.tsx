import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AuthError, signIn, signInWithGoogle } from '@/state/actions/auth';
import { Button, Callout, colors, Screen, Text, TextField } from '@/ui';
import { AuthHeader } from './AuthHeader';
import { GoogleButton } from './GoogleButton';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(undefined);
    setBusy(true);
    try {
      await signIn(email, password);
      router.replace('/');
    } catch (e) {
      if (e instanceof AuthError && e.code === 'unverified') router.push('/auth/verify');
      else setError(e instanceof Error ? e.message : 'Something went wrong.');
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
      if (e instanceof AuthError && e.code === 'cancelled') return;
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  return (
    <Screen keyboard padding="onboarding" gap={16} header={<AuthHeader title="Welcome back" />}>
      <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" placeholder="you@example.com" />
      <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="current-password" textContentType="password" placeholder="Your password" onSubmitEditing={submit} />
      <Button label="Forgot password?" variant="link" size="sm" onPress={() => router.push('/auth/forgot')} style={{ alignSelf: 'flex-start' }} />
      {error && <Callout tone="soft">{error}</Callout>}
      <Button label="Sign in" onPress={submit} loading={busy} disabled={!email || !password} />
      <View style={styles.orRow}>
        <View style={styles.rule} />
        <Text variant="small" color="muted">
          or
        </Text>
        <View style={styles.rule} />
      </View>
      <GoogleButton onPress={google} disabled={busy} />
      <View style={styles.footer}>
        <Text variant="bodyMedium" color="muted">
          New to Lipidly?
        </Text>
        <Button label="Create an account" variant="link" size="sm" onPress={() => router.replace('/auth/sign-up')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rule: { flex: 1, height: 1, backgroundColor: colors.line },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
});
