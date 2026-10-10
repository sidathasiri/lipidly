import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';

/**
 * Lipidly backend. Planned resources (see docs): Cognito (email/password + Google), AppSync,
 * one DynamoDB table (PK=USER#<sub>), S3 for report and prescription files, and Lambdas
 * that use @lipidly/rules and Bedrock. None are created yet.
 */
export class LipidlyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
