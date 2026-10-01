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
  ChoiceResult,
  JevAnswer,
  UserCredentials,
} from '../core';
import { defaultQuestionRegistry } from '../registry';
import { IQuestionRegistry } from '../registry/types';
import { ExecutionAdapter, LLMProvider, ProviderExecutionResult, PROVIDER_DEFAULT_MODELS, PROVIDER_ENDPOINTS } from './types';
import { buildEvaluationPrompt, buildMultiQuestionEvaluationPrompt } from './prompt';
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

      // 3. Resolve Model Configuration
      const rawProvider = (context.modelConfig?.provider || 'openai').toLowerCase();
      if (
        rawProvider !== 'openai' &&
        rawProvider !== 'anthropic' &&
        rawProvider !== 'gemini' &&
        rawProvider !== 'groq' &&
        rawProvider !== 'custom'
      ) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNSUPPORTED_PROVIDER,
          `Unsupported LLM provider '${rawProvider}'. Supported providers: groq, openai, anthropic, gemini, custom.`,
          400
        );
      }
      const provider = rawProvider as LLMProvider;
      const model = context.modelConfig?.model || PROVIDER_DEFAULT_MODELS[provider];
      const temperature = context.modelConfig?.temperature ?? 0;
      const customEndpoint =
        (credentials && 'endpoint' in credentials && credentials.endpoint) ||
        context.modelConfig?.customEndpoint;

      // 4. Check for Official TypeSafe AI Questions Map
      if (context.questions && Object.keys(context.questions).length > 0) {
        const prompt = buildMultiQuestionEvaluationPrompt(context.questions, context.state);

        const syntheticQuestion: any = {
          id: 'multi_eval',
          type: 'choice',
          name: 'Multi-Question Evaluation',
          description: 'Official TypeSafe AI questions evaluation',
          expectedReturnType: 'string',
          promptInstruction: '',
          validateState: () => ({ valid: true }),
        };

        const executionResult = await this.dispatchProvider({
          provider,
          apiKey,
          model,
          temperature,
          question: syntheticQuestion,
          prompt,
          customEndpoint,
        });

        const raw = executionResult.rawResult as Record<string, any>;
        const rawAnswers = (raw && typeof raw === 'object' && raw.answers) ? raw.answers : raw;

        const normalizedAnswers: Record<string, JevAnswer> = {};
        for (const [key, qDef] of Object.entries(context.questions)) {
          const rawAns = rawAnswers?.[key] || {};
          const qType = qDef.type || 'noul';

          if (qType === 'noul') {
            const prob = typeof rawAns.noul === 'number'
              ? rawAns.noul
              : typeof rawAns.value === 'boolean'
              ? (rawAns.value ? 0.98 : 0.02)
              : typeof rawAns.confidence === 'number'
              ? rawAns.confidence
              : 0.5;
            const verdict = typeof rawAns.verdict === 'boolean' ? rawAns.verdict : prob >= 0.5;
            normalizedAnswers[key] = {
              type: 'noul',
              noul: Math.max(0, Math.min(1, prob)),
              verdict,
              confidence: typeof rawAns.confidence === 'number' ? rawAns.confidence : prob,
              rationale: rawAns.rationale || rawAns.explanation,
            };
          } else if (qType === 'score') {
            const scoreVal = typeof rawAns.score === 'number'
              ? rawAns.score
              : typeof rawAns.value === 'number'
              ? rawAns.value
              : 0.5;
            normalizedAnswers[key] = {
              type: 'score',
              score: Math.max(0, Math.min(1, scoreVal)),
              legend: rawAns.legend || (typeof rawAns.value === 'string' ? rawAns.value : undefined),
              probabilities: rawAns.probabilities,
              confidence: rawAns.confidence,
              rationale: rawAns.rationale || rawAns.explanation,
            };
          } else if (qType === 'choice') {
            const choiceVal = typeof rawAns.choice === 'string'
              ? rawAns.choice
              : typeof rawAns.value === 'string'
              ? rawAns.value
              : String(rawAns.choice ?? rawAns.value ?? '');
            normalizedAnswers[key] = {
              type: 'choice',
              choice: choiceVal,
              probabilities: rawAns.probabilities,
              confidence: rawAns.confidence,
              rationale: rawAns.rationale || rawAns.explanation,
            };
          }
        }

        const durationMs = Date.now() - startTime;
        const firstKey = Object.keys(normalizedAnswers)[0] || 'evaluation';
        const firstAns = normalizedAnswers[firstKey];
        let primaryResult: JevResult;
        if (!firstAns || firstAns.type === 'noul') {
          primaryResult = {
            type: 'noul',
            value: firstAns ? (firstAns.verdict ?? (firstAns.noul >= 0.5)) : false,
            confidence: firstAns?.confidence ?? 0.95,
            explanation: firstAns?.rationale || 'Evaluation completed successfully.',
          };
        } else if (firstAns.type === 'score') {
          primaryResult = {
            type: 'score',
            value: firstAns.score,
            range: [0, 1],
            confidence: firstAns.confidence ?? 0.95,
            explanation: firstAns.rationale || 'Evaluation completed successfully.',
          };
        } else {
          primaryResult = {
            type: 'choice',
            value: firstAns.choice || '',
            choices: firstAns.probabilities ? Object.keys(firstAns.probabilities) : [firstAns.choice || 'default'],
            probabilities: firstAns.probabilities,
            confidence: firstAns.confidence ?? 0.95,
            explanation: firstAns.rationale || 'Evaluation completed successfully.',
          };
        }

        return {
          success: true,
          result: primaryResult,
          answers: normalizedAnswers,
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
      }

      // 5. Fallback Single Question Resolution from Registry or Dynamic Custom Question
      const qId = context.questionId || 'is_sandwich';
      let question = this.registry.get(qId);
      if (!question && (qId === 'custom_question' || context.customQuestionText)) {
        const primitiveType = context.questionType || 'noul';
        question = {
          id: qId,
          type: primitiveType,
          name: 'Custom Evaluation Question',
          description: context.customQuestionText || 'Custom user-specified atomic question',
          expectedReturnType: primitiveType === 'noul' ? 'boolean' : primitiveType === 'score' ? 'number' : 'string',
          promptInstruction: context.customQuestionText || 'Evaluate the target state against the question criteria.',
          choices: context.choices || [],
          validateState: (state: unknown) => {
            if (!state || typeof state !== 'object' || Array.isArray(state)) {
              return { valid: false, errors: ['State must be a non-null JSON object'] };
            }
            return { valid: true };
          },
        } as any;
      }

      if (!question) {
        throw new JevEvaluationError(
          EvaluationErrorCode.UNKNOWN_QUESTION,
          `Atomic question '${qId}' is not registered.`,
          404
        );
      }

      // 6. Validate State against Question
      const stateValidation = question.validateState(context.state);
      if (!stateValidation.valid) {
        throw new JevEvaluationError(
          EvaluationErrorCode.INVALID_STATE,
          `State validation failed for question '${question.id}': ${(stateValidation.errors || []).join('; ')}`,
          400,
          { errors: stateValidation.errors }
        );
      }

      // 7. Build JEV Evaluation Prompt
      const prompt = buildEvaluationPrompt(question, context.state);

      // 8. Dispatch to Provider Sub-Adapter
      const executionResult = await this.dispatchProvider({
        provider,
        apiKey,
        model,
        temperature,
        question,
        prompt,
        customEndpoint,
      });

      // 9. Normalize Output to JEV Typed Result
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
    customEndpoint?: string;
  }): Promise<ProviderExecutionResult> {
    const { provider, apiKey, model, temperature, question, prompt, customEndpoint } = params;

    switch (provider) {
      case 'groq':
        return executeOpenAI({
          apiKey,
          model,
          temperature,
          question,
          prompt,
          endpoint: PROVIDER_ENDPOINTS.groq,
          providerName: 'Groq',
          fetchFn: this.fetchFn,
        });

      case 'custom':
        return executeOpenAI({
          apiKey,
          model,
          temperature,
          question,
          prompt,
          endpoint: customEndpoint || 'http://localhost:11434/v1/chat/completions',
          providerName: 'Custom Endpoint',
          fetchFn: this.fetchFn,
        });

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

    if (question.type === 'choice') {
      const allowedChoices = (question as any).choices as string[] | undefined;
      let selectedValue = typeof rawObj.value === 'string' ? rawObj.value.trim() : String(rawObj.value ?? '');

      // Case-insensitive or partial fallback to allowed choices
      if (allowedChoices && allowedChoices.length > 0) {
        const exact = allowedChoices.find((c) => c.toLowerCase() === selectedValue.toLowerCase());
        if (exact) {
          selectedValue = exact;
        } else {
          const partial = allowedChoices.find((c) => selectedValue.toLowerCase().includes(c.toLowerCase()));
          selectedValue = partial || allowedChoices[0];
        }
      }

      // Parse probability distribution if available
      let probabilities: Record<string, number> | undefined;
      if (rawObj.probabilities && typeof rawObj.probabilities === 'object') {
        probabilities = {};
        for (const [k, v] of Object.entries(rawObj.probabilities as Record<string, unknown>)) {
          const p = typeof v === 'number' ? v : Number(v);
          if (!isNaN(p)) {
            probabilities[k] = Math.max(0, Math.min(1, p));
          }
        }
      }

      const confidence = typeof rawObj.confidence === 'number' ? Math.max(0, Math.min(1, rawObj.confidence)) : undefined;
      const explanation = typeof rawObj.rationale === 'string' ? rawObj.rationale : undefined;

      const choiceResult: ChoiceResult = {
        type: 'choice',
        value: selectedValue,
        choices: allowedChoices && allowedChoices.length > 0 ? allowedChoices : [selectedValue],
        probabilities,
        confidence,
        explanation,
        rawOutput: raw,
      };
      return choiceResult;
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
