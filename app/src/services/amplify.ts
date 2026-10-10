import { Amplify } from 'aws-amplify';
import { BACKEND } from '@/config/backend';

/**
 * Amplify is used for sign-in only (Cognito: email + password, and Google through the hosted
 * sign-in). Imported once, first thing, from the root layout. Data goes through services/api.ts.
 */
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: BACKEND.userPoolId,
      userPoolClientId: BACKEND.userPoolClientId,
      signUpVerificationMethod: 'code',
      loginWith: {
        email: true,
        oauth: {
          domain: BACKEND.cognitoDomain,
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: ['lipidly://auth/callback'],
          redirectSignOut: ['lipidly://auth/signout'],
          responseType: 'code',
          providers: ['Google'],
        },
      },
    },
  },
});
