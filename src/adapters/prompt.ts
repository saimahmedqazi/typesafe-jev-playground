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
      : question.type === 'choice'
      ? [
          'Question Primitive: CHOICE (Categorical Selection from Alternatives)',
          `Available Choices: ${(question as any).choices && (question as any).choices.length > 0 ? (question as any).choices.map((c: string) => `"${c}"`).join(', ') : 'None specified'}`,
          'Expected Output: A string `value` matching one of the available choices, a `probabilities` object mapping each alternative choice to its probability (0.0 to 1.0, summing to ~1.0), a numeric `confidence` score (0.0 to 1.0), and a concise `rationale`.',
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

/**
 * Builds system and user prompts for evaluating an official TypeSafe AI questions map against target state.
 */
export function buildMultiQuestionEvaluationPrompt(
  questions: Record<string, any>,
  state: unknown
): EvaluationPrompt {
  const systemPrompt = [
    'You are the TypeSafe AI JEV Decision Engine in LLM Practice Mode.',
    'Your task is to evaluate a target state against one or more atomic questions and produce typed, calibrated decisions with probabilities.',
    '',
    'Operational Principles:',
    '1. Practice Mode Fidelity: You simulate official TypeSafe AI Jev evaluation semantics.',
    '2. Three Primitives:',
    '   - noul: Probabilistic boolean judgment. Return float `noul` (probability true between 0.0 and 1.0), boolean `verdict`, and optional `rationale`.',
    '   - score: Continuous ordered metric. Return float `score` (0.0 to 1.0), `legend` label, and `probabilities` distribution across rubric levels.',
    '   - choice: Categorical selection. Return string `choice` matching one of the candidate options, `probabilities` distribution across all choices (summing to ~1.0), `confidence` (0.0 to 1.0), and optional `rationale`.',
    '3. Strict Output Conformity: Output ONLY valid JSON containing an `answers` object mapping each question ID to its answer.',
  ].join('\n');

  const formattedState = JSON.stringify(state, null, 2);
  const formattedQuestions = JSON.stringify(questions, null, 2);

  const userPrompt = [
    '# TARGET STATE',
    '```json',
    formattedState,
    '```',
    '',
    '# QUESTIONS TO EVALUATE',
    '```json',
    formattedQuestions,
    '```',
    '',
    'Evaluate each question in the questions map against the target state according to its instructions and criteria.',
    'Return your decision as a JSON object with this exact shape:',
    '```json',
    '{',
    '  "answers": {',
    '    "<question_key>": {',
    '      "type": "noul" | "score" | "choice",',
    '      "noul": 0.95,',
    '      "verdict": true,',
    '      "score": 0.85,',
    '      "legend": "level_name",',
    '      "choice": "option_name",',
    '      "probabilities": { ... },',
    '      "confidence": 0.95,',
    '      "rationale": "..."',
    '    }',
    '  }',
    '}',
    '```',
  ].join('\n');

  return {
    systemPrompt,
    userPrompt,
  };
}
