import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/index';
import { PROVIDER_ENDPOINTS } from '../../src/adapters/types';

describe('Server End-to-End API Integration', () => {
  const validSandwichState = {
    object: 'sandwich',
    bread: true,
    slices: 2,
    filling: ['turkey', 'cheese'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('GET /api/health', () => {
    it('returns status ok, supported modes, and zero-fallback invariant', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.supportedModes).toEqual(['llm-practice', 'native-jev']);
      expect(res.body.ownerFallbackEnabled).toBe(false);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('GET /api/questions', () => {
    it('returns registered questions and their state presets', async () => {
      const res = await request(app).get('/api/questions');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.questions)).toBe(true);

      const questionIds = res.body.questions.map((q: { id: string }) => q.id);
      expect(questionIds).toContain('is_sandwich');
      expect(questionIds).toContain('new_score_1');

      const isSandwich = res.body.questions.find((q: { id: string }) => q.id === 'is_sandwich');
      expect(isSandwich.presets.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('POST /api/evaluate', () => {
    it('successfully evaluates Noul question with valid credentials and state', async () => {
      // Mock global fetch for OpenAI endpoint
      const mockFetch = vi.fn().mockImplementation((url: string) => {
        if (url === PROVIDER_ENDPOINTS.openai) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      value: true,
                      confidence: 0.95,
                      rationale: 'Filling between two bread slices constitutes a sandwich.',
                    }),
                  },
                },
              ],
              usage: {
                prompt_tokens: 120,
                completion_tokens: 25,
                total_tokens: 145,
              },
            }),
          });
        }
        return Promise.reject(new Error(`Unexpected fetch URL: ${url}`));
      });

      vi.stubGlobal('fetch', mockFetch);

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', 'sk-test-user-secret-key-12345')
        .set('x-user-llm-provider', 'openai')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: validSandwichState,
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4o-mini',
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.type).toBe('noul');
      expect(res.body.result.value).toBe(true);
      expect(res.body.result.confidence).toBe(0.95);
      expect(res.body.metadata.mode).toBe('llm-practice');
      expect(res.body.metadata.provider).toBe('openai');
    });

    it('rejects request with 401 when ephemeral LLM credentials are missing', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: validSandwichState,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_CREDENTIAL');
    });

    it('rejects malformed request body with 400 INVALID_REQUEST', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', 'sk-test-key')
        .send({
          mode: 'invalid-mode',
          questionId: 'is_sandwich',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_REQUEST');
    });

    it('rejects unknown question with 404 UNKNOWN_QUESTION', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', 'sk-test-key')
        .send({
          mode: 'llm-practice',
          questionId: 'unknown_question_xyz',
          questionType: 'noul',
          state: validSandwichState,
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNKNOWN_QUESTION');
    });

    it('rejects state failing question validation with 400 INVALID_STATE', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', 'sk-test-key')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: {}, // empty state fails validation
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_STATE');
    });

    it('returns 501 UNSUPPORTED_MODE for native-jev when key is provided before phase 5', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-jev-key', 'jev-valid-key')
        .send({
          mode: 'native-jev',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: validSandwichState,
        });

      expect(res.status).toBe(501);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('UNSUPPORTED_MODE');
    });
  });

  describe('Security Guarantees & Abuse Protection', () => {
    it('strictly guarantees user API keys are never leaked in response bodies or headers', async () => {
      const secretUserKey = 'sk-super-secret-user-credential-do-not-leak';

      // Simulate network error
      const mockFetch = vi.fn().mockRejectedValue(new Error(`Failed to connect with key ${secretUserKey}`));
      vi.stubGlobal('fetch', mockFetch);

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', secretUserKey)
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: validSandwichState,
        });

      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toContain(secretUserKey);
      const headersString = JSON.stringify(res.headers);
      expect(headersString).not.toContain(secretUserKey);
    });

    it('rejects oversized payloads (>100KB) with 413 PAYLOAD_TOO_LARGE', async () => {
      // Create a payload larger than 100KB
      const largeState: Record<string, string> = {};
      for (let i = 0; i < 2000; i++) {
        largeState[`key_${i}`] = 'x'.repeat(60);
      }

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', 'sk-test-key')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: largeState,
        });

      expect(res.status).toBe(413);
      expect(res.body.error.code).toBe('PAYLOAD_TOO_LARGE');
    });
  });
});
