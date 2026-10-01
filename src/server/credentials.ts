/**
 * Server Ephemeral Credential Extraction.
 *
 * Extracts BYO user credentials from incoming HTTP request headers.
 * All credentials are held strictly in memory for the duration of the request.
 */

import { IncomingHttpHeaders } from 'http';
import {
  HEADER_USER_LLM_KEY,
  HEADER_USER_LLM_PROVIDER,
  HEADER_USER_LLM_ENDPOINT,
  HEADER_USER_JEV_KEY,
  HEADER_USER_JEV_ORG,
  LLMProviderType,
  UserCredentials,
} from '../core';

export interface ExtractedCredentials {
  llm?: {
    apiKey: string;
    provider: LLMProviderType;
    endpoint?: string;
  };
  nativeJev?: {
    apiKey: string;
    organizationId?: string;
  };
}

/**
 * Extracts ephemeral user credentials from HTTP headers.
 */
export function extractEphemeralCredentials(
  headers: IncomingHttpHeaders | Record<string, string | string[] | undefined>
): UserCredentials | undefined {
  const getHeader = (key: string): string | undefined => {
    const val = headers[key.toLowerCase()];
    if (Array.isArray(val)) {
      return val[0]?.trim();
    }
    return typeof val === 'string' ? val.trim() : undefined;
  };

  const llmKey = getHeader(HEADER_USER_LLM_KEY);
  const rawProvider = getHeader(HEADER_USER_LLM_PROVIDER)?.toLowerCase();
  const llmEndpoint = getHeader(HEADER_USER_LLM_ENDPOINT);

  const jevKey = getHeader(HEADER_USER_JEV_KEY);
  const jevOrg = getHeader(HEADER_USER_JEV_ORG);

  // Fallback: Authorization header (Bearer sk-...) for LLM Practice
  const authHeader = getHeader('authorization');
  let bearerKey: string | undefined;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    bearerKey = authHeader.slice(7).trim();
  }

  const effectiveLlmKey = llmKey || bearerKey;

  if (effectiveLlmKey && effectiveLlmKey !== '') {
    const validProviders: LLMProviderType[] = ['openai', 'anthropic', 'gemini'];
    const provider: LLMProviderType = validProviders.includes(rawProvider as LLMProviderType)
      ? (rawProvider as LLMProviderType)
      : 'openai';

    return {
      mode: 'llm-practice',
      credentials: {
        apiKey: effectiveLlmKey,
        provider,
        endpoint: llmEndpoint,
      },
    };
  }

  if (jevKey && jevKey !== '') {
    return {
      mode: 'native-jev',
      credentials: {
        apiKey: jevKey,
        organizationId: jevOrg,
      },
    };
  }

  return undefined;
}
