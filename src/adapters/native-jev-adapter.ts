/**
 * Native Jev Execution Adapter.
 *
 * Implements direct execution against official Jev infrastructure using authorized
 * user Jev credentials.
 */

import {
  AtomicQuestion,
  EvaluationContext,
  EvaluationErrorCode,
  EvaluationResponse,
  ExecutionMode,
  JevEvaluationError,
  JevResult,
  NativeJevCredentials,
  NoulResult,
  ScoreResult,
  UserCredentials,
} from '../core';
import { defaultQuestionRegistry } from '../registry';
import { IQuestionRegistry } from '../registry/types';
import { ExecutionAdapter } from './types';

export const DEFAULT_NATIVE_JEV_ENDPOINT = 'https://api.jev.ai/v1/evaluate';

export interface NativeJevAdapterOptions {
  registry?: IQuestionRegistry;
  fetchFn?: typeof fetch;
  endpoint?: string;
}

export class NativeJevExecutionAdapter implements ExecutionAdapter {
  public readonly id = 'native-jev-adapter';
  public readonly name = 'Native Jev Execution Adapter';

  private readonly registry: IQuestionRegistry;
  private readonly fetchFnOverride?: typeof fetch;
  private readonly endpoint: string;

  constructor(options: NativeJevAdapterOptions = {}) {
    this.registry = options.registry ?? defaultQuestionRegistry;
    this.fetchFnOverride = options.fetchFn;
    this.endpoint = options.endpoint ?? DEFAULT_NATIVE_JEV_ENDPOINT;
  }

  public supportsMode(mode: ExecutionMode): boolean {
    return mode === 'native-jev';
  }

  public async execute(
    context: EvaluationContext,
    credentials?: NativeJevCredentials | UserCredentials
  ): Promise<EvaluationResponse> {
    const startTime = Date.now();
    let apiKey: string | undefined;

    try {
      // 1. Verify Mode
      if (!this.supportsMode(context.mode)) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNSUPPORTED_MODE,
          `NativeJevExecutionAdapter cannot execute mode '${context.mode}'. Only 'native-jev' is supported.`,
          400
        );
      }

      // 2. Verify Native Credentials
      const creds = this.extractNativeCredentials(credentials);
      apiKey = creds.apiKey;

      if (!apiKey || apiKey.trim() === '') {
        throw new JevEvaluationError(
          EvaluationErrorCode.MISSING_CREDENTIAL,
          'Missing required Native Jev API key. To execute in Native Jev Mode, provide your Jev API key via the x-user-jev-key header, or switch to LLM Practice Mode to practice without a Jev license.',
          401
        );
      }

