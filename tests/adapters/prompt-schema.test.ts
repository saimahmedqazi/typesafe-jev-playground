import { describe, it, expect } from 'vitest';
import { isSandwichQuestion } from '../../src/registry/questions/is_sandwich';
import { newScore1Question } from '../../src/registry/questions/new_score_1';
import { buildEvaluationPrompt } from '../../src/adapters/prompt';
import {
  getBaseJsonSchema,
  getOpenAISchema,
  getAnthropicTool,
  getGeminiSchema,
} from '../../src/adapters/schemas';
import { PROVIDER_ENDPOINTS, PROVIDER_DEFAULT_MODELS } from '../../src/adapters/types';

describe('Prompt and Schema Engine', () => {
  describe('buildEvaluationPrompt', () => {
    it('compiles system and user prompts for Noul question (is_sandwich)', () => {
      const state = { object: 'blt', bread: true, slices: 2, filling: ['bacon', 'lettuce', 'tomato'] };
      const { systemPrompt, userPrompt } = buildEvaluationPrompt(isSandwichQuestion, state);

      expect(systemPrompt).toContain('JEV Semantic Evaluation Engine');
      expect(systemPrompt).toContain('LLM Practice Mode');
      expect(systemPrompt).toContain('Strict Output Conformity');

      expect(userPrompt).toContain('ATOMIC QUESTION: Is Sandwich (is_sandwich)');
      expect(userPrompt).toContain('Question Primitive: NOUL');
      expect(userPrompt).toContain('"bread": true');
      expect(userPrompt).toContain('"slices": 2');
      expect(userPrompt).toContain(isSandwichQuestion.promptInstruction);
    });

    it('compiles system and user prompts for Score question (new_score_1)', () => {
      const state = { completeness: 0.9, freshness: 0.8, coherence: 0.85 };
      const { systemPrompt, userPrompt } = buildEvaluationPrompt(newScore1Question, state);

      expect(systemPrompt).toContain('JEV Semantic Evaluation Engine');
      expect(userPrompt).toContain('ATOMIC QUESTION: New Score 1 (new_score_1)');
      expect(userPrompt).toContain('Question Primitive: SCORE');
      expect(userPrompt).toContain('0.0 to 1.0');
      expect(userPrompt).toContain('"completeness": 0.9');
    });
  });

  describe('Structured JSON Schemas', () => {
    it('generates base JSON schema for Noul and Score', () => {
      const noulSchema = getBaseJsonSchema(isSandwichQuestion);
      expect(noulSchema.type).toBe('object');
      const noulProps = noulSchema.properties as Record<string, { type: string }>;
      expect(noulProps.value.type).toBe('boolean');
      expect(noulProps.confidence.type).toBe('number');
      expect(noulProps.rationale.type).toBe('string');

      const scoreSchema = getBaseJsonSchema(newScore1Question);
      expect(scoreSchema.type).toBe('object');
      const scoreProps = scoreSchema.properties as Record<string, { type: string }>;
      expect(scoreProps.value.type).toBe('number');
      expect(scoreProps.rationale.type).toBe('string');
    });

    it('generates OpenAI strict response_format for Noul and Score', () => {
      const openAiNoul = getOpenAISchema(isSandwichQuestion);
      expect(openAiNoul.type).toBe('json_schema');
      expect(openAiNoul.json_schema.strict).toBe(true);
      expect(openAiNoul.json_schema.name).toBe('jev_noul_evaluation');
      expect(openAiNoul.json_schema.schema.additionalProperties).toBe(false);

      const openAiScore = getOpenAISchema(newScore1Question);
      expect(openAiScore.type).toBe('json_schema');
      expect(openAiScore.json_schema.name).toBe('jev_score_evaluation');
    });

    it('generates Anthropic tool definition with input schema', () => {
      const anthropicTool = getAnthropicTool(isSandwichQuestion);
      expect(anthropicTool.name).toBe('submit_jev_evaluation');
      expect(anthropicTool.input_schema.type).toBe('object');
      expect(anthropicTool.input_schema.required).toContain('value');
      expect(anthropicTool.input_schema.required).toContain('rationale');
    });

    it('generates Gemini uppercase responseSchema', () => {
      const geminiNoul = getGeminiSchema(isSandwichQuestion);
      expect(geminiNoul.type).toBe('OBJECT');
      const noulProps = geminiNoul.properties as Record<string, { type: string }>;
      expect(noulProps.value.type).toBe('BOOLEAN');

      const geminiScore = getGeminiSchema(newScore1Question);
      expect(geminiScore.type).toBe('OBJECT');
      const scoreProps = geminiScore.properties as Record<string, { type: string }>;
      expect(scoreProps.value.type).toBe('NUMBER');
    });
  });

  describe('Provider Endpoints and Defaults', () => {
    it('contains strictly allowlisted HTTPS provider endpoints', () => {
      expect(PROVIDER_ENDPOINTS.openai).toBe('https://api.openai.com/v1/chat/completions');
      expect(PROVIDER_ENDPOINTS.anthropic).toBe('https://api.anthropic.com/v1/messages');
      expect(PROVIDER_ENDPOINTS.gemini).toBe('https://generativelanguage.googleapis.com/v1beta/models');
    });

    it('defines valid default models for all providers', () => {
      expect(PROVIDER_DEFAULT_MODELS.openai).toBeDefined();
      expect(PROVIDER_DEFAULT_MODELS.anthropic).toBeDefined();
      expect(PROVIDER_DEFAULT_MODELS.gemini).toBeDefined();
    });
  });
});
