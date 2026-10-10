import { router } from 'expo-router';
import { useState } from 'react';
import { MOCK_CODE_HINT, requestPasswordReset, resetPassword } from '@/state/actions/auth';
import { Button, Callout, CodeInput, Screen, Text, TextField } from '@/ui';
import { AuthHeader } from './AuthHeader';

/** Two steps: send a code to the email, then enter the code and a new password. */
export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(undefined);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'done') {
    return (
      <Screen padding="onboarding" header={<AuthHeader title="Password changed" mood="celebrating" />} footer={<Button label="Sign in" onPress={() => router.replace('/auth/sign-in')} />}>
        <Text variant="body" color="muted">
          You can now sign in with your new password.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      padding="onboarding"
      gap={16}
      header={<AuthHeader title={step === 'email' ? 'Reset your password' : 'Check your email'} back mood="thinking" />}
      footer={
        step === 'email' ? (
          <Button label="Send code" loading={busy} disabled={!/\S+@\S+\.\S+/.test(email)} onPress={() => run(async () => { await requestPasswordReset(email); setStep('reset'); })} />
        ) : (
          <Button label="Change password" loading={busy} disabled={code.length < 6 || password.length < 8} onPress={() => run(async () => { await resetPassword(code, password); setStep('done'); })} />
        )
      }
    >
      {step === 'email' ? (
        <>
          <Text variant="body" color="muted">
            We'll email you a code to set a new password.
          </Text>
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" placeholder="you@example.com" />
        </>
      ) : (
        <>
          <Text variant="body" color="muted">
            Enter the code we sent to {email}, then choose a new password.
          </Text>
          <CodeInput value={code} onChange={setCode} />
          <TextField label="New password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="At least 8 characters" />
          <Text variant="small" weight={400} color="muted">
            {MOCK_CODE_HINT}
          </Text>
        </>
      )}
      {error && <Callout tone="soft">{error}</Callout>}
    </Screen>
  );
}
