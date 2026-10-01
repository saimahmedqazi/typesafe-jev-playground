import { describe, it, expect, vi } from 'vitest';
import { LLMExecutionAdapter } from '../../src/adapters/llm-adapter';
import { PROVIDER_ENDPOINTS } from '../../src/adapters/types';
import { EvaluationContext } from '../../src/core';

describe('LLM Execution Adapter', () => {
  const validSandwichState = {
    object: 'sandwich',
    bread: true,
    slices: 2,
    filling: ['cheese', 'tomato'],
  };

  const validScoreState = {
    freshness: 0.9,
    balance: 0.85,
    coherence: 0.88,
  };

  describe('Validation and Guardrails', () => {
    it('rejects unsupported execution mode', async () => {
      const adapter = new LLMExecutionAdapter();
      const context: EvaluationContext = {
        mode: 'native-jev',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const response = await adapter.execute(context, { apiKey: 'test-key', provider: 'openai' });
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('UNSUPPORTED_MODE');
      }
    });

    it('rejects missing API key immediately without network call', async () => {
      const mockFetch = vi.fn();
      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const response = await adapter.execute(context);
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('MISSING_CREDENTIAL');
      }
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('rejects unknown question ID', async () => {
      const adapter = new LLMExecutionAdapter();
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'non_existent_question',
        questionType: 'noul',
        state: validSandwichState,
      };

      const response = await adapter.execute(context, { apiKey: 'test-key', provider: 'openai' });
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('UNKNOWN_QUESTION');
      }
    });

    it('rejects invalid state failing question validation', async () => {
      const adapter = new LLMExecutionAdapter();
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: {}, // empty state fails validation
      };

      const response = await adapter.execute(context, { apiKey: 'test-key', provider: 'openai' });
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('INVALID_STATE');
      }
    });
  });

  describe('OpenAI Execution Flow', () => {
    it('calls OpenAI endpoint and normalizes Noul evaluation result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  value: true,
                  confidence: 0.95,
                  rationale: 'Filling is between two slices of bread.',
                }),
              },
            },
          ],
          usage: {
            prompt_tokens: 120,
            completion_tokens: 28,
            total_tokens: 148,
          },
        }),
      });

      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
        modelConfig: {
          provider: 'openai',
          model: 'gpt-4o-mini',
        },
      };

      const response = await adapter.execute(context, { apiKey: 'sk-test-secret-12345', provider: 'openai' });

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.type).toBe('noul');
        expect(response.result.value).toBe(true);
        expect(response.result.confidence).toBe(0.95);
        expect(response.result.explanation).toContain('Filling is between two slices');
        expect(response.metadata.provider).toBe('openai');
        expect(response.metadata.model).toBe('gpt-4o-mini');
        expect(response.metadata.tokenUsage?.totalTokens).toBe(148);
      }

      // Verify request formatting
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe(PROVIDER_ENDPOINTS.openai);
      expect(calledInit.headers['Authorization']).toBe('Bearer sk-test-secret-12345');
      const body = JSON.parse(calledInit.body);
      expect(body.model).toBe('gpt-4o-mini');
      expect(body.response_format.type).toBe('json_schema');
    });
  });

  describe('Anthropic Execution Flow', () => {
    it('calls Anthropic endpoint and normalizes Score evaluation result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          content: [
            {
              type: 'tool_use',
              id: 'tool_call_001',
              name: 'submit_jev_evaluation',
              input: {
                value: 0.88,
                rationale: 'High freshness and well-balanced criteria.',
              },
            },
          ],
          usage: {
            input_tokens: 180,
            output_tokens: 35,
          },
        }),
      });

      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'new_score_1',
        questionType: 'score',
        state: validScoreState,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-3-5-haiku-20241022',
        },
      };

      const response = await adapter.execute(context, { apiKey: 'ant-secret-key-67890', provider: 'anthropic' });

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.type).toBe('score');
        if (response.result.type === 'score') {
          expect(response.result.value).toBe(0.88);
          expect(response.result.range).toEqual([0, 1]);
        }
        expect(response.result.explanation).toContain('High freshness');
        expect(response.metadata.tokenUsage?.totalTokens).toBe(215);
      }

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [calledUrl, calledInit] = mockFetch.mock.calls[0];
      expect(calledUrl).toBe(PROVIDER_ENDPOINTS.anthropic);
      expect(calledInit.headers['x-api-key']).toBe('ant-secret-key-67890');
      const body = JSON.parse(calledInit.body);
      expect(body.tools[0].name).toBe('submit_jev_evaluation');
    });
  });

  describe('Gemini Execution Flow', () => {
    it('calls Gemini endpoint and normalizes Noul evaluation result', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      value: false,
                      confidence: 0.82,
                      rationale: 'Open-faced item lacks enclosing top bread layer.',
                    }),
                  },
                ],
              },
            },
          ],
          usageMetadata: {
            promptTokenCount: 160,
            candidatesTokenCount: 24,
            totalTokenCount: 184,
          },
        }),
      });

      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
        modelConfig: {
          provider: 'gemini',
          model: 'gemini-1.5-flash',
        },
      };

      const response = await adapter.execute(context, { apiKey: 'AIzaSyFakeGeminiKey123', provider: 'gemini' });

      expect(response.success).toBe(true);
      if (response.success) {
        expect(response.result.type).toBe('noul');
        expect(response.result.value).toBe(false);
        expect(response.result.confidence).toBe(0.82);
        expect(response.metadata.tokenUsage?.totalTokens).toBe(184);
      }

      const [calledUrl] = mockFetch.mock.calls[0];
      expect(calledUrl).toContain(PROVIDER_ENDPOINTS.gemini);
      expect(calledUrl).toContain('key=AIzaSyFakeGeminiKey123');
    });
  });

  describe('Error Handling and Credential Scrubbing', () => {
    it('maps 401 response to INVALID_CREDENTIAL', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized: Invalid API key',
      });

      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const response = await adapter.execute(context, { apiKey: 'sk-invalid-key-999', provider: 'openai' });
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('INVALID_CREDENTIAL');
      }
    });

    it('maps 429 response to RATE_LIMITED', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'Rate limit reached',
      });

      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const response = await adapter.execute(context, { apiKey: 'sk-valid-key-999', provider: 'openai' });
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.code).toBe('RATE_LIMITED');
      }
    });

    it('guarantees raw API key is scrubbed from error message', async () => {
      const secretKey = 'sk-sensitive-user-key-abcdef12345';
      const mockFetch = vi.fn().mockRejectedValue(new Error(`Connection to OpenAI failed for key ${secretKey}`));

      const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as unknown as typeof fetch });
      const context: EvaluationContext = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        questionType: 'noul',
        state: validSandwichState,
      };

      const response = await adapter.execute(context, { apiKey: secretKey, provider: 'openai' });
      expect(response.success).toBe(false);
      if (!response.success) {
        expect(response.error.message).not.toContain(secretKey);
        expect(response.error.message).toContain('[REDACTED_KEY]');
      }
    });
  });
});
