#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { LipidlyStack } from '../lib/lipidly-stack.js';

/** Every Lipidly resource lives in us-east-1 (N. Virginia). */
const REGION = 'us-east-1';

const app = new cdk.App();
const stage = app.node.tryGetContext('stage') ?? 'dev';

new LipidlyStack(app, `Lipidly-${stage}`, {
  stage,
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: REGION },
});
