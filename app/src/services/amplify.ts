import { Amplify } from 'aws-amplify';
import { BACKEND } from '@/config/backend';

/**
 * Amplify is used for sign-in only (Cognito). Imported once, first thing, from the root layout.
 * Data goes through AppSync from rollout step 3.
 */
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: BACKEND.userPoolId,
      userPoolClientId: BACKEND.userPoolClientId,
      signUpVerificationMethod: 'code',
      loginWith: { email: true },
    },
  },
});
