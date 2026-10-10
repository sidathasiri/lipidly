import { Sha256 } from '@aws-crypto/sha256-js';
import { defaultProvider } from '@aws-sdk/credential-provider-node';
import { SignatureV4 } from '@smithy/signature-v4';

/**
 * Chat Completions on Bedrock's OpenAI-compatible endpoint (bedrock-mantle), signed with the
 * Lambda role's credentials (IAM action bedrock-mantle:CreateInference).
 */

const REGION = process.env.AWS_REGION ?? 'us-east-1';
const HOST = `bedrock-mantle.${REGION}.api.aws`;
const signer = new SignatureV4({ service: 'bedrock-mantle', region: REGION, credentials: defaultProvider(), sha256: Sha256 });

export type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export interface ChatRequest {
  model: string;
  max_tokens: number;
  temperature?: number;
  messages: { role: 'system' | 'user'; content: string | ContentPart[] }[];
  response_format?: { type: 'json_schema'; json_schema: { name: string; strict: boolean; schema: object } };
}

interface ChatResponse {
  choices?: { finish_reason: string; message: { content: string | null; refusal?: string | null } }[];
  error?: { message: string };
}

export async function chat(req: ChatRequest): Promise<{ text: string; finishReason: string }> {
  const body = JSON.stringify(req);
  const signed = await signer.sign({
    method: 'POST',
    protocol: 'https:',
    hostname: HOST,
    path: '/v1/chat/completions',
    headers: { host: HOST, 'content-type': 'application/json' },
    body,
  });
  const res = await fetch(`https://${HOST}/v1/chat/completions`, { method: 'POST', headers: signed.headers as Record<string, string>, body });
  const data = (await res.json()) as ChatResponse;
  const choice = data.choices?.[0];
  if (!res.ok || !choice) throw new Error(`model call failed (${res.status}): ${data.error?.message ?? 'no choices'}`);
  if (choice.message.refusal) return { text: '', finishReason: 'refusal' };
  return { text: choice.message.content ?? '', finishReason: choice.finish_reason };
}
