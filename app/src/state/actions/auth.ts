import * as Auth from 'aws-amplify/auth';
import { emptyUserData, getState, setState } from '../store';
import type { Account } from '../types';

/**
 * Sign-in with Cognito (email + password, email verification codes) through Amplify Auth.
 * The Cognito user's `sub` is the user ID that keys their data, here and in DynamoDB.
 */

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

export const CODE_HINT = 'The code can take a minute to arrive. Check your spam folder too.';

/** Held in memory only, so a user who verifies their email is signed straight in. */
let pendingPassword: string | undefined;

const key = (email: string) => email.trim().toLowerCase();

/** Plain-language messages for Cognito's error names. */
function friendly(e: unknown): AuthError {
  if (e instanceof AuthError) return e;
  const name = (e as { name?: string })?.name ?? '';
  const messages: Record<string, string> = {
    UsernameExistsException: 'An account with this email already exists. Try signing in.',
    NotAuthorizedException: 'That email and password don’t match.',
    UserNotFoundException: 'That email and password don’t match.',
    CodeMismatchException: 'That code isn’t right. Check the email and try again.',
    ExpiredCodeException: 'That code has expired. Tap Resend code for a new one.',
    LimitExceededException: 'Too many attempts. Please wait a few minutes and try again.',
    TooManyRequestsException: 'Too many attempts. Please wait a few minutes and try again.',
    TooManyFailedAttemptsException: 'Too many attempts. Please wait a few minutes and try again.',
    InvalidPasswordException: 'Use at least 8 characters for your password.',
    NetworkError: 'No connection. Check your internet and try again.',
  };
  return new AuthError(messages[name] ?? 'Something went wrong. Please try again.', name);
}

/** Reads the signed-in Cognito user and stores the session. */
async function establishSession() {
  const user = await Auth.getCurrentUser();
  // Attributes need the network; offline, keep what this phone already knows about the user.
  const attrs = await Auth.fetchUserAttributes().catch(() => ({}) as Auth.FetchUserAttributesOutput);
  const known = getState().session?.id === user.userId ? getState().session : undefined;
  const account: Account = {
    id: user.userId,
    email: attrs.email ?? known?.email ?? user.signInDetails?.loginId ?? '',
    name: attrs.name ?? known?.name ?? '',
    provider: 'password',
    verified: true,
  };
  const { data } = getState();
  setState({ session: account, pendingEmail: undefined, data: { ...data, [account.id]: data[account.id] ?? emptyUserData() } });
  pendingPassword = undefined;
}

export async function signUp(name: string, email: string, password: string) {
  try {
    if (password.length < 8) throw new AuthError('Use at least 8 characters for your password.');
    const { nextStep } = await Auth.signUp({
      username: key(email),
      password,
      options: { userAttributes: { email: key(email), name: name.trim() } },
    });
    pendingPassword = password;
    setState({ pendingEmail: key(email) });
    if (nextStep.signUpStep === 'DONE') await signIn(email, password);
  } catch (e) {
    throw friendly(e);
  }
}

/** Confirms the email code, then signs in when the password is still in memory. */
export async function verifyEmail(code: string): Promise<'signedIn' | 'signInNeeded'> {
  const email = getState().pendingEmail;
  if (!email) throw new AuthError('Please start again.');
  if (!/^\d{6}$/.test(code)) throw new AuthError('Enter the 6-digit code from the email.');
  try {
    await Auth.confirmSignUp({ username: email, confirmationCode: code });
    if (!pendingPassword) return 'signInNeeded';
    await Auth.signIn({ username: email, password: pendingPassword });
    await establishSession();
    return 'signedIn';
  } catch (e) {
    throw friendly(e);
  }
}

export async function resendCode() {
  const email = getState().pendingEmail;
  if (!email) throw new AuthError('Please start again.');
  try {
    await Auth.resendSignUpCode({ username: email });
  } catch (e) {
    throw friendly(e);
  }
}

/** Throws `AuthError` with code `unverified` when the email still needs its code. */
export async function signIn(email: string, password: string) {
  try {
    const { nextStep } = await Auth.signIn({ username: key(email), password });
    if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      pendingPassword = password;
      setState({ pendingEmail: key(email) });
      await Auth.resendSignUpCode({ username: key(email) });
      throw new AuthError('Please verify your email first.', 'unverified');
    }
    if (nextStep.signInStep !== 'DONE') throw new AuthError('This account needs a step the app doesn’t support yet.', nextStep.signInStep);
    await establishSession();
  } catch (e) {
    if ((e as { name?: string })?.name === 'UserAlreadyAuthenticatedException') return establishSession();
    throw friendly(e);
  }
}

/** Google sign-in arrives in rollout step 7 (Cognito federation). */
export async function signInWithGoogle(): Promise<void> {
  throw new AuthError('Google sign-in is coming soon. Please use your email for now.', 'unavailable');
}

export async function requestPasswordReset(email: string) {
  try {
    await Auth.resetPassword({ username: key(email) });
    setState({ pendingEmail: key(email) });
  } catch (e) {
    throw friendly(e);
  }
}

export async function resetPassword(code: string, password: string) {
  const email = getState().pendingEmail;
  if (!email) throw new AuthError('Please start again.');
  if (!/^\d{6}$/.test(code)) throw new AuthError('Enter the 6-digit code from the email.');
  if (password.length < 8) throw new AuthError('Use at least 8 characters for your password.');
  try {
    await Auth.confirmResetPassword({ username: email, confirmationCode: code, newPassword: password });
    setState({ pendingEmail: undefined });
  } catch (e) {
    throw friendly(e);
  }
}

export function signOut() {
  setState({ session: undefined });
  Auth.signOut().catch(() => {});
}

/**
 * Deletes the Cognito user and this phone's copy of their data (F12.3).
 * From rollout step 7 a Lambda also removes their table items and files.
 */
export async function deleteAccount() {
  try {
    await Auth.deleteUser();
  } catch (e) {
    throw friendly(e);
  }
  const { session, data } = getState();
  const next = { ...data };
  if (session) delete next[session.id];
  setState({ session: undefined, data: next });
}

/** On launch: keep the stored session only if Cognito still has a signed-in user, and vice versa. */
export async function restoreSession() {
  try {
    await Auth.getCurrentUser();
    await establishSession();
  } catch {
    if (getState().session) setState({ session: undefined });
  }
}

export const currentAccount = () => getState().session;
