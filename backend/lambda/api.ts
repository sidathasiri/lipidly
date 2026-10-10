import { randomUUID } from 'node:crypto';
import { AdminDeleteUserCommand, CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { InvokeCommand, LambdaClient } from '@aws-sdk/client-lambda';
import { DeleteObjectsCommand, GetObjectCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  applyPlanAction,
  clone,
  CLIENT_WRITABLE,
  confirmPrescription,
  confirmReport,
  diffRecords,
  saveProfile,
  skMatchesType,
  type ConfirmedValues,
  type DataRecord,
  type DraftReport,
  type ExtractedPrescription,
  type PlanAction,
  type RecordType,
  type UserData,
  type UserProfile,
} from '@lipidly/domain';
import type { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda';
import { deletePartition, getJob, loadUserData, putJob, syncPage, writeRecords } from './lib/db';

/**
 * The API Lambda: one function for every AppSync field except ping, routed by field name.
 * Server-decided changes follow one pattern: load the user's records, apply the same domain
 * mutation the phone ran, write the records that changed and return them.
 */

const s3 = new S3Client({});
const lambda = new LambdaClient({});
const cognito = new CognitoIdentityProviderClient({});
const BUCKET = process.env.BUCKET_NAME!;

type Args = Record<string, unknown>;
type FileKind = 'report' | 'prescription';

const CONTENT_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' };
const MAX_FILES = 6;

/** AWSJSON arguments arrive as strings or as already-parsed values. */
const json = <T>(v: unknown): T => (typeof v === 'string' ? JSON.parse(v) : v) as T;


class UserError extends Error {}

/** Applies a domain mutation to the user's stored data and saves what changed. */
async function mutate<T>(sub: string, change: (d: UserData) => T) {
  const before = await loadUserData(sub);
  const after = clone(before);
  const info = change(after);
  const { puts, deletes } = diffRecords(before, after);
  const records = await writeRecords(sub, [...puts, ...deletes]);
  return { records, info: info ?? null };
}

const userPrefix = (sub: string) => `users/${sub}/`;

function checkKeys(sub: string, kind: FileKind, keys: string[]) {
  if (!keys.length || keys.length > MAX_FILES) throw new UserError(`Add between 1 and ${MAX_FILES} files.`);
  for (const k of keys) if (!k.startsWith(`${userPrefix(sub)}${kind}s/`)) throw new UserError('Unknown file.');
}

async function putRecords(sub: string, input: { sk: string; type: string; data?: unknown; deleted?: boolean }[]) {
  if (input.length > 200) throw new UserError('Too many changes at once.');
  const records: DataRecord[] = input.map((r) => {
    const type = r.type as RecordType;
    if (!CLIENT_WRITABLE.has(type) || !skMatchesType(r.sk, type)) throw new UserError(`Not allowed: ${r.type} ${r.sk}`);
    return { sk: r.sk, type, data: r.deleted ? null : json(r.data), deleted: !!r.deleted };
  });
  return writeRecords(sub, records);
}

async function deleteFiles(sub: string) {
  let token: string | undefined;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: userPrefix(sub), ContinuationToken: token }));
    const objects = (page.Contents ?? []).map((o) => ({ Key: o.Key! }));
    if (objects.length) await s3.send(new DeleteObjectsCommand({ Bucket: BUCKET, Delete: { Objects: objects, Quiet: true } }));
    token = page.NextContinuationToken;
  } while (token);
}

async function route(field: string, a: Args, identity: AppSyncIdentityCognito) {
  const sub = identity.sub;
  const today = a.today as string;
  switch (field) {
    case 'sync': {
      return syncPage(sub, (a.since as string) || undefined, (a.nextToken as string) || undefined);
    }
    case 'putRecords':
      return putRecords(sub, a.records as never);
    case 'saveProfile':
      return mutate(sub, (d) => saveProfile(d, json<UserProfile>(a.profile), today));
    case 'planAction':
      return mutate(sub, (d) => applyPlanAction(d, json<PlanAction>(a.action), today));
    case 'confirmReport':
      return mutate(sub, (d) => {
        const draft = json<DraftReport>(a.draft);
        if (draft.fileKeys) checkKeys(sub, 'report', draft.fileKeys);
        return confirmReport(d, draft, json<ConfirmedValues>(a.edited), today, new Date().toISOString());
      });
    case 'confirmPrescription':
      return mutate(sub, (d) => {
        const rx = json<ExtractedPrescription>(a.prescription);
        if (rx.fileKeys) checkKeys(sub, 'prescription', rx.fileKeys);
        confirmPrescription(d, rx, today, new Date().toISOString());
      });
    case 'createUploadUrl': {
      const kind = a.kind as FileKind;
      const contentType = a.contentType as string;
      const ext = CONTENT_TYPES[contentType];
      if (!ext) throw new UserError('Only JPEG, PNG and PDF files can be uploaded.');
      const key = `${userPrefix(sub)}${kind}s/${randomUUID()}.${ext}`;
      const url = await getSignedUrl(s3, new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), { expiresIn: 300 });
      return { key, url };
    }
    case 'fileUrl': {
      const key = a.key as string;
      if (!key.startsWith(userPrefix(sub))) throw new UserError('Unknown file.');
      return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), { expiresIn: 300 });
    }
    case 'startReading': {
      const kind = a.kind as FileKind;
      const fileKeys = a.fileKeys as string[];
      checkKeys(sub, kind, fileKeys);
      const job = { id: randomUUID(), kind, status: 'pending' as const };
      await putJob(sub, job);
      await lambda.send(
        new InvokeCommand({ FunctionName: process.env.READER_FUNCTION!, InvocationType: 'Event', Payload: JSON.stringify({ sub, jobId: job.id, kind, fileKeys }) }),
      );
      return { ...job, result: null, error: null };
    }
    case 'readingJob': {
      const job = await getJob(sub, a.id as string);
      return job ? { ...job, result: job.result ?? null, error: job.error ?? null } : null;
    }
    case 'deleteAccount':
      await deletePartition(sub);
      await deleteFiles(sub);
      await cognito.send(new AdminDeleteUserCommand({ UserPoolId: process.env.USER_POOL_ID!, Username: identity.username }));
      return true;
    default:
      throw new Error(`Unknown field ${field}`);
  }
}

export async function handler(event: AppSyncResolverEvent<Args>) {
  const identity = event.identity as AppSyncIdentityCognito;
  try {
    return await route(event.info.fieldName, event.arguments, identity);
  } catch (e) {
    // User-facing messages pass through; anything else is logged without arguments (no health data in logs).
    if (e instanceof UserError) throw e;
    console.error(event.info.fieldName, e instanceof Error ? e.stack : e);
    throw new Error('Something went wrong. Please try again.');
  }
}
