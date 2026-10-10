import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface DataProps {
  stage: string;
}

/**
 * Storage: one DynamoDB table (PK = USER#<sub>, one partition per user) and a private
 * bucket for report and prescription files under users/<sub>/. See the backend plan, "Data model".
 */
export class Data extends Construct {
  readonly table: dynamodb.TableV2;
  readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, { stage }: DataProps) {
    super(scope, id);
    const prod = stage === 'prod';
    const removalPolicy = prod ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY;

    this.table = new dynamodb.TableV2(this, 'Table', {
      tableName: `lipidly-${stage}`,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK', type: dynamodb.AttributeType.STRING },
      billing: dynamodb.Billing.onDemand(),
      encryption: dynamodb.TableEncryptionV2.awsManagedKey(),
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      // Draft reports and reading jobs carry `expiresAt` (epoch seconds) and are removed automatically.
      timeToLiveAttribute: 'expiresAt',
      deletionProtection: prod,
      removalPolicy,
    });

    this.bucket = new s3.Bucket(this, 'Files', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.KMS_MANAGED,
      enforceSSL: true,
      lifecycleRules: [{ abortIncompleteMultipartUploadAfter: cdk.Duration.days(1) }],
      removalPolicy,
      autoDeleteObjects: !prod,
    });
  }
}
