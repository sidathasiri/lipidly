# Lipidly backend

AWS CDK app (TypeScript). Every resource is in `us-east-1`. Built step by step from the backend plan; currently at **step 1, Foundation**: DynamoDB table, private S3 bucket, Cognito user pool (email + password, hosted domain `lipidly`), and an AppSync API with a `ping` health check.

```
bin/lipidly.ts            app entry; region pinned to us-east-1, stage from context (default dev)
lib/lipidly-stack.ts      the stack and its outputs
lib/constructs/           data.ts (table, bucket) · auth.ts (Cognito) · api.ts (AppSync)
graphql/schema.graphql    the API schema
resolvers/                AppSync JS resolvers
```

## Deploy

Credentials come from an AWS profile or the usual environment variables.

```sh
cd backend
AWS_PROFILE=lipidly npx cdk deploy Lipidly-dev     # dev stage
AWS_PROFILE=lipidly npx cdk deploy -c stage=prod   # prod stage (later)
```

The account is already bootstrapped in us-east-1. Outputs (user pool ID, app client ID, Cognito domain, GraphQL URL, table, bucket) print after each deploy and are non-secret.

## Secrets

- `lipidly/google-oauth` in Secrets Manager: Google OAuth client (`client_id`, `client_secret`). Used from step 7 for Google sign-in. Never commit it.

## Settings (`cdk.json` context)

| Key | Value |
| --- | --- |
| `lipidly:cognitoDomainPrefix` | `lipidly` → `lipidly.auth.us-east-1.amazoncognito.com` (Google's redirect host) |
| `lipidly:googleClientId` | Google OAuth client ID (public) |
| `lipidly:googleClientSecretName` | `lipidly/google-oauth` |
