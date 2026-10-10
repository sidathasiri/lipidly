# Lipidly backend (placeholder)

AWS CDK app in TypeScript. The stack is empty for now; the frontend runs on mock data.

```sh
npm run synth -w @lipidly/backend    # synthesise CloudFormation (no AWS credentials needed)
```

Deploying will need AWS credentials and a one-time `npx cdk bootstrap`. Default region: `ap-south-1`.
