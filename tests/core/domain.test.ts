import { describe, it, expect } from 'vitest';
import {
  EXECUTION_MODES,
  isLLMPracticeMode,
  isNativeJevMode,
  isValidExecutionMode,
  sanitizeSecret,
  sanitizeHeaders,
  extractEphemeralCredentials,
  assertNoMaintainerFallback,
  HEADER_USER_LLM_KEY,
  HEADER_USER_LLM_PROVIDER,
  HEADER_USER_JEV_KEY,
  EvaluationErrorCode,
  JevEvaluationError,
  AtomicQuestion,
  NoulResult,
  ScoreResult,
  EvaluationResponse,
} from '../../src/core';

describe('JEV Domain Models & Execution Modes', () => {
  describe('ExecutionMode', () => {
    it('defines distinct metadata for llm-practice and native-jev', () => {
      expect(EXECUTION_MODES['llm-practice']).toBeDefined();
      expect(EXECUTION_MODES['native-jev']).toBeDefined();
      expect(EXECUTION_MODES['llm-practice'].requiresLLMKey).toBe(true);
      expect(EXECUTION_MODES['native-jev'].requiresJevKey).toBe(true);
      expect(EXECUTION_MODES['llm-practice'].semanticNotice).toContain('does not claim or guarantee runtime identity');
    });

    it('correctly narrows modes with type guards', () => {
      expect(isLLMPracticeMode('llm-practice')).toBe(true);
      expect(isLLMPracticeMode('native-jev')).toBe(false);
      expect(isNativeJevMode('native-jev')).toBe(true);
      expect(isNativeJevMode('llm-practice')).toBe(false);
      expect(isValidExecutionMode('llm-practice')).toBe(true);
      expect(isValidExecutionMode('native-jev')).toBe(true);
      expect(isValidExecutionMode('other')).toBe(false);
    });
  });

  describe('Credential Safety & BYOK Sanitization', () => {
    it('redacts secrets without leaking raw keys', () => {
      const secret = 'sk-proj-1234567890abcdef1234567890abcdef';
      const masked = sanitizeSecret(secret);
      expect(masked).toBe('sk-...cdef');
      expect(masked).not.toContain('1234567890');
      expect(sanitizeSecret(null)).toBe('[REDACTED]');
      expect(sanitizeSecret('short')).toBe('[REDACTED]');
    });

    it('strips sensitive headers during sanitization', () => {
      const headers = {
        'content-type': 'application/json',
        [HEADER_USER_LLM_KEY]: 'sk-secret-123',
        authorization: 'Bearer token-abc',
        'x-request-id': 'req-999',
      };
      const sanitized = sanitizeHeaders(headers);
      expect(sanitized['content-type']).toBe('application/json');
      expect(sanitized['x-request-id']).toBe('req-999');
      expect(sanitized[HEADER_USER_LLM_KEY]).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
    });

    it('extracts ephemeral credentials from headers for llm-practice', () => {
      const headers = {
        [HEADER_USER_LLM_KEY]: 'sk-test-key-12345',
        [HEADER_USER_LLM_PROVIDER]: 'anthropic',
      };
      const creds = extractEphemeralCredentials(headers, 'llm-practice');
      expect(creds).not.toBeNull();
      if (creds && 'provider' in creds) {
        expect(creds.apiKey).toBe('sk-test-key-12345');
        expect(creds.provider).toBe('anthropic');
      }
    });

    it('extracts ephemeral credentials from headers for native-jev', () => {
      const headers = {
        [HEADER_USER_JEV_KEY]: 'jev-live-key-999',
      };
      const creds = extractEphemeralCredentials(headers, 'native-jev');
      expect(creds).not.toBeNull();
      if (creds && 'apiKey' in creds) {
        expect(creds.apiKey).toBe('jev-live-key-999');
      }
    });

    it('enforces zero owner fallback invariant when credentials are missing', () => {
      expect(() => assertNoMaintainerFallback(false)).toThrow(/MISSING_CREDENTIAL/);
      expect(() => assertNoMaintainerFallback(true)).not.toThrow();
    });
  });

  describe('Error Taxonomy & Serialization', () => {
    it('properly serializes JevEvaluationError with status code and error code', () => {
      const err = new JevEvaluationError(
        EvaluationErrorCode.INVALID_STATE,
        'State missing required bread field',
        422,
        { field: 'bread' }
      );
      expect(err.code).toBe('INVALID_STATE');
      expect(err.statusCode).toBe(422);

      const json = err.toJSON();
      expect(json.code).toBe('INVALID_STATE');
      expect(json.message).toBe('State missing required bread field');
      expect(json.statusCode).toBe(422);
      expect(json.details).toEqual({ field: 'bread' });
    });
  });

  describe('Domain Result Typing & Invariants', () => {
    it('validates Noul boolean result structure', () => {
      const noulResult: NoulResult = {
        type: 'noul',
        value: true,
        confidence: 0.98,
        explanation: 'Object has two slices of bread with filling between them.',
      };
      expect(noulResult.type).toBe('noul');
      expect(typeof noulResult.value).toBe('boolean');
    });

    it('validates Score numeric result structure and range', () => {
      const scoreResult: ScoreResult = {
        type: 'score',
        value: 0.85,
        range: [0, 1],
        confidence: 0.92,
      };
      expect(scoreResult.type).toBe('score');
      expect(scoreResult.value).toBeGreaterThanOrEqual(0);
      expect(scoreResult.value).toBeLessThanOrEqual(1);
    });

    it('ensures EvaluationResponse discriminated union works correctly', () => {
      const successResponse: EvaluationResponse = {
        success: true,
        result: { type: 'noul', value: true },
        metadata: {
          durationMs: 340,
          requestId: 'test-req-1',
          mode: 'llm-practice',
          provider: 'openai',
          model: 'gpt-4o',
          timestamp: new Date().toISOString(),
        },
      };

      const errorResponse: EvaluationResponse = {
        success: false,
        error: {
          code: EvaluationErrorCode.INVALID_MODEL_OUTPUT,
          message: 'Model output did not match schema',
          statusCode: 502,
        },
      };

      if (successResponse.success) {
        expect(successResponse.result.type).toBe('noul');
        expect(successResponse.metadata.mode).toBe('llm-practice');
      }

      if (!errorResponse.success) {
        expect(errorResponse.error.code).toBe(EvaluationErrorCode.INVALID_MODEL_OUTPUT);
      }
    });
  });
});
