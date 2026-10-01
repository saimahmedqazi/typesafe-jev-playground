import { ScoreQuestionDefinition, StateValidationResult } from '../../core/domain';

export const newScore1Question: ScoreQuestionDefinition = {
  id: 'new_score_1',
  type: 'score',
  name: 'New Score 1',
  description:
    'Computes a continuous quality/compatibility score (0.0 to 1.0) against given item state attributes.',
  expectedReturnType: 'number',
  scoreRange: [0, 1],
  promptInstruction: `You are evaluating a continuous quality, freshness, and compositional score (0.0 to 1.0) for the given state.
Evaluation guidelines:
- 1.0: Outstanding excellence, pristine freshness, complete ingredients, optimal execution.
- 0.7 - 0.9: High quality, desirable attributes, minor acceptable variances.
- 0.4 - 0.6: Average, mediocre, or standard baseline quality.
- 0.1 - 0.3: Degraded attributes, stale, poor balance, or missing key elements.
- 0.0: Complete failure, ruined, inedible, or wholly deficient state.

Evaluate the attributes and compute a normalized score strictly bounded between 0.0 and 1.0.`,
  defaultState: {
    item: 'gourmet sandwich',
    freshness: 0.95,
    ingredient_quality: 'premium',
    presentation: 'clean and well-layered',
    temperature: 'optimal',
    balance_ratio: 0.88,
  },
  validateState(state: unknown): StateValidationResult {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return {
        valid: false,
        errors: ['State must be a non-null JSON object representing item attributes to score.'],
      };
    }
    const record = state as Record<string, unknown>;
    if (Object.keys(record).length === 0) {
      return {
        valid: false,
        errors: ['State object must contain at least one attribute to evaluate.'],
      };
    }
    return { valid: true };
  },
};
