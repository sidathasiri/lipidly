import * as path from 'node:path';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import type * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface ApiProps {
  stage: string;
  userPool: cognito.IUserPool;
}

const backendRoot = path.join(__dirname, '..', '..');

/**
 * The one API the app calls. Every request must carry a Cognito token; resolvers take the
 * user from `ctx.identity.sub`, never from arguments. Field logging stays off so health
 * values never reach CloudWatch.
 */
export class Api extends Construct {
  readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, { stage, userPool }: ApiProps) {
    super(scope, id);

    this.api = new appsync.GraphqlApi(this, 'Api', {
      name: `lipidly-${stage}`,
      definition: appsync.Definition.fromFile(path.join(backendRoot, 'graphql', 'schema.graphql')),
      authorizationConfig: {
        defaultAuthorization: { authorizationType: appsync.AuthorizationType.USER_POOL, userPoolConfig: { userPool } },
      },
    });

    // Rollout step 1 health check: proves sign-in + token checking end to end.
    this.api.addNoneDataSource('None').createResolver('PingResolver', {
      typeName: 'Query',
      fieldName: 'ping',
      runtime: appsync.FunctionRuntime.JS_1_0_0,
      code: appsync.Code.fromAsset(path.join(backendRoot, 'resolvers', 'ping.js')),
    });
  }
}
