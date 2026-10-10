import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthProps {
  stage: string;
  /** Hosted domain prefix: <prefix>.auth.us-east-1.amazoncognito.com (also Google's redirect host). */
  domainPrefix: string;
  /** Google OAuth web client ID (not secret). */
  googleClientId: string;
  /** Secrets Manager secret holding `client_secret` for that client. */
  googleClientSecretName: string;
}

/** App deep links that Cognito's hosted sign-in may return to (scheme set in app.json). */
const CALLBACK_URL = 'lipidly://auth/callback';
const SIGN_OUT_URL = 'lipidly://auth/signout';

/**
 * Sign-in: a Cognito user pool with email + password and email verification codes, plus Google
 * through Cognito's hosted sign-in (client secret read from Secrets Manager at deploy time).
 */
export class Auth extends Construct {
  readonly userPool: cognito.UserPool;
  readonly client: cognito.UserPoolClient;
  readonly domain: cognito.UserPoolDomain;

  constructor(scope: Construct, id: string, { stage, domainPrefix, googleClientId, googleClientSecretName }: AuthProps) {
    super(scope, id);
    const prod = stage === 'prod';

    this.userPool = new cognito.UserPool(this, 'Users', {
      userPoolName: `lipidly-${stage}`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: false, mutable: true },
      },
      // Matches the app: at least 8 characters, no other rules.
      passwordPolicy: { minLength: 8, requireLowercase: false, requireUppercase: false, requireDigits: false, requireSymbols: false },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      userVerification: {
        emailStyle: cognito.VerificationEmailStyle.CODE,
        emailSubject: 'Your Lipidly code',
        emailBody: 'Your Lipidly verification code is {####}',
      },
      deletionProtection: prod,
      removalPolicy: prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    this.domain = this.userPool.addDomain('Domain', { cognitoDomain: { domainPrefix } });

    const google = new cognito.UserPoolIdentityProviderGoogle(this, 'Google', {
      userPool: this.userPool,
      clientId: googleClientId,
      clientSecretValue: cdk.SecretValue.secretsManager(googleClientSecretName, { jsonField: 'client_secret' }),
      scopes: ['openid', 'email', 'profile'],
      attributeMapping: {
        email: cognito.ProviderAttribute.GOOGLE_EMAIL,
        emailVerified: cognito.ProviderAttribute.GOOGLE_EMAIL_VERIFIED,
        fullname: cognito.ProviderAttribute.GOOGLE_NAME,
      },
    });

    this.client = this.userPool.addClient('App', {
      userPoolClientName: 'lipidly-app',
      generateSecret: false,
      // userSrp: the app's sign-in. adminUserPassword: server-side tests only (needs AWS admin credentials).
      authFlows: { userSrp: true, adminUserPassword: true },
      preventUserExistenceErrors: true,
      supportedIdentityProviders: [cognito.UserPoolClientIdentityProvider.COGNITO, cognito.UserPoolClientIdentityProvider.GOOGLE],
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        callbackUrls: [CALLBACK_URL],
        logoutUrls: [SIGN_OUT_URL],
      },
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });
    this.client.node.addDependency(google);
  }
}
