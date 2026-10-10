import * as cdk from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import { Api } from './constructs/api.js';
import { Auth } from './constructs/auth.js';
import { Data } from './constructs/data.js';

export interface LipidlyStackProps extends cdk.StackProps {
  stage: string;
}

/**
 * Lipidly backend: storage (DynamoDB + S3), sign-in (Cognito, email and Google) and the API
 * (AppSync + Lambda, with Claude on Bedrock for reading documents).
 */
export class LipidlyStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LipidlyStackProps) {
    super(scope, id, props);
    const { stage } = props;
    const domainPrefix = this.node.getContext('lipidly:cognitoDomainPrefix') as string;

    const data = new Data(this, 'Data', { stage });
    const auth = new Auth(this, 'Auth', {
      stage,
      domainPrefix,
      googleClientId: this.node.getContext('lipidly:googleClientId') as string,
      googleClientSecretName: this.node.getContext('lipidly:googleClientSecretName') as string,
    });
    const api = new Api(this, 'Api', { stage, userPool: auth.userPool, table: data.table, bucket: data.bucket });

    cdk.Tags.of(this).add('app', 'lipidly');
    cdk.Tags.of(this).add('stage', stage);

    // Values the app needs (non-secret).
    new cdk.CfnOutput(this, 'Region', { value: this.region });
    new cdk.CfnOutput(this, 'UserPoolId', { value: auth.userPool.userPoolId });
    new cdk.CfnOutput(this, 'UserPoolClientId', { value: auth.client.userPoolClientId });
    new cdk.CfnOutput(this, 'CognitoDomain', { value: `${auth.domain.domainName}.auth.${this.region}.amazoncognito.com` });
    new cdk.CfnOutput(this, 'GraphqlUrl', { value: api.api.graphqlUrl });
    new cdk.CfnOutput(this, 'TableName', { value: data.table.tableName });
    new cdk.CfnOutput(this, 'BucketName', { value: data.bucket.bucketName });
  }
}
