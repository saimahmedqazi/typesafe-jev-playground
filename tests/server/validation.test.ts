import { describe, it, expect } from 'vitest';
import { EvaluateRequestBodySchema, validateEvaluationResult } from '../../src/server/validation';
import { extractEphemeralCredentials } from '../../src/server/credentials';
import { isSandwichQuestion } from '../../src/registry/questions/is_sandwich';
import { newScore1Question } from '../../src/registry/questions/new_score_1';
import { JevEvaluationError } from '../../src/core';

describe('Server Request Validation & Schema Enforcement', () => {
  describe('EvaluateRequestBodySchema', () => {
    it('validates a correct evaluation request payload', () => {
      const validPayload = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: { bread: true, filling: 'cheese' },
        modelConfig: {
          provider: 'openai',
          model: 'gpt-4o-mini',
          temperature: 0,
        },
      };

      const result = EvaluateRequestBodySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('rejects missing or invalid execution mode', () => {
      const invalidPayload = {
        mode: 'cloud-mode',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: { bread: true },
      };

      const result = EvaluateRequestBodySchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Mode must be either');
      }
    });

    it('rejects null or non-object state representations', () => {
      const arrayStatePayload = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: ['bread', 'filling'],
      };

      const nullStatePayload = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: null,
      };

      expect(EvaluateRequestBodySchema.safeParse(arrayStatePayload).success).toBe(false);
      expect(EvaluateRequestBodySchema.safeParse(nullStatePayload).success).toBe(false);
    });
  });

  describe('validateEvaluationResult', () => {
    it('accepts valid Noul results with boolean value', () => {
      const validNoul = {
        type: 'noul',
        value: true,
        confidence: 0.95,
        explanation: 'Two slices of bread.',
      };

      const res = validateEvaluationResult(isSandwichQuestion, validNoul);
      expect(res.value).toBe(true);
    });

    it('rejects Noul results with non-boolean value', () => {
      const invalidNoul = {
        type: 'noul',
        value: 1, // number instead of boolean
      };

      expect(() => validateEvaluationResult(isSandwichQuestion, invalidNoul)).toThrowError(JevEvaluationError);
    });

    it('accepts valid Score results strictly bounded in [0, 1]', () => {
      const validScore = {
        type: 'score',
        value: 0.85,
        range: [0, 1],
      };

      const res = validateEvaluationResult(newScore1Question, validScore);
      expect(res.value).toBe(0.85);
    });

    it('rejects Score results out of [0, 1] range', () => {
      const outOfBoundsScore = {
        type: 'score',
        value: 1.5,
      };

      expect(() => validateEvaluationResult(newScore1Question, outOfBoundsScore)).toThrowError(JevEvaluationError);
    });
  });

  describe('extractEphemeralCredentials', () => {
    it('extracts LLM API key and provider from custom headers', () => {
      const headers = {
        'x-user-llm-key': 'sk-test-llm-12345',
        'x-user-llm-provider': 'anthropic',
      };

      const creds = extractEphemeralCredentials(headers);
      expect(creds).toBeDefined();
      expect(creds?.mode).toBe('llm-practice');
      if (creds?.mode === 'llm-practice') {
        expect(creds.credentials.apiKey).toBe('sk-test-llm-12345');
        expect(creds.credentials.provider).toBe('anthropic');
      }
    });

    it('falls back to Authorization Bearer header when x-user-llm-key is omitted', () => {
      const headers = {
        authorization: 'Bearer sk-bearer-token-67890',
      };

      const creds = extractEphemeralCredentials(headers);
      expect(creds?.mode).toBe('llm-practice');
      if (creds?.mode === 'llm-practice') {
        expect(creds.credentials.apiKey).toBe('sk-bearer-token-67890');
        expect(creds.credentials.provider).toBe('openai');
      }
    });

    it('extracts native Jev credentials', () => {
      const headers = {
        'x-user-jev-key': 'jev-secret-auth-key',
        'x-user-jev-org': 'org-123',
      };

      const creds = extractEphemeralCredentials(headers);
      expect(creds?.mode).toBe('native-jev');
      if (creds?.mode === 'native-jev') {
        expect(creds.credentials.apiKey).toBe('jev-secret-auth-key');
        expect(creds.credentials.organizationId).toBe('org-123');
      }
    });

    it('returns undefined when no credential headers are present', () => {
      const creds = extractEphemeralCredentials({});
      expect(creds).toBeUndefined();
    });
  });
});
