/**
 * Structured Output Schema Definitions for LLM Providers.
 *
 * Implements strict JSON schemas and tool call definitions for:
 * - OpenAI (json_schema structured outputs)
 * - Anthropic (tool_use schema)
 * - Google Gemini (responseSchema)
 */

import { AtomicQuestion } from '../core';

export interface OpenAISchemaFormat {
  type: 'json_schema';
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

export interface AnthropicToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties?: boolean;
  };
}

export interface GeminiSchemaDefinition {
  type: string;
  properties: Record<string, unknown>;
  required: string[];
}

/**
 * Returns the base JSON schema for a question primitive.
 */
export function getBaseJsonSchema(question: AtomicQuestion): Record<string, unknown> {
  if (question.type === 'noul') {
    return {
      type: 'object',
      properties: {
        value: {
          type: 'boolean',
          description: 'The categorical truth-value judgment (true or false).',
        },
        confidence: {
          type: 'number',
          description: 'Confidence in this judgment from 0.0 to 1.0.',
        },
        rationale: {
          type: 'string',
          description: 'Precise evidence-based rationale justifying the evaluation.',
        },
      },
      required: ['value', 'confidence', 'rationale'],
      additionalProperties: false,
    };
  }

  // Score primitive
  return {
    type: 'object',
    properties: {
      value: {
        type: 'number',
        description: 'Normalized continuous score strictly between 0.0 and 1.0.',
      },
      criteria_breakdown: {
        type: 'object',
        description: 'Sub-score breakdown across individual evaluation criteria.',
        additionalProperties: {
          type: 'number',
        },
      },
      rationale: {
        type: 'string',
        description: 'Precise evidence-based rationale explaining the assigned score.',
      },
    },
    required: ['value', 'rationale'],
    additionalProperties: false,
  };
}

/**
 * Returns OpenAI-compatible `response_format` configuration with strict schema enforcement.
 */
export function getOpenAISchema(question: AtomicQuestion): OpenAISchemaFormat {
  const schema = getBaseJsonSchema(question);

  return {
    type: 'json_schema',
    json_schema: {
      name: `jev_${question.type}_evaluation`,
      strict: true,
      schema: {
        ...schema,
        // In OpenAI strict mode, all defined properties must be listed in required
        required: Object.keys(schema.properties as Record<string, unknown>),
      },
    },
  };
}

/**
 * Returns Anthropic-compatible tool definition for tool-enforced JSON generation.
 */
export function getAnthropicTool(question: AtomicQuestion): AnthropicToolDefinition {
  const schema = getBaseJsonSchema(question);

  return {
    name: 'submit_jev_evaluation',
    description: `Submits the final structured JEV ${question.type.toUpperCase()} evaluation result.`,
    input_schema: {
      type: 'object',
      properties: schema.properties as Record<string, unknown>,
      required: schema.required as string[],
      additionalProperties: false,
    },
  };
}

/**
 * Returns Google Gemini-compatible `responseSchema` definition.
 */
export function getGeminiSchema(question: AtomicQuestion): GeminiSchemaDefinition {
  if (question.type === 'noul') {
    return {
      type: 'OBJECT',
      properties: {
        value: {
          type: 'BOOLEAN',
          description: 'Categorical truth-value judgment.',
        },
        confidence: {
          type: 'NUMBER',
          description: 'Confidence score from 0.0 to 1.0.',
        },
        rationale: {
          type: 'STRING',
          description: 'Clear rationale explaining the judgment.',
        },
      },
      required: ['value', 'rationale'],
    };
  }

  return {
    type: 'OBJECT',
    properties: {
      value: {
        type: 'NUMBER',
        description: 'Normalized continuous score between 0.0 and 1.0.',
      },
      rationale: {
        type: 'STRING',
        description: 'Clear rationale explaining the score.',
      },
    },
    required: ['value', 'rationale'],
  };
}
