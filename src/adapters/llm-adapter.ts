/**
 * LLM Practice Execution Adapter.
 *
 * Coordinates prompt compilation, provider sub-adapter dispatch, output normalization,
 * and strict credential redaction for LLM Practice Mode.
 */

import {
  AtomicQuestion,
  EvaluationContext,
  EvaluationErrorCode,
  EvaluationResponse,
  ExecutionMode,
  JevEvaluationError,
  JevResult,
  LLMUserCredentials,
  NoulResult,
  ScoreResult,
  UserCredentials,
} from '../core';
import { defaultQuestionRegistry } from '../registry';
import { IQuestionRegistry } from '../registry/types';
import { ExecutionAdapter, LLMProvider, ProviderExecutionResult, PROVIDER_DEFAULT_MODELS } from './types';
import { buildEvaluationPrompt } from './prompt';
import { executeOpenAI } from './providers/openai';
import { executeAnthropic } from './providers/anthropic';
import { executeGemini } from './providers/gemini';

export interface LLMExecutionAdapterOptions {
  registry?: IQuestionRegistry;
  fetchFn?: typeof fetch;
}

export class LLMExecutionAdapter implements ExecutionAdapter {
  public readonly id = 'llm-practice-adapter';
  public readonly name = 'LLM Practice Execution Adapter';

  private readonly registry: IQuestionRegistry;
  private readonly fetchFn?: typeof fetch;

  constructor(options: LLMExecutionAdapterOptions = {}) {
    this.registry = options.registry ?? defaultQuestionRegistry;
    this.fetchFn = options.fetchFn;
  }

  public supportsMode(mode: ExecutionMode): boolean {
    return mode === 'llm-practice';
  }

  public async execute(
    context: EvaluationContext,
    credentials?: LLMUserCredentials | UserCredentials
  ): Promise<EvaluationResponse> {
    const startTime = Date.now();
    let apiKey: string | undefined;

    try {
      // 1. Validate Execution Mode
      if (!this.supportsMode(context.mode)) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNSUPPORTED_MODE,
          `LLMExecutionAdapter cannot execute mode '${context.mode}'. Only 'llm-practice' is supported.`,
          400
        );
      }

      // 2. Validate Ephemeral Credentials
      apiKey = this.extractApiKey(credentials);
      if (!apiKey || apiKey.trim() === '') {
        throw new JevEvaluationError(
          EvaluationErrorCode.MISSING_CREDENTIAL,
          'Missing required API key for LLM Practice execution. Please provide an ephemeral API key.',
          401
        );
      }

