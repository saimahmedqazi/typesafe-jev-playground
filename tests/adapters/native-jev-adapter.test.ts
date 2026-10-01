import { describe, it, expect, vi } from 'vitest';
import { NativeJevExecutionAdapter, DEFAULT_NATIVE_JEV_ENDPOINT } from '../../src/adapters/native-jev-adapter';
import { EvaluationContext } from '../../src/core';

describe('Native Jev Execution Adapter', () => {
  const validSandwichState = {
    object: 'sandwich',
    bread: true,
    slices: 2,
    filling: ['ham', 'cheese'],
  };

  const validScoreState = {
    completeness: 0.95,
    freshness: 0.9,
    coherence: 0.92,
  };

  describe('Validation & Mode Isolation', () => {
    it('rejects llm-practice mode execution requests', async () => {
      const adapter = new NativeJevExecutionAdapter();
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const res = await adapter.execute(context, { apiKey: 'jev-test-key' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('UNSUPPORTED_MODE');
      }
    });

    it('rejects missing credentials with actionable guidance suggesting LLM Practice Mode', async () => {
      const mockFetch = vi.fn();
      const adapter = new NativeJevExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const res = await adapter.execute(context);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('MISSING_CREDENTIAL');
        expect(res.error.message).toContain('LLM Practice Mode');
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects unknown question ID', async () => {
      const adapter = new NativeJevExecutionAdapter();
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'non_existent_question',
        questionType: 'noul',
        state: validSandwichState,
      };

      const res = await adapter.execute(context, { apiKey: 'jev-test-key' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('UNKNOWN_QUESTION');
      }
    });

    it('rejects invalid state failing question validation', async () => {
      const adapter = new NativeJevExecutionAdapter();
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: {}, // fails validation
      };

      const res = await adapter.execute(context, { apiKey: 'jev-test-key' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('INVALID_STATE');
      }
    });
  });

  describe('Native Jev Execution & Response Parsing', () => {
    it('dispatches to Native Jev endpoint and parses Noul evaluation result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            type: 'noul',
            value: true,
            confidence: 0.98,
            explanation: 'Verified through Native Jev runtime evaluation.',
          },
        }),
      });

      const adapter = new NativeJevExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const res = await adapter.execute(context, {
        apiKey: 'jev-live-secret-key-12345',
        organizationId: 'org-enterprise-alpha',
      });

      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.result.type).toBe('noul');
        expect(res.result.value).toBe(true);
        expect(res.metadata.mode).toBe('native-jev');
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [url, init] = mockFetch.mock.calls[0];
      expect(url).toBe(DEFAULT_NATIVE_JEV_ENDPOINT);
      expect(init.headers['Authorization']).toBe('Bearer jev-live-secret-key-12345');
      expect(init.headers['x-jev-organization']).toBe('org-enterprise-alpha');
    });

    it('dispatches to Native Jev endpoint and parses Score evaluation result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          result: {
            type: 'score',
            value: 0.94,
            explanation: 'High scoring state evaluated by native runtime.',
          },
        }),
      });

      const adapter = new NativeJevExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'new_score_1',
        questionType: 'score',
        state: validScoreState,
      };

      const res = await adapter.execute(context, { apiKey: 'jev-test-key' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.result.type).toBe('score');
        expect(res.result.value).toBe(0.94);
        if (res.result.type === 'score') {
          expect(res.result.range).toEqual([0, 1]);
        }
      }
    });
  });

  describe('Error Handling and Credential Scrubbing', () => {
    it('maps HTTP 401 from Native Jev to INVALID_CREDENTIAL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized: Invalid Jev token',
      });

      const adapter = new NativeJevExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const res = await adapter.execute(context, { apiKey: 'jev-expired-token' });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.code).toBe('INVALID_CREDENTIAL');
      }
    });

    it('guarantees native API key is never leaked in error messages', async () => {
      const sensitiveKey = 'jev-ultra-secret-user-key-99999';
      const mockFetch = vi.fn().mockRejectedValue(new Error(`TCP connection to jev.ai failed with key ${sensitiveKey}`));

      const adapter = new NativeJevExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const res = await adapter.execute(context, { apiKey: sensitiveKey });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.message).not.toContain(sensitiveKey);
        expect(res.error.message).toContain('[REDACTED_KEY]');
      }
    });
  });
});
