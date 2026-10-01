/**
 * Server Request and Response Validation Schemas.
 *
 * Implements strict Zod validation for `/api/evaluate` request payloads
 * and runtime schema verification of evaluation results.
 */

import { z } from 'zod';
import { AtomicQuestion, EvaluationErrorCode, JevEvaluationError, JevResult } from '../core';

export const EvaluateRequestBodySchema = z.object({
  mode: z.enum(['llm-practice', 'native-jev'], {
    errorMap: () => ({ message: "Mode must be either 'llm-practice' or 'native-jev'" }),
  }),
  questionId: z.string().min(1, 'Question ID cannot be empty'),
  questionType: z.enum(['noul', 'score'], {
    errorMap: () => ({ message: "Question type must be 'noul' or 'score'" }),
  }),
  state: z
    .record(z.unknown())
    .refine((val) => val !== null && typeof val === 'object' && !Array.isArray(val), {
      message: 'State must be a non-null, non-array JSON object',
    }),
  modelConfig: z
    .object({
      provider: z.string().min(1, 'Provider cannot be empty'),
      model: z.string().min(1, 'Model cannot be empty'),
      temperature: z.number().min(0).max(2).optional(),
      customEndpoint: z.string().url().optional(),
    })
    .optional(),
});

export type EvaluateRequestBody = z.infer<typeof EvaluateRequestBodySchema>;

/**
 * Validates at runtime that an evaluation result strictly matches the expected return schema
 * for the target atomic question.
 */
export function validateEvaluationResult(question: AtomicQuestion, result: unknown): JevResult {
  if (!result || typeof result !== 'object') {
    throw new JevEvaluationError(
      EvaluationErrorCode.RESULT_VALIDATION_FAILED,
      'Evaluation result must be a non-null object',
      422,
      { result }
    );
  }

  const raw = result as Record<string, unknown>;

  if (raw.type !== question.type) {
    throw new JevEvaluationError(
      EvaluationErrorCode.RESULT_VALIDATION_FAILED,
      `Evaluation result type '${String(raw.type)}' does not match question primitive type '${question.type}'`,
      422,
      { expectedType: question.type, actualType: raw.type }
    );
  }

  if (question.type === 'noul') {
    if (typeof raw.value !== 'boolean') {
      throw new JevEvaluationError(
        EvaluationErrorCode.RESULT_VALIDATION_FAILED,
        `Noul evaluation value must be a boolean, received: ${typeof raw.value}`,
        422,
        { value: raw.value }
      );
    }

    if (raw.confidence !== undefined && (typeof raw.confidence !== 'number' || raw.confidence < 0 || raw.confidence > 1)) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RESULT_VALIDATION_FAILED,
        'Noul confidence score must be a number between 0.0 and 1.0',
        422,
        { confidence: raw.confidence }
      );
    }
  } else if (question.type === 'score') {
    if (typeof raw.value !== 'number' || isNaN(raw.value)) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RESULT_VALIDATION_FAILED,
        `Score evaluation value must be a valid number, received: ${String(raw.value)}`,
        422,
        { value: raw.value }
      );
    }

    if (raw.value < 0 || raw.value > 1) {
      throw new JevEvaluationError(
        EvaluationErrorCode.RESULT_VALIDATION_FAILED,
        `Score value ${raw.value} is out of the required [0.0, 1.0] range`,
        422,
        { value: raw.value }
      );
    }
  }

  return result as JevResult;
}
