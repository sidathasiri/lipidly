import * as path from 'node:path';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import type * as cognito from 'aws-cdk-lib/aws-cognito';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import type * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface ApiProps {
  stage: string;
  userPool: cognito.IUserPool;
  table: dynamodb.ITableV2;
  bucket: s3.IBucket;
}

const backendRoot = path.join(__dirname, '..', '..');
const repoRoot = path.join(backendRoot, '..');

/**
 * Document reading model, on Bedrock's OpenAI-compatible endpoint (bedrock-mantle). Claude is the
 * goal once AWS enables Anthropic models for this account; Qwen3-VL reads lab reports well meanwhile.
 */
const MODEL_ID = 'qwen.qwen3-vl-235b-a22b-instruct';

/**
 * The one API the app calls. Every request must carry a Cognito token; the Lambda takes the
 * user from `identity.sub`, never from arguments. Field logging stays off so health values
 * never reach CloudWatch.
 */
export class Api extends Construct {
  readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, { stage, userPool, table, bucket }: ApiProps) {
    super(scope, id);

    this.api = new appsync.GraphqlApi(this, 'Api', {
      name: `lipidly-${stage}`,
      definition: appsync.Definition.fromFile(path.join(backendRoot, 'graphql', 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: { authorizationType: appsync.AuthorizationType.USER_POOL, userPoolConfig: { userPool } },
      },
    });

    this.api.addNoneDataSource('None').createResolver('PingResolver', {
      typeName: 'Query',
      fieldName: 'ping',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(path.join(backendRoot, 'resolvers', 'ping.js')),
    });

    const fn = (name: string, file: string, props: Partial<nodejs.NodejsFunctionProps>) =>
      new nodejs.NodejsFunction(this, `${name}Function`, {
        entry: path.join(backendRoot, 'lambda', file),
        projectRoot: repoRoot,
        depsLockFilePath: path.join(repoRoot, 'package-lock.json'),
        runtime: lambda.Runtime.NODEJS_22_X,
        architecture: lambda.Architecture.ARM_64,
        memorySize: 1024,
        // The AWS SDK and workspace packages are bundled in, so versions match what was tested.
        bundling: { externalModules: [], minify: true, sourceMap: true, target: 'node22' },
        logGroup: new logs.LogGroup(this, `${name}Logs`, { retention: logs.RetentionDays.ONE_MONTH, removalPolicy: cdk.RemovalPolicy.DESTROY }),
        ...props,
        environment: { TABLE_NAME: table.tableName, BUCKET_NAME: bucket.bucketName, NODE_OPTIONS: '--enable-source-maps', ...props.environment },
      });

    const mupdfDir = path.join(repoRoot, 'node_modules', 'mupdf');
    const reader = fn('Reader', 'reader.ts', {
      timeout: cdk.Duration.minutes(5),
      // PDF pages are rendered to images in memory.
      memorySize: 2048,
      environment: { MODEL_ID },
      retryAttempts: 0,
      bundling: {
        externalModules: ['mupdf'],
        minify: true,
        sourceMap: true,
        target: 'node22',
        // mupdf is an ES module with a WebAssembly file, so it ships as a package beside the bundle.
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_in: string, out: string) => [`mkdir -p "${out}/node_modules"`, `cp -R "${mupdfDir}" "${out}/node_modules/mupdf"`],
        },
      },
    });
    table.grantReadWriteData(reader);
    bucket.grantRead(reader);
    reader.addToRolePolicy(new iam.PolicyStatement({ actions: ['bedrock-mantle:CreateInference'], resources: ['*'] }));

    const apiFn = fn('Api', 'api.ts', {
      timeout: cdk.Duration.seconds(29),
      environment: { READER_FUNCTION: reader.functionName, USER_POOL_ID: userPool.userPoolId },
    });
    table.grantReadWriteData(apiFn);
    bucket.grantReadWrite(apiFn);
    bucket.grantDelete(apiFn);
    reader.grantInvoke(apiFn);
    apiFn.addToRolePolicy(new iam.PolicyStatement({ actions: ['cognito-idp:AdminDeleteUser'], resources: [userPool.userPoolArn] }));

    const ds = this.api.addLambdaDataSource('ApiFn', apiFn);
    const fields: [string, string[]][] = [
      ['Query', ['sync', 'readingJob', 'fileUrl']],
      ['Mutation', ['putRecords', 'saveProfile', 'planAction', 'confirmReport', 'confirmPrescription', 'createUploadUrl', 'startReading', 'deleteAccount']],
    ];
    for (const [typeName, names] of fields) {
      for (const fieldName of names) ds.createResolver(`${typeName}${fieldName}`, { typeName, fieldName });
    }
  }
}
