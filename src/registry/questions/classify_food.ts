import { ChoiceQuestionDefinition, StateValidationResult } from '../../core/domain';

export const classifyFoodQuestion: ChoiceQuestionDefinition = {
  id: 'classify_food',
  type: 'choice',
  name: 'Classify Food Category',
  description:
    'Categorizes a food or culinary item state into one of several mutually exclusive categories with probability distribution.',
  expectedReturnType: 'string',
  choices: ['Sandwich', 'Salad', 'Soup', 'Pastry', 'Beverage', 'Entree'],
  promptInstruction: `You are categorizing a culinary item state into one of the designated categories.
Available Categories:
- "Sandwich": Bread or carb structure enclosing a filling, handheld.
- "Salad": Mixed greens, vegetables, grains, or ingredients tossed with dressing.
- "Soup": Liquid-based dish prepared with broth, stock, vegetables, or meat.
- "Pastry": Baked dough confection, sweet or savory bakery item.
- "Beverage": Liquid drink or refreshment.
- "Entree": Main course meal requiring cutlery or plating.

Analyze the state attributes, select the single best fitting category from the available choices, and estimate the probability distribution across all categories.`,
  defaultState: {
    item: 'Chicken Caesar Wrap',
    enclosure: 'flour tortilla roll',
    filling: 'grilled chicken breast, romaine lettuce, shaved parmesan, croutons',
    dressing: 'creamy caesar dressing',
    temperature: 'chilled',
    handheld: true,
  },
  validateState(state: unknown): StateValidationResult {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return {
        valid: false,
        errors: ['State must be a non-null JSON object representing item attributes.'],
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
