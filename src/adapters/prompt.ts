/**
 * JEV Prompt Compilation Engine.
 *
 * Formats Atomic Question definitions and target states into structured LLM prompts.
 */

import { AtomicQuestion } from '../core';
import { EvaluationPrompt } from './types';

/**
 * Builds the system and user prompts for evaluating an atomic question against state.
 */
export function buildEvaluationPrompt(question: AtomicQuestion, state: unknown): EvaluationPrompt {
  const systemPrompt = [
    'You are the JEV Semantic Evaluation Engine in LLM Practice Mode.',
    'Your task is to perform an objective, deterministic evaluation of an atomic question against a provided JSON state representation.',
    '',
    'Operational Principles:',
    '1. Practice Mode Fidelity: You simulate JEV evaluation semantics for developers prototyping JEV workflows.',
    '2. Strict Output Conformity: You must output ONLY structured data matching the requested schema. No conversational filler, no extra text, no markdown backticks outside JSON.',
    '3. Evidence Grounding: Your judgment or score must be justified solely by the attributes present in the target state.',
  ].join('\n');

  const formattedState = JSON.stringify(state, null, 2);

  const primitiveGuidelines =
    question.type === 'noul'
      ? [
          'Question Primitive: NOUL (Categorical / Truth-Value Judgment)',
          'Expected Output: A boolean `value` (true or false), a numeric `confidence` score (0.0 to 1.0), and a concise `rationale`.',
        ].join('\n')
      : [
          'Question Primitive: SCORE (Continuous Normalized Metric)',
          'Expected Output: A continuous numeric `value` strictly within [0.0, 1.0], an optional `criteria_breakdown` mapping factor names to sub-scores, and a concise `rationale`.',
        ].join('\n');

  const userPrompt = [
    `# ATOMIC QUESTION: ${question.name} (${question.id})`,
    `Description: ${question.description}`,
    '',
    '## Evaluation Guidelines & Primitive Type',
    primitiveGuidelines,
    '',
    '## Question Instruction',
    question.promptInstruction,
    '',
    '## Target State to Evaluate',
    '```json',
    formattedState,
    '```',
    '',
    'Execute the evaluation now and return the result matching the schema.',
  ].join('\n');

  return {
    systemPrompt,
    userPrompt,
  };
}
