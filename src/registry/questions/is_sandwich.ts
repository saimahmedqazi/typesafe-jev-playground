import { NoulQuestionDefinition, StateValidationResult } from '../../core/domain';

export const isSandwichQuestion: NoulQuestionDefinition = {
  id: 'is_sandwich',
  type: 'noul',
  name: 'Is Sandwich',
  description:
    'Evaluates whether an item or state representation qualifies as a sandwich based on structural and compositional attributes.',
  expectedReturnType: 'boolean',
  promptInstruction: `You are evaluating whether a given state represents a "sandwich" according to JEV principles.
A sandwich typically requires:
1. A structural bread or carb enclosure (commonly two separate slices or a single split roll/bun).
2. A filling (protein, vegetable, cheese, or spread) contained between the bread layers.
3. Portable, hand-held orientation intended to be eaten without cutlery.

Evaluate the state and determine whether it strictly or plausibly constitutes a sandwich.
Provide a definitive boolean verdict (true/false) alongside confidence and concise reasoning.`,
  defaultState: {
    object: 'sandwich',
    bread: true,
    bread_type: 'sourdough',
    sliced_bread: true,
    layers: 2,
    filling: 'turkey, avocado, and swiss cheese',
    sauce: 'mustard',
    portable: true,
  },
  validateState(state: unknown): StateValidationResult {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return {
        valid: false,
        errors: ['State must be a non-null JSON object representing the item to evaluate.'],
      };
    }
    const record = state as Record<string, unknown>;
    const keys = Object.keys(record);
    if (keys.length === 0) {
      return {
        valid: false,
        errors: ['State object must not be empty.'],
      };
    }
    return { valid: true };
  },
};
