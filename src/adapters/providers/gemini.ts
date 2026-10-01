/**
 * Google Gemini Provider Execution Adapter.
 *
 * Implements structured outputs using Gemini's REST API with `responseMimeType: 'application/json'`
 * and `responseSchema`.
 */

import { AtomicQuestion, EvaluationErrorCode, JevEvaluationError } from '../../core';
import { EvaluationPrompt, ProviderExecutionResult, PROVIDER_ENDPOINTS } from '../types';
import { getGeminiSchema } from '../schemas';

export interface GeminiExecutionParams {
  apiKey: string;
  model: string;
  temperature?: number;
  question: AtomicQuestion;
  prompt: EvaluationPrompt;
  fetchFn?: typeof fetch;
}

export async function executeGemini(params: GeminiExecutionParams): Promise<ProviderExecutionResult> {
  const { apiKey, model, temperature = 0, question, prompt, fetchFn = fetch } = params;

  const responseSchema = getGeminiSchema(question);

  const payload = {
    systemInstruction: {
      parts: [{ text: prompt.systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt.userPrompt }],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema,
      temperature,
    },
  };

  const targetUrl = `${PROVIDER_ENDPOINTS.gemini}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  let response: Response;
  try {
    response = await fetchFn(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Ensure API key is stripped from any error message or stack
    const safeMsg = (err instanceof Error ? err.message : String(err)).replaceAll(apiKey, '[REDACTED_KEY]');
    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `Failed to connect to Gemini endpoint: ${safeMsg}`,
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
    const safeErrorBody = errorBody.replaceAll(apiKey, '[REDACTED_KEY]').slice(0, 200);

    if (response.status === 400 && safeErrorBody.toLowerCase().includes('api_key')) {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_CREDENTIAL,
        'Gemini authentication failed: Invalid or malformed API key.',
        401
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_CREDENTIAL,
        'Gemini authentication failed: Unauthorized or invalid API key.',
        response.status
      );
    }

    if (response.status === 429) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RATE_LIMITED,
        'Gemini rate limit or quota exceeded.',
        429
      );
    }

    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `Gemini returned error status ${response.status}: ${safeErrorBody}`,
      response.status
    );
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText || typeof rawText !== 'string') {
    throw new JevEvaluationError(
      EvaluationErrorCode.INVALID_MODEL_OUTPUT,
      'Gemini did not return text content in candidates[0].content.parts[0].text',
      422
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new JevEvaluationError(
      EvaluationErrorCode.INVALID_MODEL_OUTPUT,
      `Failed to parse JSON output from Gemini: ${err instanceof Error ? err.message : String(err)}`,
      422
    );
  }

  return {
    rawResult: parsed,
    rawResponseText: rawText,
    tokenUsage: {
      promptTokens: data?.usageMetadata?.promptTokenCount,
      completionTokens: data?.usageMetadata?.candidatesTokenCount,
      totalTokens: data?.usageMetadata?.totalTokenCount,
    },
  };
}
