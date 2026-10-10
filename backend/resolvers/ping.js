import { util } from '@aws-appsync/utils';

/** Query.ping on a NONE data source: no storage touched, just the caller's identity. */
export function request() {
  return { payload: null };
}

export function response(ctx) {
  return { userId: ctx.identity.sub, time: util.time.nowISO8601() };
}
