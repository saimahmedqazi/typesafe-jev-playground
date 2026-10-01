/**
 * OpenAI Provider Execution Adapter.
 *
 * Implements structured outputs using OpenAI's `response_format: { type: 'json_schema', ... }`
 * with automatic backoff retry on 429/503 for fast evaluations and resilient markdown-fence JSON parsing.
 */

import { AtomicQuestion, EvaluationErrorCode, JevEvaluationError } from '../../core';
import { EvaluationPrompt, ProviderExecutionResult, PROVIDER_ENDPOINTS } from '../types';
import { getOpenAISchema } from '../schemas';

export interface OpenAIExecutionParams {
  apiKey: string;
  model: string;
  temperature?: number;
  question: AtomicQuestion;
  prompt: EvaluationPrompt;
  endpoint?: string;
  providerName?: string;
  fetchFn?: typeof fetch;
}

/**
 * Robust JSON extraction handling markdown fences, preambles, and malformed wrapper tokens.
 */
function extractAndParseJson(raw: string): unknown {
  const trimmed = raw.trim();
  // 1. Direct parse attempt
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue to fallback strategies
  }

  // 2. Extract from markdown code fence ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Extract outermost curly brackets { ... }
  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = trimmed.substring(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {
      // continue
    }
  }

  throw new Error(`Unable to extract valid JSON from model response text: ${trimmed.slice(0, 150)}`);
}

export async function executeOpenAI(params: OpenAIExecutionParams): Promise<ProviderExecutionResult> {
  const {
    apiKey,
    model,
    temperature = 0,
    question,
    prompt,
    endpoint = PROVIDER_ENDPOINTS.openai,
    providerName = 'OpenAI',
    fetchFn = fetch,
  } = params;

  const schemaFormat = getOpenAISchema(question);
  const isNativeOpenAI = endpoint === PROVIDER_ENDPOINTS.openai;
  // Standard strict json_schema for OpenAI; json_object for universal OpenAI-compatible engines (Groq, Ollama, vLLM)
  const responseFormat = isNativeOpenAI ? schemaFormat : { type: 'json_object' };

  const payload = {
    model,
    messages: [
      { role: 'system', content: prompt.systemPrompt },
      { role: 'user', content: prompt.userPrompt },
    ],
    response_format: responseFormat,
    temperature,
  };

  const MAX_RETRIES = 3;
  let lastResponse: Response | null = null;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchFn(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      lastResponse = response;

      // Handle transient rate limits (429) or temporary server unavailable (503)
      if ((response.status === 429 || response.status === 503) && attempt < MAX_RETRIES) {
        let delayMs = attempt === 0 ? 1200 : attempt === 1 ? 2500 : 4000;
        const retryAfterHeader = response.headers.get('retry-after');
        const resetTokensHeader = response.headers.get('x-ratelimit-reset-tokens');
        const resetRequestsHeader = response.headers.get('x-ratelimit-reset-requests');

        let waitSec = 0;
        if (retryAfterHeader) {
          waitSec = parseFloat(retryAfterHeader);
        } else if (resetTokensHeader) {
          waitSec = parseFloat(resetTokensHeader.replace(/[^\d.]/g, ''));
        } else if (resetRequestsHeader) {
          waitSec = parseFloat(resetRequestsHeader.replace(/[^\d.]/g, ''));
        }

        if (!isNaN(waitSec) && waitSec > 0) {
          delayMs = Math.min(Math.round(waitSec * 1000) + 300, 6000);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      break;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
        continue;
      }
      throw new JevEvaluationError(
        EvaluationErrorCode.PROVIDER_ERROR,
        `Failed to connect to ${providerName} endpoint: ${lastError.message}`,
        502
      );
    }
  }

  if (!lastResponse) {
    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `Failed to connect to ${providerName} endpoint: ${lastError?.message || 'Unknown network error'}`,
      502
    );
  }

  const response = lastResponse;

  if (!response.ok) {
    let errorBody = '';
    try {
      errorBody = await response.text();
    } catch {
      // ignore
    }

    if (response.status === 401 || response.status === 403) {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_CREDENTIAL,
        `${providerName} authentication failed: Invalid or expired API key.`,
        response.status
      );
    }

    if (response.status === 429) {
      const resetTokens = response.headers.get('x-ratelimit-reset-tokens');
      const waitHint = resetTokens ? ` (resets in ${resetTokens})` : '';
      throw new JevEvaluationError(
        EvaluationErrorCode.RATE_LIMITED,
        `${providerName} rate limit or usage quota exceeded${waitHint}. Please wait a moment before evaluating.`,
        429
      );
    }

    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `${providerName} returned error status ${response.status}: ${errorBody.slice(0, 200)}`,
      response.status
    );
  }

  const data = await response.json();
  const rawText = data?.choices?.[0]?.message?.content;

  if (!rawText || typeof rawText !== 'string') {
    throw new JevEvaluationError(
      EvaluationErrorCode.INVALID_MODEL_OUTPUT,
      `${providerName} did not return text content in choices[0].message.content`,
      422
    );
  }

  let parsed: unknown;
  try {
    parsed = extractAndParseJson(rawText);
  } catch (err) {
    throw new JevEvaluationError(
      EvaluationErrorCode.INVALID_MODEL_OUTPUT,
      `Failed to parse JSON output from ${providerName}: ${err instanceof Error ? err.message : String(err)}`,
      422
    );
  }

  return {
    rawResult: parsed,
    rawResponseText: rawText,
    tokenUsage: {
      promptTokens: data?.usage?.prompt_tokens,
      completionTokens: data?.usage?.completion_tokens,
      totalTokens: data?.usage?.total_tokens,
    },
  };
}
