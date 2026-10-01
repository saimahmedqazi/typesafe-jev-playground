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
import { LLMExecutionAdapter, NativeJevExecutionAdapter, SUPPORTED_MODELS, LLMProvider } from '../adapters';
import { EvaluateRequestBodySchema, validateEvaluationResult } from './validation';
import { extractEphemeralCredentials } from './credentials';

export function createEvaluationHandlers(options?: {
  adapter?: LLMExecutionAdapter;
  nativeAdapter?: NativeJevExecutionAdapter;
}) {
  const llmAdapter = options?.adapter ?? new LLMExecutionAdapter();
  const nativeAdapter = options?.nativeAdapter ?? new NativeJevExecutionAdapter();

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
            message: 'Missing required Native Jev API key. To execute in Native Jev Mode, provide your Jev API key via the x-user-jev-key header, or switch to LLM Practice Mode to practice without a Jev license.',
            statusCode: 401,
          },
        });
      }
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
    const response = mode === 'native-jev'
      ? await nativeAdapter.execute(context, userCredentials)
      : await llmAdapter.execute(context, userCredentials);

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

  async function handleModelsDiscoveryRequest(req: Request, res: Response) {
    const rawProvider = String(req.body?.provider || req.query?.provider || 'groq').toLowerCase() as LLMProvider;
    const provider = (SUPPORTED_MODELS[rawProvider] ? rawProvider : 'groq') as LLMProvider;
    const defaultList = (SUPPORTED_MODELS[provider] || []).map((m) => ({ id: m.id, name: m.name, description: m.description }));

    // Extract ephemeral credentials from header or body
    const creds = extractEphemeralCredentials(req.headers);
    const apiKey =
      (creds?.mode === 'llm-practice' ? creds.credentials.apiKey : undefined) ||
      (typeof req.body?.apiKey === 'string' ? req.body.apiKey.trim() : undefined);

    const customEndpoint =
      (creds?.mode === 'llm-practice' ? creds.credentials.endpoint : undefined) ||
      (typeof req.body?.customEndpoint === 'string' ? req.body.customEndpoint.trim() : undefined);

    if (!apiKey) {
      return res.json({
        success: true,
        live: false,
        models: defaultList,
        message: 'Standard catalog (configure API key in Settings to fetch live models).',
      });
    }

    try {
      if (provider === 'groq') {
        const upstream = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!upstream.ok) {
          const errText = await upstream.text();
          throw new Error(`Groq returned ${upstream.status}: ${errText.slice(0, 150)}`);
        }
        const data = await upstream.json();
        const models = (data.data || [])
          .map((m: any) => ({ id: m.id, name: m.id, description: `Groq LPU model (${m.id})` }))
          .sort((a: any, b: any) => a.id.localeCompare(b.id));
        return res.json({ success: true, live: true, models: models.length ? models : defaultList });
      }

      if (provider === 'openai') {
        const upstream = await fetch('https://api.openai.com/v1/models', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!upstream.ok) {
          const errText = await upstream.text();
          throw new Error(`OpenAI returned ${upstream.status}: ${errText.slice(0, 150)}`);
        }
        const data = await upstream.json();
        const models = (data.data || [])
          .filter((m: any) => m.id.includes('gpt') || m.id.includes('o1') || m.id.includes('o3'))
          .map((m: any) => ({ id: m.id, name: m.id, description: `OpenAI model (${m.id})` }))
          .sort((a: any, b: any) => a.id.localeCompare(b.id));
        return res.json({ success: true, live: true, models: models.length ? models : defaultList });
      }

      if (provider === 'gemini') {
        const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!upstream.ok) {
          const errText = await upstream.text();
          throw new Error(`Gemini returned ${upstream.status}: ${errText.slice(0, 150)}`);
        }
        const data = await upstream.json();
        const models = (data.models || [])
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => {
            const cleanId = m.name.replace(/^models\//, '');
            return { id: cleanId, name: m.displayName || cleanId, description: m.description?.slice(0, 100) || `Google model` };
          });
        return res.json({ success: true, live: true, models: models.length ? models : defaultList });
      }

      if (provider === 'custom' && customEndpoint) {
        const modelsUrl = customEndpoint.replace(/\/chat\/completions\/?$/, '/models');
        const upstream = await fetch(modelsUrl, {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        });
        if (!upstream.ok) {
          const errText = await upstream.text();
          throw new Error(`Custom endpoint returned ${upstream.status}: ${errText.slice(0, 150)}`);
        }
        const data = await upstream.json();
        const models = (data.data || [])
          .map((m: any) => ({ id: m.id, name: m.id, description: `Custom model (${m.id})` }));
        return res.json({ success: true, live: true, models: models.length ? models : defaultList });
      }

      return res.json({ success: true, live: false, models: defaultList });
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : String(err);
      const sanitized = rawMsg.replaceAll(apiKey, '[REDACTED_KEY]');
      return res.json({
        success: false,
        live: false,
        error: sanitized,
        models: defaultList,
      });
    }
  }

  return {
    handleEvaluateRequest,
    handleQuestionsListRequest,
    handleModelsDiscoveryRequest,
  };
}

export const defaultEvaluationHandlers = createEvaluationHandlers();
