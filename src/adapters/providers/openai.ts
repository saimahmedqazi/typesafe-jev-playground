/**
 * OpenAI Provider Execution Adapter.
 *
 * Implements structured outputs using OpenAI's `response_format: { type: 'json_schema', ... }`.
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

  let response: Response;
  try {
    response = await fetchFn(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `Failed to connect to ${providerName} endpoint: ${err instanceof Error ? err.message : String(err)}`,
      502
    );
  }

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
      throw new JevEvaluationError(
        EvaluationErrorCode.RATE_LIMITED,
        `${providerName} rate limit or usage quota exceeded.`,
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
      'OpenAI did not return text content in choices[0].message.content',
      422
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new JevEvaluationError(
      EvaluationErrorCode.INVALID_MODEL_OUTPUT,
      `Failed to parse JSON output from OpenAI: ${err instanceof Error ? err.message : String(err)}`,
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
