/**
 * Ephemeral Credential Contracts & Sanitization.
 *
 * Implements the Bring-Your-Own-Key (BYOK) architecture:
 * - Credentials exist in memory only during request execution
 * - Never stored on disk or in databases
 * - Never logged or included in trace outputs
 * - Strictly rejects application-owner key fallbacks
 */

import { ExecutionMode } from './modes';

export type LLMProviderType = 'openai' | 'anthropic' | 'gemini' | 'groq' | 'custom';

export interface LLMUserCredentials {
  apiKey: string;
  provider: LLMProviderType;
  endpoint?: string;
}

export interface NativeJevCredentials {
  apiKey: string;
  organizationId?: string;
  baseUrl?: string;
}

export type UserCredentials =
  | { mode: 'llm-practice'; credentials: LLMUserCredentials }
  | { mode: 'native-jev'; credentials: NativeJevCredentials };

// Standard request header keys for ephemeral credential transmission
export const HEADER_USER_LLM_KEY = 'x-user-llm-key';
export const HEADER_USER_LLM_PROVIDER = 'x-user-llm-provider';
export const HEADER_USER_LLM_ENDPOINT = 'x-user-llm-endpoint';
export const HEADER_USER_JEV_KEY = 'x-user-jev-key';
export const HEADER_USER_JEV_ORG = 'x-user-jev-org';

const SENSITIVE_HEADER_KEYS = new Set([
  HEADER_USER_LLM_KEY,
  HEADER_USER_JEV_KEY,
  'authorization',
  'x-api-key',
  'api-key',
  'apikey',
]);

/**
 * Redacts or masks an API key so it is safe to display in preview or logs.
 * Example: "sk-proj-1234567890abcdef" -> "sk-...cdef"
 */
export function sanitizeSecret(secret?: string | null): string {
  if (!secret || typeof secret !== 'string') {
    return '[REDACTED]';
  }
  const trimmed = secret.trim();
  if (trimmed.length <= 8) {
    return '[REDACTED]';
  }
  const prefix = trimmed.slice(0, 3);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

/**
 * Strips all sensitive credential headers from a headers map before logging or tracing.
 */
export function sanitizeHeaders(
  headers: Record<string, string | string[] | undefined>
): Record<string, string | string[] | undefined> {
  const sanitized: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_HEADER_KEYS.has(lower) || lower.includes('key') || lower.includes('secret') || lower.includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

/**
 * Extracts ephemeral credentials from HTTP request headers based on the active mode.
 */
export function extractEphemeralCredentials(
  headers: Record<string, string | string[] | undefined>,
  mode: ExecutionMode
): LLMUserCredentials | NativeJevCredentials | null {
  const getHeader = (name: string): string | undefined => {
    const val = headers[name] || headers[name.toLowerCase()];
    if (Array.isArray(val)) return val[0];
    return val;
  };

  if (mode === 'llm-practice') {
    const apiKey = getHeader(HEADER_USER_LLM_KEY) || getHeader('authorization')?.replace(/^Bearer\s+/i, '');
    const provider = (getHeader(HEADER_USER_LLM_PROVIDER) || 'openai') as LLMProviderType;
    const endpoint = getHeader(HEADER_USER_LLM_ENDPOINT);

    if (!apiKey) return null;
    return {
      apiKey: apiKey.trim(),
      provider,
      endpoint: endpoint ? endpoint.trim() : undefined,
    };
  }

  if (mode === 'native-jev') {
    const apiKey = getHeader(HEADER_USER_JEV_KEY) || getHeader('authorization')?.replace(/^Bearer\s+/i, '');
    const organizationId = getHeader(HEADER_USER_JEV_ORG);

    if (!apiKey) return null;
    return {
      apiKey: apiKey.trim(),
      organizationId: organizationId ? organizationId.trim() : undefined,
    };
  }

  return null;
}

/**
 * Invariant guard asserting that no central owner key fallback exists.
 * Any public request lacking a user key must be rejected, not silently billed to repository owners.
 */
export function assertNoMaintainerFallback(hasUserCredentials: boolean): void {
  if (!hasUserCredentials) {
    throw new Error(
      'MISSING_CREDENTIAL: No user credentials provided. Repository owner fallback keys are strictly disabled by policy.'
    );
  }
}
