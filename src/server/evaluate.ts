/**
 * Server Evaluation and Question Route Handlers.
 *
 * Implements HTTP handlers for:
 * - `POST /api/evaluate`: Runs an atomic question evaluation against a target state.
 * - `GET /api/questions`: Discovers all registered questions and their state presets.
 */

import { Request, Response } from 'express';
import { EvaluationContext, EvaluationErrorCode, JevEvaluationError } from '../core';
import { defaultQuestionRegistry } from '../registry';
import { STATE_PRESETS } from '../registry/presets';
import { LLMExecutionAdapter } from '../adapters';
import { EvaluateRequestBodySchema, validateEvaluationResult } from './validation';
import { extractEphemeralCredentials } from './credentials';

export function createEvaluationHandlers(options?: { adapter?: LLMExecutionAdapter }) {
  const llmAdapter = options?.adapter ?? new LLMExecutionAdapter();

  async function handleEvaluateRequest(req: Request, res: Response) {
    // 1. Validate Request Body with Zod
    const parseResult = EvaluateRequestBodySchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: EvaluationErrorCode.INVALID_REQUEST,
          message: 'Invalid evaluation request payload: ' + parseResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          statusCode: 400,
          details: parseResult.error.flatten(),
        },
      });
    }

    const { mode, questionId, questionType, state, modelConfig } = parseResult.data;

    // 2. Extract Ephemeral User Credentials
    const userCredentials = extractEphemeralCredentials(req.headers);

    // 3. Validate Mode & Credentials Boundary
    if (mode === 'llm-practice') {
      const apiKey = userCredentials?.mode === 'llm-practice' ? userCredentials.credentials.apiKey : undefined;
      if (!apiKey || apiKey.trim() === '') {
        return res.status(401).json({
          success: false,
          error: {
            code: EvaluationErrorCode.MISSING_CREDENTIAL,
            message: 'Missing required LLM API key. Provide your key via the x-user-llm-key or Authorization header.',
            statusCode: 401,
          },
        });
      }
    } else if (mode === 'native-jev') {
      const jevKey = userCredentials?.mode === 'native-jev' ? userCredentials.credentials.apiKey : undefined;
      if (!jevKey || jevKey.trim() === '') {
        return res.status(401).json({
          success: false,
          error: {
            code: EvaluationErrorCode.MISSING_CREDENTIAL,
            message: 'Missing required Jev API key. Provide your native credentials via the x-user-jev-key header.',
            statusCode: 401,
          },
        });
      }

      // Native Jev adapter is wired in Phase 5
      return res.status(501).json({
        success: false,
        error: {
          code: EvaluationErrorCode.UNSUPPORTED_MODE,
          message: 'Native Jev execution adapter will be integrated in Phase 5. Use LLM Practice Mode for now.',
          statusCode: 501,
        },
      });
    }

    // 4. Resolve Question from Registry
    const question = defaultQuestionRegistry.get(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        error: {
          code: EvaluationErrorCode.UNKNOWN_QUESTION,
          message: `Atomic question '${questionId}' was not found in the question registry.`,
          statusCode: 404,
        },
      });
    }

    // 5. Construct Evaluation Context
    const context: EvaluationContext = {
      mode,
      questionId,
      questionType,
      state,
      modelConfig,
    };

    // 6. Execute Evaluation Adapter
    const response = await llmAdapter.execute(context, userCredentials);

    // 7. Validate Evaluation Result Schema if Success
    if (response.success) {
      try {
        validateEvaluationResult(question, response.result);
      } catch (err) {
        if (err instanceof JevEvaluationError) {
          return res.status(err.statusCode).json({
            success: false,
            error: err.toJSON(),
          });
        }
        return res.status(422).json({
          success: false,
          error: {
            code: EvaluationErrorCode.RESULT_VALIDATION_FAILED,
            message: 'Result failed output schema validation',
            statusCode: 422,
          },
        });
      }

      return res.status(200).json(response);
    }

    // 8. Return Normalized Error Response
    const statusCode = response.error?.statusCode || 400;
    return res.status(statusCode).json(response);
  }

  function handleQuestionsListRequest(_req: Request, res: Response) {
    const questions = defaultQuestionRegistry.list().map((q) => ({
      id: q.id,
      name: q.name,
      type: q.type,
      description: q.description,
      expectedReturnType: q.expectedReturnType,
      defaultState: q.defaultState,
      presets: STATE_PRESETS.filter((p) => p.questionId === q.id),
    }));

    return res.json({
      success: true,
      questions,
    });
  }

  return {
    handleEvaluateRequest,
    handleQuestionsListRequest,
  };
}

export const defaultEvaluationHandlers = createEvaluationHandlers();
