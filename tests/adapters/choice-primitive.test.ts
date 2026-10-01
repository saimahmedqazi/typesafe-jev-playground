import { describe, it, expect, vi } from 'vitest';
import { getBaseJsonSchema, getGeminiSchema } from '../../src/adapters/schemas';
import { buildEvaluationPrompt } from '../../src/adapters/prompt';
import { LLMExecutionAdapter } from '../../src/adapters/llm-adapter';
import { executeOpenAI } from '../../src/adapters/providers/openai';
import { classifyFoodQuestion } from '../../src/registry/questions/classify_food';
import { ChoiceResult, EvaluationContext } from '../../src/core';
import { validateEvaluationResult } from '../../src/server/validation';

describe('Choice Primitive & Backoff Resilience', () => {
  it('generates correct JSON schema for Choice primitive with candidate choices', () => {
    const schema = getBaseJsonSchema(classifyFoodQuestion);
    expect(schema.type).toBe('object');
    expect(schema.properties).toHaveProperty('value');
    expect(schema.properties).toHaveProperty('probabilities');
    expect(schema.properties).toHaveProperty('confidence');
    expect(schema.properties).toHaveProperty('rationale');
    expect((schema.properties as any).value.enum).toEqual(classifyFoodQuestion.choices);
  });

  it('compiles evaluation prompt with candidate choices in guidelines', () => {
    const prompt = buildEvaluationPrompt(classifyFoodQuestion, classifyFoodQuestion.defaultState);
    expect(prompt.userPrompt).toContain('Question Primitive: CHOICE');
    expect(prompt.userPrompt).toContain('Available Choices: "Sandwich", "Salad", "Soup", "Pastry", "Beverage", "Entree"');
    expect(prompt.userPrompt).toContain('Chicken Caesar Wrap');
  });

  it('normalizes choice LLM output into typed ChoiceResult with probabilities', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                value: 'Soup',
                confidence: 0.94,
                rationale: 'Liquid broth dish served hot in a bowl.',
                probabilities: {
                  Soup: 0.94,
                  Salad: 0.04,
                  Sandwich: 0.02,
                },
              }),
            },
          },
        ],
        usage: { total_tokens: 120 },
      }),
    });

    const adapter = new LLMExecutionAdapter({ fetchFn: mockFetch as any });
    const context: EvaluationContext = {
      mode: 'llm-practice',
      questionId: 'classify_food',
      questionType: 'choice',
      state: { item: 'Tomato Soup', liquid: true },
      modelConfig: { provider: 'groq', model: 'qwen/qwen3.8-27b' },
    };

    const res = await adapter.execute(context, { mode: 'llm-practice', credentials: { apiKey: 'test-key', provider: 'groq' } });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.result.type).toBe('choice');
      const choiceRes = res.result as ChoiceResult;
      expect(choiceRes.value).toBe('Soup');
      expect(choiceRes.confidence).toBe(0.94);
      expect(choiceRes.probabilities?.Soup).toBe(0.94);
      expect(choiceRes.choices).toContain('Soup');
    }
  });

  it('parses output wrapped in markdown code blocks correctly', async () => {
    const markdownContent = '```json\n{\n  "value": "Sandwich",\n  "confidence": 0.98,\n  "rationale": "Enclosed between slices of bread."\n}\n```';
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: markdownContent } }],
      }),
    });

    const prompt = buildEvaluationPrompt(classifyFoodQuestion, {});
    const result = await executeOpenAI({
      apiKey: 'test-key',
      model: 'qwen/qwen3.8-27b',
      question: classifyFoodQuestion,
      prompt,
      fetchFn: mockFetch as any,
    });

    expect(result.rawResult).toEqual({
      value: 'Sandwich',
      confidence: 0.98,
      rationale: 'Enclosed between slices of bread.',
    });
  });

  it('retries with backoff on 429 rate limit and succeeds on subsequent attempt', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 429,
          headers: new Headers({ 'retry-after': '0.1' }),
          text: async () => 'Rate limit exceeded',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  value: 'Salad',
                  confidence: 0.91,
                  rationale: 'Tossed greens with vinaigrette.',
                }),
              },
            },
          ],
        }),
      };
    });

    const prompt = buildEvaluationPrompt(classifyFoodQuestion, {});
    const result = await executeOpenAI({
      apiKey: 'test-key',
      model: 'qwen/qwen3.8-27b',
      question: classifyFoodQuestion,
      prompt,
      fetchFn: mockFetch as any,
    });

    expect(callCount).toBe(2);
    expect((result.rawResult as any).value).toBe('Salad');
  });

  it('validates ChoiceResult in validateEvaluationResult correctly', () => {
    const validChoice: ChoiceResult = {
      type: 'choice',
      value: 'Sandwich',
      choices: ['Sandwich', 'Salad'],
      confidence: 0.95,
      explanation: 'Two slices of bread enclosing meat.',
    };

    const res = validateEvaluationResult(classifyFoodQuestion, validChoice);
    expect(res).toEqual(validChoice);
  });
});
