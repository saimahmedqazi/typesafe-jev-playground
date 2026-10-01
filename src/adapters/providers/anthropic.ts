/**
 * Anthropic Provider Execution Adapter.
 *
 * Implements structured outputs using Anthropic's tool use mechanism (`tool_choice: { type: 'tool', name: ... }`).
 */

import { AtomicQuestion, EvaluationErrorCode, JevEvaluationError } from '../../core';
import { EvaluationPrompt, ProviderExecutionResult, PROVIDER_ENDPOINTS } from '../types';
import { getAnthropicTool } from '../schemas';

export interface AnthropicExecutionParams {
  apiKey: string;
  model: string;
  temperature?: number;
  question: AtomicQuestion;
  prompt: EvaluationPrompt;
  fetchFn?: typeof fetch;
}

export async function executeAnthropic(params: AnthropicExecutionParams): Promise<ProviderExecutionResult> {
  const { apiKey, model, temperature = 0, question, prompt, fetchFn = fetch } = params;

  const tool = getAnthropicTool(question);

  const payload = {
    model,
    max_tokens: 1024,
    system: prompt.systemPrompt,
    messages: [{ role: 'user', content: prompt.userPrompt }],
    tools: [tool],
    tool_choice: { type: 'tool', name: tool.name },
    temperature,
  };

  let response: Response;
  try {
    response = await fetchFn(PROVIDER_ENDPOINTS.anthropic, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `Failed to connect to Anthropic endpoint: ${err instanceof Error ? err.message : String(err)}`,
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
        'Anthropic authentication failed: Invalid or expired API key.',
        response.status
      );
    }

    if (response.status === 429) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RATE_LIMITED,
        'Anthropic rate limit or concurrency limit exceeded.',
        429
      );
    }

    throw new JevEvaluationError(
      EvaluationErrorCode.PROVIDER_ERROR,
      `Anthropic returned error status ${response.status}: ${errorBody.slice(0, 200)}`,
      response.status
    );
  }

  const data = await response.json();
  const contentBlocks = data?.content;

  if (!Array.isArray(contentBlocks)) {
    throw new JevEvaluationError(
      EvaluationErrorCode.INVALID_MODEL_OUTPUT,
      'Anthropic response missing content array',
      422
    );
  }

  // Look for tool_use block first
  const toolBlock = contentBlocks.find((b: { type?: string }) => b.type === 'tool_use');
  let rawResult: unknown;
  let rawText = '';

  if (toolBlock && toolBlock.input) {
    rawResult = toolBlock.input;
    rawText = JSON.stringify(toolBlock.input);
  } else {
    // Fallback to text block parsing
    const textBlock = contentBlocks.find((b: { type?: string; text?: string }) => b.type === 'text');
    if (textBlock && textBlock.text) {
      rawText = textBlock.text;
      try {
        rawResult = JSON.parse(textBlock.text);
      } catch (err) {
        throw new JevEvaluationError(
          EvaluationErrorCode.INVALID_MODEL_OUTPUT,
          `Failed to parse JSON from Anthropic text response: ${err instanceof Error ? err.message : String(err)}`,
          422
        );
      }
    } else {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_MODEL_OUTPUT,
        'Anthropic response contained neither tool_use block nor parseable text',
        422
      );
    }
  }

  const inputTokens = data?.usage?.input_tokens;
  const outputTokens = data?.usage?.output_tokens;
  const totalTokens = (typeof inputTokens === 'number' && typeof outputTokens === 'number')
    ? inputTokens + outputTokens
    : undefined;

  return {
    rawResult,
    rawResponseText: rawText,
    tokenUsage: {
      promptTokens: inputTokens,
      completionTokens: outputTokens,
      totalTokens,
    },
  };
}
