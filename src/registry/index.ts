import { QuestionRegistry } from './registry';
import { isSandwichQuestion } from './questions/is_sandwich';
import { newScore1Question } from './questions/new_score_1';
import { classifyFoodQuestion } from './questions/classify_food';

export * from './types';
export * from './registry';
export * from './questions/is_sandwich';
export * from './questions/new_score_1';
export * from './questions/classify_food';
export * from './presets';

/**
 * Global default registry instance pre-loaded with the initial JEV question primitives.
 */
export const defaultQuestionRegistry = new QuestionRegistry();

// Bootstrap initial questions
defaultQuestionRegistry.register(isSandwichQuestion);
defaultQuestionRegistry.register(newScore1Question);
defaultQuestionRegistry.register(classifyFoodQuestion);
