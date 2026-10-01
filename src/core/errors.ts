/**
 * Standardized Error Taxonomy for TypeSafe Jev Playground.
 *
 * Implements structured machine-readable error codes and safe error serialization
 * that ensures stack traces and credentials are never leaked to public responses.
 */

export const EvaluationErrorCode = {
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_CREDENTIAL: 'MISSING_CREDENTIAL',
  INVALID_CREDENTIAL: 'INVALID_CREDENTIAL',
  INVALID_STATE: 'INVALID_STATE',
  INVALID_QUESTION: 'INVALID_QUESTION',
  UNKNOWN_QUESTION: 'UNKNOWN_QUESTION',
  UNSUPPORTED_MODE: 'UNSUPPORTED_MODE',
  UNSUPPORTED_PROVIDER: 'UNSUPPORTED_PROVIDER',
  UNSUPPORTED_MODEL: 'UNSUPPORTED_MODEL',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  JEV_ERROR: 'JEV_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  TIMEOUT: 'TIMEOUT',
  INVALID_MODEL_OUTPUT: 'INVALID_MODEL_OUTPUT',
  RESULT_VALIDATION_FAILED: 'RESULT_VALIDATION_FAILED',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type EvaluationErrorCode = (typeof EvaluationErrorCode)[keyof typeof EvaluationErrorCode];

export interface ErrorDetails {
  code: EvaluationErrorCode;
  message: string;
  statusCode: number;
  details?: unknown;
}

export class JevEvaluationError extends Error {
  public readonly code: EvaluationErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: EvaluationErrorCode, message: string, statusCode: number = 400, details?: unknown) {
    super(message);
    this.name = 'JevEvaluationError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, JevEvaluationError.prototype);
  }

  public toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }

  public static fromError(err: unknown): JevEvaluationError {
    if (err instanceof JevEvaluationError) {
      return err;
    }
    const message = err instanceof Error ? err.message : String(err);
    return new JevEvaluationError(EvaluationErrorCode.INTERNAL_ERROR, message, 500);
  }
}
