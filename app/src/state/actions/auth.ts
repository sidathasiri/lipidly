import { emptyUserData, getState, setState, type MockAccount } from '../store';
import { newId } from '../ids';

/**
 * Mock authentication standing in for Cognito (email/password + Google).
 * Passwords are kept only on this device for local testing; Cognito replaces all of this.
 */

const key = (email: string) => email.trim().toLowerCase();
const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms));

export class AuthError extends Error {}

/** Any 6 digits are accepted while auth is mocked. */
export const MOCK_CODE_HINT = 'Any 6-digit code works until sign-in is connected.';

export async function signUp(name: string, email: string, password: string) {
  await delay();
  const k = key(email);
  const { accounts } = getState();
  if (accounts[k]?.verified) throw new AuthError('An account with this email already exists. Try signing in.');
  if (password.length < 8) throw new AuthError('Use at least 8 characters for your password.');
  const account: MockAccount = { id: accounts[k]?.id ?? newId('u_'), email: email.trim(), name: name.trim(), provider: 'password', verified: false, password };
  setState({ accounts: { ...accounts, [k]: account }, pendingEmail: k });
}

export async function verifyEmail(code: string) {
  await delay();
  if (!/^\d{6}$/.test(code)) throw new AuthError('Enter the 6-digit code from the email.');
  const { pendingEmail, accounts, data } = getState();
  const account = pendingEmail ? accounts[pendingEmail] : undefined;
  if (!account) throw new AuthError('Please start again.');
  setState({
    accounts: { ...accounts, [pendingEmail!]: { ...account, verified: true } },
    sessionUserId: account.id,
    pendingEmail: undefined,
    data: { ...data, [account.id]: data[account.id] ?? emptyUserData() },
  });
}

export async function resendCode() {
  await delay(300);
}

export async function signIn(email: string, password: string) {
  await delay();
  const k = key(email);
  const account = getState().accounts[k];
  if (!account || account.password !== password) throw new AuthError('That email and password don’t match.');
  if (!account.verified) {
    setState({ pendingEmail: k });
    throw new AuthError('unverified');
  }
  const { data } = getState();
  setState({ sessionUserId: account.id, data: { ...data, [account.id]: data[account.id] ?? emptyUserData() } });
}

/** Mock Google sign-in: signs in as a local Google test account. */
export async function signInWithGoogle() {
  await delay(700);
  const k = 'google.tester@gmail.com';
  const { accounts, data } = getState();
  const account: MockAccount = accounts[k] ?? { id: newId('u_'), email: k, name: '', provider: 'google', verified: true };
  setState({
    accounts: { ...accounts, [k]: account },
    sessionUserId: account.id,
    data: { ...data, [account.id]: data[account.id] ?? emptyUserData() },
  });
}

export async function requestPasswordReset(email: string) {
  await delay();
  const k = key(email);
  if (!getState().accounts[k]) throw new AuthError('We couldn’t find an account with that email.');
  setState({ pendingEmail: k });
}

export async function resetPassword(code: string, password: string) {
  await delay();
  if (!/^\d{6}$/.test(code)) throw new AuthError('Enter the 6-digit code from the email.');
  if (password.length < 8) throw new AuthError('Use at least 8 characters for your password.');
  const { pendingEmail, accounts } = getState();
  const account = pendingEmail ? accounts[pendingEmail] : undefined;
  if (!account) throw new AuthError('Please start again.');
  setState({ accounts: { ...accounts, [pendingEmail!]: { ...account, password, verified: true } }, pendingEmail: undefined });
}

export function signOut() {
  setState({ sessionUserId: undefined });
}

/** Deletes the account and all its data (F12.3). */
export async function deleteAccount() {
  await delay();
  const { sessionUserId, accounts, data } = getState();
  if (!sessionUserId) return;
  const nextAccounts = Object.fromEntries(Object.entries(accounts).filter(([, a]) => a.id !== sessionUserId));
  const nextData = { ...data };
  delete nextData[sessionUserId];
  setState({ accounts: nextAccounts, data: nextData, sessionUserId: undefined });
}

export const currentAccount = () => {
  const { sessionUserId, accounts } = getState();
  return Object.values(accounts).find((a) => a.id === sessionUserId);
};
