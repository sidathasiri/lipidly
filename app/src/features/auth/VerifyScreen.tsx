import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { CODE_HINT, resendCode, verifyEmail } from '@/state/actions/auth';
import { useStore } from '@/state/store';
import { Button, Callout, CodeInput, Screen, Text } from '@/ui';
import { AuthHeader } from './AuthHeader';

const RESEND_SECONDS = 45;

/** Email verification with six code boxes (reuses the design 02 pattern). */
export default function VerifyScreen() {
  const email = useStore((s) => s.pendingEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const result = await verifyEmail(code);
      if (result === 'signedIn') router.replace('/');
      else router.replace('/auth/sign-in');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      keyboard
      padding="onboarding"
      gap={18}
      header={<AuthHeader title="Enter the code we sent" back />}
      footer={
        <>
          <Text variant="small" weight={400} color="muted" align="center">
            {CODE_HINT}
          </Text>
          <Button label="Verify" onPress={submit} loading={busy} disabled={code.length < 6} />
        </>
      }
    >
      <Text variant="body" color="muted" style={{ fontSize: 16 }}>
        Sent by email to {email ?? 'your inbox'}.
      </Text>
      <CodeInput value={code} onChange={setCode} />
      {left > 0 ? (
        <Text variant="bodyMedium" weight={400} color="muted">
          Resend code in 0:{String(left).padStart(2, '0')}
        </Text>
      ) : (
        <Button
          label="Resend code"
          variant="link"
          size="sm"
          style={{ alignSelf: 'flex-start' }}
          onPress={async () => {
            await resendCode();
            setLeft(RESEND_SECONDS);
          }}
        />
      )}
      {error && <Callout tone="soft">{error}</Callout>}
    </Screen>
  );
}
