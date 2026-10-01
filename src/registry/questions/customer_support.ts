import { ChoiceQuestionDefinition, StateValidationResult } from '../../core/domain';

export const customerSupportQuestion: ChoiceQuestionDefinition = {
  id: 'customer_support',
  type: 'choice',
  name: 'Customer Support Routing',
  description:
    'Categorizes incoming customer support ticket states into billing, technical, or shipping departments.',
  expectedReturnType: 'string',
  choices: ['billing', 'technical', 'shipping'],
  promptInstruction: `Analyze the customer message and classify it into the appropriate handling team: billing, technical, or shipping.`,
  defaultState: {
    ticket_id: 'TCK-8921',
    customer: 'Apex Logistics',
    message:
      'The order arrived yesterday but it was broken. I want my money back immediately. This is our third delayed delivery this month.',
  },
  validateState(state: unknown): StateValidationResult {
    if (!state || typeof state !== 'object' || Array.isArray(state)) {
      return {
        valid: false,
        errors: ['State must be a non-null JSON object representing ticket attributes.'],
      };
    }
    const record = state as Record<string, unknown>;
    if (Object.keys(record).length === 0) {
      return {
        valid: false,
        errors: ['State object must contain ticket data.'],
      };
    }
    return { valid: true };
  },
};