      // 3. Resolve Atomic Question from Registry
      const question = this.registry.get(context.questionId);
      if (!question) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNKNOWN_QUESTION,
          `Atomic question '${context.questionId}' is not registered.`,
          404
        );
      }

      // 4. Validate State against Question
      const stateValidation = question.validateState(context.state);
      if (!stateValidation.valid) {
        throw new JevEvaluationError(
          EvaluationErrorCode.INVALID_STATE,
          `State validation failed for question '${question.id}': ${(stateValidation.errors || []).join('; ')}`,
          400,
          { errors: stateValidation.errors }
        );
      }

      // 5. Resolve Model Configuration
      const rawProvider = (context.modelConfig?.provider || 'openai').toLowerCase();
      if (rawProvider !== 'openai' && rawProvider !== 'anthropic' && rawProvider !== 'gemini') {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNSUPPORTED_PROVIDER,
          `Unsupported LLM provider '${rawProvider}'. Supported providers: openai, anthropic, gemini.`,
          400
        );
      }
      const provider = rawProvider as LLMProvider;
      const model = context.modelConfig?.model || PROVIDER_DEFAULT_MODELS[provider];
      const temperature = context.modelConfig?.temperature ?? 0;

      // 6. Build JEV Evaluation Prompt
      const prompt = buildEvaluationPrompt(question, context.state);

      // 7. Dispatch to Provider Sub-Adapter
      const executionResult = await this.dispatchProvider({
        provider,
        apiKey,
        model,
        temperature,
        question,
        prompt,
      });

      // 8. Normalize Output to JEV Typed Result
      const result = this.normalizeResult(question, executionResult.rawResult);
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        result,
        metadata: {
          durationMs,
          requestId: `eval_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          mode: 'llm-practice',
          provider,
          model,
          tokenUsage: executionResult.tokenUsage,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (err) {
      const evaluationError = this.sanitizeAndWrapError(err, apiKey);
      return {
        success: false,
        error: evaluationError.toJSON(),
      };
    }
  }

  private extractApiKey(credentials?: LLMUserCredentials | UserCredentials): string | undefined {
    if (!credentials) return undefined;
    if ('apiKey' in credentials && typeof credentials.apiKey === 'string') {
      return credentials.apiKey;
    }
    if ('credentials' in credentials && credentials.credentials && typeof credentials.credentials.apiKey === 'string') {
      return credentials.credentials.apiKey;
    }
    return undefined;
  }

  private async dispatchProvider(params: {
    provider: LLMProvider;
    apiKey: string;
    model: string;
    temperature: number;
    question: AtomicQuestion;
    prompt: ReturnType<typeof buildEvaluationPrompt>;
  }): Promise<ProviderExecutionResult> {
    const { provider, apiKey, model, temperature, question, prompt } = params;

    switch (provider) {
      case 'openai':
        return executeOpenAI({
          apiKey,
          model,
          temperature,
          question,
          prompt,
          fetchFn: this.fetchFn,
        });

      case 'anthropic':
        return executeAnthropic({
          apiKey,
          model,
          temperature,
          question,
          prompt,
          fetchFn: this.fetchFn,
        });

      case 'gemini':
        return executeGemini({
          apiKey,
          model,
          temperature,
          question,
          prompt,
          fetchFn: this.fetchFn,
        });
    }
  }

  private normalizeResult(question: AtomicQuestion, raw: unknown): JevResult {
    if (!raw || typeof raw !== 'object') {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_MODEL_OUTPUT,
        'Evaluation engine received non-object output from LLM',
        422,
        { raw }
      );
    }

    const rawObj = raw as Record<string, unknown>;

    if (question.type === 'noul') {
      const value = typeof rawObj.value === 'boolean' ? rawObj.value : Boolean(rawObj.value);
      const confidence = typeof rawObj.confidence === 'number' ? Math.max(0, Math.min(1, rawObj.confidence)) : undefined;
      const explanation = typeof rawObj.rationale === 'string' ? rawObj.rationale : undefined;

      const noulResult: NoulResult = {
        type: 'noul',
        value,
        confidence,
        explanation,
        rawOutput: raw,
      };
      return noulResult;
    }

    // Score Primitive
    const num = typeof rawObj.value === 'number' ? rawObj.value : Number(rawObj.value);
    if (isNaN(num)) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RESULT_VALIDATION_FAILED,
        `Expected numeric score value from evaluation, got: ${String(rawObj.value)}`,
        422,
        { raw }
      );
    }

    const clampedValue = Math.max(0, Math.min(1, num));
    const explanation = typeof rawObj.rationale === 'string' ? rawObj.rationale : undefined;

    const scoreResult: ScoreResult = {
      type: 'score',
      value: clampedValue,
      range: [0, 1],
      explanation,
      rawOutput: raw,
    };
    return scoreResult;
  }

  private sanitizeAndWrapError(err: unknown, apiKey?: string): JevEvaluationError {
    if (err instanceof JevEvaluationError) {
      if (apiKey && apiKey.length > 5) {
        const scrubbedMessage = err.message.replaceAll(apiKey, '[REDACTED_KEY]');
        return new JevEvaluationError(err.code, scrubbedMessage, err.statusCode, err.details);
      }
      return err;
    }

    const rawMessage = err instanceof Error ? err.message : String(err);
    const safeMessage = (apiKey && apiKey.length > 5 ? rawMessage.replaceAll(apiKey, '[REDACTED_KEY]') : rawMessage) || 'Unexpected execution failure';

    return new JevEvaluationError(
      EvaluationErrorCode.INTERNAL_ERROR,
      safeMessage,
      500
    );
  }
}
