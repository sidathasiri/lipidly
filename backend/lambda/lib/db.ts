import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { BatchWriteCommand, DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, type QueryCommandOutput } from '@aws-sdk/lib-dynamodb';
import { applyRecords, emptyUserData, SK_PREFIX, type DataRecord, type RecordType, type UserData } from '@lipidly/domain';

/** One partition per user (PK = USER#<sub>); one item per record. */

export const TABLE = process.env.TABLE_NAME!;
export const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });

export const pk = (sub: string) => `USER#${sub}`;

/** Soft-deleted records stay for 30 days so every phone hears about the delete, then TTL purges them. */
const DELETE_TTL_SECONDS = 30 * 24 * 3600;

const RECORD_TYPES = new Set(Object.keys(SK_PREFIX));
const isRecord = (item: Record<string, unknown>) => RECORD_TYPES.has(item.type as string);

const toRecord = (item: Record<string, unknown>): DataRecord => ({
  sk: item.SK as string,
  type: item.type as RecordType,
  data: item.data ?? null,
  deleted: (item.deleted as boolean | undefined) ?? false,
  updatedAt: item.updatedAt as string,
});

/** Every item in a partition (records and jobs). */
export async function queryAll(sub: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let start: Record<string, unknown> | undefined;
  do {
    const page: QueryCommandOutput = await doc.send(
      new QueryCommand({ TableName: TABLE, KeyConditionExpression: 'PK = :pk', ExpressionAttributeValues: { ':pk': pk(sub) }, ExclusiveStartKey: start }),
    );
    items.push(...((page.Items ?? []) as Record<string, unknown>[]));
    start = page.LastEvaluatedKey;
  } while (start);
  return items;
}

/** The user's data rebuilt from their records, ready for a domain mutation. */
export async function loadUserData(sub: string): Promise<UserData> {
  const d = emptyUserData();
  const records = (await queryAll(sub)).filter(isRecord).map(toRecord);
  applyRecords(d, records);
  return d;
}

/** Records changed after `since`, a page at a time. */
export async function syncPage(sub: string, since: string | undefined, nextToken: string | undefined) {
  const out = await doc.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      FilterExpression: since ? 'updatedAt > :since' : undefined,
      ExpressionAttributeValues: since ? { ':pk': pk(sub), ':since': since } : { ':pk': pk(sub) },
      ExclusiveStartKey: nextToken ? JSON.parse(Buffer.from(nextToken, 'base64url').toString()) : undefined,
      Limit: 500,
    }),
  );
  return {
    records: ((out.Items ?? []) as Record<string, unknown>[]).filter(isRecord).map(toRecord),
    nextToken: out.LastEvaluatedKey ? Buffer.from(JSON.stringify(out.LastEvaluatedKey)).toString('base64url') : null,
  };
}

/** Writes records (25 per batch, retrying unprocessed ones). Returns them as stored. */
export async function writeRecords(sub: string, records: DataRecord[]): Promise<DataRecord[]> {
  const now = new Date().toISOString();
  const stored = records.map((r) => ({ ...r, data: r.deleted ? null : r.data, deleted: !!r.deleted, updatedAt: now }));
  const items = stored.map((r) => ({
    PK: pk(sub),
    SK: r.sk,
    type: r.type,
    data: r.data ?? undefined,
    deleted: r.deleted,
    updatedAt: now,
    expiresAt: r.deleted ? Math.floor(Date.now() / 1000) + DELETE_TTL_SECONDS : undefined,
  }));
  for (let i = 0; i < items.length; i += 25) {
    let pending: Record<string, unknown>[] | undefined = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
    for (let attempt = 0; pending?.length && attempt < 5; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
      const res = await doc.send(new BatchWriteCommand({ RequestItems: { [TABLE]: pending as never } }));
      pending = res.UnprocessedItems?.[TABLE] as Record<string, unknown>[] | undefined;
    }
    if (pending?.length) throw new Error('Could not save all changes. Please try again.');
  }
  return stored;
}

/** Deletes every item in a user's partition. */
export async function deletePartition(sub: string) {
  const items = await queryAll(sub);
  for (let i = 0; i < items.length; i += 25) {
    let pending: Record<string, unknown>[] | undefined = items.slice(i, i + 25).map((it) => ({ DeleteRequest: { Key: { PK: it.PK, SK: it.SK } } }));
    for (let attempt = 0; pending?.length && attempt < 5; attempt++) {
      if (attempt) await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
      const res = await doc.send(new BatchWriteCommand({ RequestItems: { [TABLE]: pending as never } }));
      pending = res.UnprocessedItems?.[TABLE] as Record<string, unknown>[] | undefined;
    }
  }
}

// ── Reading jobs ──────────────────────────────────────────────────────────────

export type JobStatus = 'pending' | 'done' | 'failed';

export interface Job {
  id: string;
  kind: 'report' | 'prescription';
  status: JobStatus;
  result?: unknown;
  error?: string;
}

const jobKey = (sub: string, id: string) => ({ PK: pk(sub), SK: `JOB#${id}` });

export async function putJob(sub: string, job: Job) {
  await doc.send(
    new PutCommand({
      TableName: TABLE,
      Item: { ...jobKey(sub, job.id), type: 'JOB', ...job, updatedAt: new Date().toISOString(), expiresAt: Math.floor(Date.now() / 1000) + 24 * 3600 },
    }),
  );
}

export async function getJob(sub: string, id: string): Promise<Job | undefined> {
  const out = await doc.send(new GetCommand({ TableName: TABLE, Key: jobKey(sub, id) }));
  if (!out.Item) return undefined;
  const { id: jobId, kind, status, result, error } = out.Item as Job;
  return { id: jobId, kind, status, result, error };
}
