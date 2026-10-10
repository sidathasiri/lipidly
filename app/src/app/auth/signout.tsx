import { Redirect } from 'expo-router';

/** Return address of Google sign-in (Amplify finishes the sign-in itself); the gate routes onwards. */
export default function AuthReturn() {
  return <Redirect href="/" />;
}
