import { fetchAuthSession } from 'aws-amplify/auth';
import type { DataRecord } from '@lipidly/domain';
import { BACKEND } from '@/config/backend';

/**
 * The AppSync client: GraphQL over fetch with the signed-in user's Cognito access token.
 * AWSJSON values are sent and received as JSON strings.
 */

/** No connection, or the server could not be reached: safe to retry later. */
export class OfflineError extends Error {
  constructor() {
    super('No connection. Check your internet and try again.');
  }
}

/** The server refused the request (its message is meant for the user). Retrying won't help. */
export class ApiError extends Error {}

export async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const session = await fetchAuthSession().catch(() => undefined);
  const token = session?.tokens?.accessToken?.toString();
  if (!token) throw new OfflineError();
  let res: Response;
  try {
    res = await fetch(BACKEND.graphqlUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: token },
      body: JSON.stringify({ query, variables }),
    });
  } catch {
    throw new OfflineError();
  }
  if (res.status >= 500 || res.status === 429) throw new OfflineError();
  const body = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (body.errors?.length) throw new ApiError(body.errors[0]!.message);
  return body.data as T;
}

interface RawRecord extends Omit<DataRecord, 'data'> {
  data: string | null;
}

export const parseRecords = (raw: RawRecord[]): DataRecord[] => raw.map((r) => ({ ...r, data: r.data == null ? null : JSON.parse(r.data) }));

const RECORD = 'sk type data deleted updatedAt';

export interface MutationResult<I = unknown> {
  records: DataRecord[];
  info: I;
}

/** Runs one of the server operations that return { records, info }. */
export async function serverOp<I = unknown>(field: string, args: Record<string, { type: string; value: unknown }>): Promise<MutationResult<I>> {
  const params = Object.entries(args).map(([k, a]) => `$${k}: ${a.type}`).join(', ');
  const passes = Object.keys(args).map((k) => `${k}: $${k}`).join(', ');
  const variables = Object.fromEntries(Object.entries(args).map(([k, a]) => [k, a.type.startsWith('AWSJSON') ? JSON.stringify(a.value) : a.value]));
  const data = await gql<Record<string, { records: RawRecord[]; info: string | null }>>(
    `mutation (${params}) { ${field}(${passes}) { records { ${RECORD} } info } }`,
    variables,
  );
  const out = data[field]!;
  return { records: parseRecords(out.records), info: (out.info == null ? null : JSON.parse(out.info)) as I };
}

export async function putRecords(records: DataRecord[]): Promise<DataRecord[]> {
  const data = await gql<{ putRecords: RawRecord[] }>(`mutation ($r: [RecordInput!]!) { putRecords(records: $r) { ${RECORD} } }`, {
    r: records.map((r) => ({ sk: r.sk, type: r.type, data: r.deleted ? null : JSON.stringify(r.data), deleted: !!r.deleted })),
  });
  return parseRecords(data.putRecords);
}

export async function syncPage(since: string | undefined, nextToken: string | undefined) {
  const data = await gql<{ sync: { records: RawRecord[]; nextToken: string | null } }>(
    `query ($since: String, $next: String) { sync(since: $since, nextToken: $next) { records { ${RECORD} } nextToken } }`,
    { since, next: nextToken },
  );
  return { records: parseRecords(data.sync.records), nextToken: data.sync.nextToken ?? undefined };
}

// ── Files and reading ─────────────────────────────────────────────────────────

export type FileKind = 'report' | 'prescription';

export async function createUploadUrl(kind: FileKind, contentType: string) {
  const data = await gql<{ createUploadUrl: { key: string; url: string } }>(
    'mutation ($kind: FileKind!, $type: String!) { createUploadUrl(kind: $kind, contentType: $type) { key url } }',
    { kind, type: contentType },
  );
  return data.createUploadUrl;
}

export async function fileUrl(key: string) {
  const data = await gql<{ fileUrl: string }>('query ($key: String!) { fileUrl(key: $key) }', { key });
  return data.fileUrl;
}

export interface ReadingJob<R = unknown> {
  id: string;
  status: 'pending' | 'done' | 'failed';
  result: R | null;
  error: string | null;
}

export async function startReading(kind: FileKind, fileKeys: string[]) {
  const data = await gql<{ startReading: { id: string } }>('mutation ($kind: FileKind!, $keys: [String!]!) { startReading(kind: $kind, fileKeys: $keys) { id } }', {
    kind,
    keys: fileKeys,
  });
  return data.startReading.id;
}

export async function readingJob<R>(id: string): Promise<ReadingJob<R> | undefined> {
  const data = await gql<{ readingJob: (Omit<ReadingJob<R>, 'result'> & { result: string | null }) | null }>(
    'query ($id: ID!) { readingJob(id: $id) { id status result error } }',
    { id },
  );
  const j = data.readingJob;
  return j ? { ...j, result: j.result == null ? null : (JSON.parse(j.result) as R) } : undefined;
}

export async function deleteAccountOnServer() {
  await gql<{ deleteAccount: boolean }>('mutation { deleteAccount }');
}
