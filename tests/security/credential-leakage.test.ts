import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/server/index';
import { assertNoSecretInRecord } from '../../src/client/history';

describe('Security & Credential Leakage Audit', () => {
  const dummyState = {
    object: 'sandwich',
    bread: true,
    slices: 2,
    filling: ['cheese'],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.JEV_API_KEY;
  });

  describe('Upstream Error Reflection & Secret Scrubbing', () => {
    it('safely handles 401 authentication errors without reflecting OpenAI API key', async () => {
      const secretKey = 'sk-live-openai-super-secret-key-12345';
      const upstreamErrorBody = JSON.stringify({
        error: {
          message: `Incorrect API key provided: ${secretKey}. You can find your API key at https://platform.openai.com/account/api-keys.`,
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        },
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: async () => upstreamErrorBody,
          json: async () => JSON.parse(upstreamErrorBody),
        })
      );

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', secretKey)
        .set('x-user-llm-provider', 'openai')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4o-mini',
          },
        });

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(secretKey);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIAL');
    });

    it('scrubs OpenAI API key when upstream error body is included on provider errors', async () => {
      const secretKey = 'sk-live-openai-echo-token-12345';
      const upstreamErrorBody = `Server error from gateway containing secret ${secretKey}`;

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => upstreamErrorBody,
          json: async () => ({ error: upstreamErrorBody }),
        })
      );

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', secretKey)
        .set('x-user-llm-provider', 'openai')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4o-mini',
          },
        });

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(secretKey);
      expect(bodyStr).toContain('[REDACTED_KEY]');
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_ERROR');
    });

    it('scrubs Anthropic API key when upstream error body is included on provider errors', async () => {
      const secretKey = 'sk-ant-api03-confidential-token-99998888';
      const upstreamErrorBody = `Upstream Anthropic 500 error leaking key: ${secretKey}`;

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => upstreamErrorBody,
          json: async () => ({ error: upstreamErrorBody }),
        })
      );

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', secretKey)
        .set('x-user-llm-provider', 'anthropic')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
          modelConfig: {
            provider: 'anthropic',
            model: 'claude-3-5-sonnet-20241022',
          },
        });

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(secretKey);
      expect(bodyStr).toContain('[REDACTED_KEY]');
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_ERROR');
    });

    it('scrubs Gemini API key echoed by upstream service in error response', async () => {
      const secretKey = 'AIzaSyD-secret-gemini-key-7777777';
      const upstreamErrorBody = JSON.stringify({
        error: {
          code: 400,
          message: `API key not valid. Please pass a valid API key: ${secretKey}`,
          status: 'INVALID_ARGUMENT',
        },
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          text: async () => upstreamErrorBody,
          json: async () => JSON.parse(upstreamErrorBody),
        })
      );

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', secretKey)
        .set('x-user-llm-provider', 'gemini')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
          modelConfig: {
            provider: 'gemini',
            model: 'gemini-1.5-flash',
          },
        });

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(secretKey);
      expect(bodyStr).toContain('[REDACTED_KEY]');
      expect(res.body.success).toBe(false);
    });

    it('safely handles 401 Native Jev authentication errors without echoing key', async () => {
      const secretKey = 'jev_live_enterprise_secret_88888';
      const upstreamErrorBody = JSON.stringify({
        error: `Unauthorized access for token ${secretKey}`,
        code: 'JEV_UNAUTHORIZED',
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 401,
          statusText: 'Unauthorized',
          text: async () => upstreamErrorBody,
          json: async () => JSON.parse(upstreamErrorBody),
        })
      );

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-jev-key', secretKey)
        .send({
          mode: 'native-jev',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
        });

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(secretKey);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_CREDENTIAL');
    });

    it('scrubs Native Jev API key when upstream error body is returned on server errors', async () => {
      const secretKey = 'jev_live_internal_secret_99999';
      const upstreamErrorBody = JSON.stringify({
        error: `Internal server failure while authenticating key ${secretKey}`,
      });

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: async () => upstreamErrorBody,
          json: async () => JSON.parse(upstreamErrorBody),
        })
      );

      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-jev-key', secretKey)
        .send({
          mode: 'native-jev',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
        });

      const bodyStr = JSON.stringify(res.body);
      expect(bodyStr).not.toContain(secretKey);
      expect(bodyStr).toContain('[REDACTED_KEY]');
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROVIDER_ERROR');
    });
  });

  describe('Zero Maintainer Fallback Invariant', () => {
    it('refuses execution and refuses to fall back to server process.env for LLM Practice Mode', async () => {
      process.env.OPENAI_API_KEY = 'sk-server-maintainer-fallback-should-never-be-used';

      const res = await request(app)
        .post('/api/evaluate')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
          modelConfig: {
            provider: 'openai',
            model: 'gpt-4o-mini',
          },
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_CREDENTIAL');
      expect(res.body.error.message).toContain('Missing required LLM API key');
    });

    it('refuses execution and refuses to fall back to server process.env for Native Jev Mode', async () => {
      process.env.JEV_API_KEY = 'jev_server_maintainer-fallback-should-never-be-used';

      const res = await request(app)
        .post('/api/evaluate')
        .send({
          mode: 'native-jev',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_CREDENTIAL');
      expect(res.body.error.message).toContain('Missing required Native Jev API key');
    });

    it('declares ownerFallbackEnabled as false in health endpoint', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.ownerFallbackEnabled).toBe(false);
    });
  });

  describe('HTTP Response Header Sanitization', () => {
    it('ensures no credential headers are echoed back to client', async () => {
      const res = await request(app)
        .post('/api/evaluate')
        .set('x-user-llm-key', 'sk-test-secret-header-12345')
        .set('x-user-jev-key', 'jev_test-secret-header-67890')
        .send({
          mode: 'llm-practice',
          questionId: 'is_sandwich',
          questionType: 'noul',
          state: dummyState,
        });

      expect(res.headers['x-user-llm-key']).toBeUndefined();
      expect(res.headers['x-user-jev-key']).toBeUndefined();
      expect(res.headers['authorization']).toBeUndefined();
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Local Storage Zero-Credential Invariant Verification', () => {
    it('assertNoSecretInRecord immediately blocks any attempt to store keys in local history', () => {
      const cleanRecord = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        result: { value: true },
      };
      expect(() => assertNoSecretInRecord(cleanRecord)).not.toThrow();

      const contaminatedRecord = {
        mode: 'llm-practice',
        questionId: 'is_sandwich',
        modelConfig: {
          key: 'sk-proj-test1234567890',
        },
      };
      expect(() => assertNoSecretInRecord(contaminatedRecord)).toThrowError(
        /Security Invariant Violation/
      );
    });
  });
});