      // 3. Resolve Atomic Question
      const resolvedQId = context.questionId || (context.questions ? Object.keys(context.questions)[0] : undefined);
      if (!resolvedQId) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNKNOWN_QUESTION,
          'No atomic question specified for evaluation.',
          400
        );
      }
      const question = this.registry.get(resolvedQId);
      if (!question) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNKNOWN_QUESTION,
          `Atomic question '${resolvedQId}' is not registered.`,
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

      // 5. Dispatch Directly to Native Jev Infrastructure
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };

      if (creds.organizationId) {
        headers['x-jev-organization'] = creds.organizationId;
      }

      const payload = {
        questionId: context.questionId,
        questionType: context.questionType,
        state: context.state,
      };

      let response: Response;
      const fetchFunction = this.fetchFnOverride ?? fetch;
      try {
        response = await fetchFunction(this.endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });
      } catch (err) {
        const safeMsg = (err instanceof Error ? err.message : String(err)).replaceAll(apiKey, '[REDACTED_KEY]');
        throw new JevEvaluationError(
          EvaluationErrorCode.PROVIDER_ERROR,
          `Failed to connect to Native Jev infrastructure endpoint: ${safeMsg}`,
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
        const safeBody = errorBody.replaceAll(apiKey, '[REDACTED_KEY]').slice(0, 200);

        if (response.status === 401 || response.status === 403) {
          throw new JevEvaluationError(
            EvaluationErrorCode.INVALID_CREDENTIAL,
            'Native Jev authentication failed. Invalid Jev API key or unauthorized organization access.',
            response.status
          );
        }

        if (response.status === 404) {
          throw new JevEvaluationError(
            EvaluationErrorCode.UNKNOWN_QUESTION,
            `Native Jev runtime reported question '${context.questionId}' not found.`,
            404
          );
        }

        if (response.status === 429) {
          throw new JevEvaluationError(
            EvaluationErrorCode.RATE_LIMITED,
            'Native Jev rate limit or quota exceeded.',
            429
          );
        }

        throw new JevEvaluationError(
          EvaluationErrorCode.PROVIDER_ERROR,
          `Native Jev runtime returned status ${response.status}: ${safeBody}`,
          response.status
        );
      }

      const data = await response.json();
      const result = this.normalizeNativeResult(question, data);
      const durationMs = Date.now() - startTime;

      return {
        success: true,
        result,
        metadata: {
          durationMs,
          requestId: `native_jev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          mode: 'native-jev',
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

  private extractNativeCredentials(credentials?: NativeJevCredentials | UserCredentials): {
    apiKey?: string;
    organizationId?: string;
  } {
    if (!credentials) return {};

    if ('apiKey' in credentials && typeof credentials.apiKey === 'string') {
      return {
        apiKey: credentials.apiKey,
        organizationId: credentials.organizationId,
      };
    }

    if ('credentials' in credentials && credentials.credentials && typeof credentials.credentials.apiKey === 'string') {
      const creds = credentials.credentials as unknown as Record<string, unknown>;
      return {
        apiKey: typeof creds.apiKey === 'string' ? creds.apiKey : undefined,
        organizationId: typeof creds.organizationId === 'string' ? creds.organizationId : undefined,
      };
    }

    return {};
  }

  private normalizeNativeResult(question: AtomicQuestion, data: unknown): JevResult {
    const raw = (data && typeof data === 'object' && 'result' in (data as Record<string, unknown>))
      ? (data as Record<string, unknown>).result
      : data;

    if (!raw || typeof raw !== 'object') {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_MODEL_OUTPUT,
        'Native Jev runtime returned non-object result payload',
        422,
        { data }
      );
    }

    const rawObj = raw as Record<string, unknown>;

    if (question.type === 'noul') {
      const value = typeof rawObj.value === 'boolean' ? rawObj.value : Boolean(rawObj.value);
      const confidence = typeof rawObj.confidence === 'number' ? rawObj.confidence : undefined;
      const explanation = typeof rawObj.explanation === 'string' ? rawObj.explanation : typeof rawObj.rationale === 'string' ? rawObj.rationale : undefined;

      const noulResult: NoulResult = {
        type: 'noul',
        value,
        confidence,
        explanation,
        rawOutput: data,
      };
      return noulResult;
    }

    // Score Primitive
    const num = typeof rawObj.value === 'number' ? rawObj.value : Number(rawObj.value);
    if (isNaN(num)) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RESULT_VALIDATION_FAILED,
        `Expected numeric score value from Native Jev runtime, received: ${String(rawObj.value)}`,
        422,
        { data }
      );
    }

    const explanation = typeof rawObj.explanation === 'string' ? rawObj.explanation : typeof rawObj.rationale === 'string' ? rawObj.rationale : undefined;

    const scoreResult: ScoreResult = {
      type: 'score',
      value: Math.max(0, Math.min(1, num)),
      range: [0, 1],
      explanation,
      rawOutput: data,
    };
    return scoreResult;
  }

  private sanitizeAndWrapError(err: unknown, apiKey?: string): JevEvaluationError {
    if (err instanceof JevEvaluationError) {
      if (apiKey && apiKey.length > 5) {
        const scrubbed = err.message.replaceAll(apiKey, '[REDACTED_KEY]');
        return new JevEvaluationError(err.code, scrubbed, err.statusCode, err.details);
      }
      return err;
    }

    const raw = err instanceof Error ? err.message : String(err);
    const scrubbed = (apiKey && apiKey.length > 5 ? raw.replaceAll(apiKey, '[REDACTED_KEY]') : raw) || 'Native Jev execution error';

    return new JevEvaluationError(
      EvaluationErrorCode.INTERNAL_ERROR,
      scrubbed,
      500
    );
  }
}
