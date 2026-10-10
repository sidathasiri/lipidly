#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LipidlyStack } from '../lib/lipidly-stack.js';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') ?? 'dev';

new LipidlyStack(app, `Lipidly-${stage}`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION ?? 'ap-south-1' },
});
