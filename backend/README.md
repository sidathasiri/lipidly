# Lipidly backend

AWS CDK app (TypeScript). Every resource is in `us-east-1`:

- **DynamoDB** single table: one partition per user (`PK = USER#<sub>`), one item per record (`SK = PROFILE`, `REPORT#<id>`, `CHECKIN#<date>`, …; see `packages/domain/src/records.ts`).
- **S3** private bucket for uploaded originals (`users/<sub>/reports/…`, `users/<sub>/prescriptions/…`).
- **Cognito** user pool: email + password, and Google through the hosted domain `lipidly`.
- **AppSync** GraphQL API (Cognito auth) backed by three Lambdas:
  - `api`: sync, record writes, and the server-decided operations (profile, plan actions, report and prescription confirmation), plus upload/view links and account deletion. It runs the same `@lipidly/domain` code as the app.
  - `reader`: reads uploaded reports and prescriptions with Qwen3-VL 235B on Bedrock (`qwen.qwen3-vl-235b-a22b-instruct`, through the OpenAI-compatible `bedrock-mantle` endpoint, strict JSON schema output) and stores the result on a short-lived job item the app polls. PDF pages are rendered to JPEGs with `mupdf` (WebAssembly) first, because the model reads images only.
  - `planner`: writes a week of meal ideas (spec F13) with Mistral Large 3 (`mistral.mistral-large-3-675b-instruct`): one call outlines 35 different meals, then one call per day writes the recipes in parallel (~20s). The nutrition rules come from `mealGuidance` in `@lipidly/rules`; recipes using a food the user avoids are rewritten. `swapMeal` writes a single replacement recipe directly in the `api` Lambda.

```
bin/lipidly.ts            app entry; region pinned to us-east-1, stage from context (default dev)
lib/lipidly-stack.ts      the stack and its outputs
lib/constructs/           data.ts (table, bucket) · auth.ts (Cognito, Google) · api.ts (AppSync, Lambdas)
graphql/schema.graphql    the API schema
lambda/                   api.ts · reader.ts · planner.ts · lib/db.ts · lib/mantle.ts (signed Chat Completions) · lib/meals.ts
resolvers/                AppSync JS resolvers (ping)
```

## Bedrock model access

This account's regular Bedrock endpoint (`bedrock-runtime`) returns "Operation not allowed" for every model, and Anthropic and OpenAI models are "not available for this account" on `bedrock-mantle`; a support case is open. Open-weight models on `bedrock-mantle` work, so the reader uses Qwen3-VL (chosen after comparing the vision models the account can reach on sample reports). To move to Claude once it's enabled, change `MODEL_ID` in `lib/constructs/api.ts`; prompts and schemas stay the same.

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
