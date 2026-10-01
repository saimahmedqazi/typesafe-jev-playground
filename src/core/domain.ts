/**
 * Core JEV Domain Models.
 *
 * Defines the fundamental abstractions: State, Atomic Question, Noul, Score,
 * Evaluation Context, and Discriminated Union Evaluation Results.
 */

import { ExecutionMode } from './modes';
import { ErrorDetails } from './errors';

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
  [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

export type State = Record<string, unknown>;

export type QuestionPrimitiveType = 'noul' | 'score' | 'choice';

/**
 * Noul Result: Represents a categorical or truth-value judgment (boolean).
 */
export interface NoulResult {
  type: 'noul';
  value: boolean;
  confidence?: number;
  explanation?: string;
  rawOutput?: unknown;
}

/**
 * Score Result: Represents a continuous normalized score (typically 0.0 to 1.0).
 */
export interface ScoreResult {
  type: 'score';
  value: number;
  range: [number, number];
  confidence?: number;
  explanation?: string;
  rawOutput?: unknown;
}

/**
 * Choice Result: Represents a selection from a predefined set of alternatives with probability distribution.
 */
export interface ChoiceResult {
  type: 'choice';
  value: string;
  choices: string[];
  probabilities?: Record<string, number>;
  confidence?: number;
  explanation?: string;
  rawOutput?: unknown;
}

export type JevResult = NoulResult | ScoreResult | ChoiceResult;

/**
 * State Validation Result produced when validating state against a question.
 */
export interface StateValidationResult {
  valid: boolean;
  errors?: string[];
}

/**
 * Base Atomic Question definition.
 */
export interface BaseQuestionDefinition {
  id: string;
  type: QuestionPrimitiveType;
  name: string;
  description: string;
  expectedReturnType: 'boolean' | 'number' | 'string';
  promptInstruction: string;
  defaultState?: State;
  validateState(state: unknown): StateValidationResult;
}

export interface NoulQuestionDefinition extends BaseQuestionDefinition {
  type: 'noul';
  expectedReturnType: 'boolean';
}

export interface ScoreQuestionDefinition extends BaseQuestionDefinition {
  type: 'score';
  expectedReturnType: 'number';
  scoreRange?: [number, number];
}

export interface ChoiceQuestionDefinition extends BaseQuestionDefinition {
  type: 'choice';
  expectedReturnType: 'string';
  choices: string[];
}

export type AtomicQuestion =
  | NoulQuestionDefinition
  | ScoreQuestionDefinition
  | ChoiceQuestionDefinition;

/**
 * Model Configuration for LLM Practice execution.
 */
export interface ModelConfig {
  provider: string;
  model: string;
  temperature?: number;
  customEndpoint?: string;
}

/**
 * Evaluation Context passed into execution adapters.
 * Note: Credentials are strictly isolated from the evaluation context model itself.
 */
export interface EvaluationContext {
  mode: ExecutionMode;
  questionId: string;
  questionType: QuestionPrimitiveType;
  state: State;
  modelConfig?: ModelConfig;
  choices?: string[];
  customQuestionText?: string;
}

/**
 * Metadata captured during evaluation execution.
 */
export interface EvaluationMetadata {
  durationMs: number;
  requestId: string;
  mode: ExecutionMode;
  provider?: string;
  model?: string;
  tokenUsage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  warnings?: string[];
  timestamp: string;
}

/**
 * Strongly typed evaluation response using a discriminated union.
 */
export type EvaluationResponse =
  | {
      success: true;
      result: JevResult;
      metadata: EvaluationMetadata;
    }
  | {
      success: false;
      error: ErrorDetails;
    };
