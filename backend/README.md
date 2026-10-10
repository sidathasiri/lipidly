# Lipidly backend

AWS CDK app (TypeScript). Every resource is in `us-east-1`:

- **DynamoDB** single table: one partition per user (`PK = USER#<sub>`), one item per record (`SK = PROFILE`, `REPORT#<id>`, `CHECKIN#<date>`, …; see `packages/domain/src/records.ts`).
- **S3** private bucket for uploaded originals (`users/<sub>/reports/…`, `users/<sub>/prescriptions/…`).
- **Cognito** user pool: email + password, and Google through the hosted domain `lipidly`.
- **AppSync** GraphQL API (Cognito auth) backed by two Lambdas:
  - `api`: sync, record writes, and the server-decided operations (profile, plan actions, report and prescription confirmation), plus upload/view links and account deletion. It runs the same `@lipidly/domain` code as the app.
  - `reader`: reads uploaded reports and prescriptions with Claude Opus 5.5 on Bedrock (`us.anthropic.claude-opus-5-5`, structured JSON output) and stores the result on a short-lived job item the app polls.

```
bin/lipidly.ts            app entry; region pinned to us-east-1, stage from context (default dev)
lib/lipidly-stack.ts      the stack and its outputs
lib/constructs/           data.ts (table, bucket) · auth.ts (Cognito, Google) · api.ts (AppSync, Lambdas)
graphql/schema.graphql    the API schema
lambda/                   api.ts · reader.ts · lib/db.ts
resolvers/                AppSync JS resolvers (ping)
```

## Bedrock model access

Reading documents needs Anthropic model access in the Bedrock console (us-east-1 → Model access → Claude Opus 5.5). Until it's granted, reading jobs fail with "Operation not allowed" in the reader's logs, and the app shows "We couldn't read this document right now". Entering values by hand still works.

## Deploy

Credentials come from an AWS profile or the usual environment variables.

```sh
cd backend
AWS_PROFILE=lipidly npx cdk deploy Lipidly-dev     # dev stage
AWS_PROFILE=lipidly npx cdk deploy -c stage=prod   # prod stage (later)
```

The account is already bootstrapped in us-east-1. Outputs (user pool ID, app client ID, Cognito domain, GraphQL URL, table, bucket) print after each deploy and are non-secret.

## Secrets

- `lipidly/google-oauth` in Secrets Manager: Google OAuth client (`client_id`, `client_secret`). Read at deploy time for Google sign-in. Never commit it.

## Settings (`cdk.json` context)

| Key | Value |
| --- | --- |
| `lipidly:cognitoDomainPrefix` | `lipidly` → `lipidly.auth.us-east-1.amazoncognito.com` (Google's redirect host) |
| `lipidly:googleClientId` | Google OAuth client ID (public) |
| `lipidly:googleClientSecretName` | `lipidly/google-oauth` |
