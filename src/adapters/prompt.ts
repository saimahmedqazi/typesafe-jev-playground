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
    'You are the TypeSafe AI JEV Semantic Evaluation Engine in LLM Practice Mode.',
    'Your function is to perform deterministic, calibrated, high-precision evaluations of state facts against formal question definitions.',
    '',
    'Core JEV Evaluation Semantics:',
    '1. Formal Criteria Adherence: Evaluate strictly against the provided criteria and state facts.',
    '2. JEV Rationale Discipline: Provide a concise, surgical rationale (1-2 sentences maximum). Be purely objective and formal with zero conversational filler, zero self-dialogue, and zero first-person pronouns.',
    '3. Strict Output Conformity: Output ONLY valid JSON matching the requested schema.',
  ].join('\n');

  const formattedState = JSON.stringify(state, null, 2);

  const primitiveGuidelines =
    question.type === 'noul'
      ? [
          'Question Primitive: NOUL (Calibrated Truth-Value Probability)',
          'Expected Output: A boolean `value` (true or false), a calibrated numeric `confidence` score (0.0 to 1.0), and a concise 1-2 sentence `rationale`.',
        ].join('\n')
      : question.type === 'choice'
      ? [
          'Question Primitive: CHOICE (Categorical Classification)',
          `Available Choices: ${(question as any).choices && (question as any).choices.length > 0 ? (question as any).choices.map((c: string) => `"${c}"`).join(', ') : 'None specified'}`,
          'Expected Output: A string `value` matching one of the available choices, a `probabilities` object mapping each alternative choice to its calibrated probability (summing to 1.0), a numeric `confidence` score, and a concise 1-2 sentence `rationale`.',
        ].join('\n')
      : [
          'Question Primitive: SCORE (Continuous Normalized Metric)',
          'Expected Output: A continuous numeric `value` strictly within [0.0, 1.0], an optional `criteria_breakdown` mapping factor names to sub-scores, and a concise 1-2 sentence `rationale`.',
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
    'You are the TypeSafe AI JEV Decision Engine (System 1 Neurosymbolic Evaluator).',
    'Your function is to perform deterministic, calibrated, high-precision evaluations of state facts against formal question definitions.',
    '',
    'Core JEV Evaluation Semantics:',
    '1. Formal Criteria Adherence: Evaluate strictly against the provided criteria and state facts. Resolve variables in backticks (e.g., `food`) directly from the target state.',
    '2. Three Typed Primitives:',
    '   - noul: Continuous logit / calibrated probability of truth (0.000 to 1.000). Set `verdict` to true if noul >= 0.5, false otherwise. Output calibrated probabilities (e.g., >= 0.95 or <= 0.05 when decisive).',
    '   - score: Continuous metric normalized between 0.000 and 1.000. If rubric levels are provided in criteria, assign the best-fitting `legend` and output calibrated `probabilities` across levels summing to 1.0.',
    '   - choice: Categorical classification. Select the exact option label in `choice`, and assign calibrated `probabilities` across all options summing to 1.0 with overall `confidence`.',
    '3. JEV Rationale Discipline:',
    '   - Surgical brevity: Exactly 1 to 2 sentences maximum per question.',
    '   - Grounded strictly in criteria and state attributes.',
    '   - Purely objective, formal, and analytical. Zero conversational filler, zero chain-of-thought rambling, zero meta-commentary, zero first-person pronouns ("I", "we", "let\'s").',
    '4. Output Contract: Return ONLY a valid JSON object matching the requested schema. No conversational preamble or trailing commentary.',
  ].join('\n');

  const formattedState = JSON.stringify(state, null, 2);
  const formattedQuestions = JSON.stringify(questions, null, 2);

  const userPrompt = [
    '# TARGET STATE',
    '```json',
    formattedState,
    '```',
    '',
    '# QUESTIONS DEFINITIONS',
    '```json',
    formattedQuestions,
    '```',
    '',
    'Evaluate each question in the questions map against the target state according to its instructions and criteria.',
    'Return your evaluation as a JSON object with this exact shape:',
    '```json',
    '{',
    '  "answers": {',
    '    "<question_key>": {',
    '      "type": "noul" | "score" | "choice",',
    '      "noul": 0.995,',
    '      "verdict": true,',
    '      "score": 0.85,',
    '      "legend": "level_name",',
    '      "choice": "option_name",',
    '      "probabilities": { "<option_or_level>": 0.85 },',
    '      "confidence": 0.95,',
    '      "rationale": "Direct, 1-2 sentence formal justification referencing state attributes and criteria."',
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
