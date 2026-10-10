/**
 * Backend endpoints for the dev stage (outputs of `cdk deploy Lipidly-dev`). None of these are
 * secret: they identify the services, and every call still needs the signed-in user's token.
 */
export const BACKEND = {
  region: 'us-east-1',
  userPoolId: 'us-east-1_RHcfi9hpa',
  userPoolClientId: '3ht0738lpkfv6jc9c6ng8lshfb',
  cognitoDomain: 'lipidly.auth.us-east-1.amazoncognito.com',
  graphqlUrl: 'https://l6as7jy4prgope7bv4royvyrpe.appsync-api.us-east-1.amazonaws.com/graphql',
} as const;
