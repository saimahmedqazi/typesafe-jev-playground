import { AtomicQuestion, QuestionPrimitiveType } from '../core/domain';

export interface IQuestionRegistry {
  /**
   * Registers a new atomic question definition.
   * Throws an error if a question with the same ID already exists.
   */
  register(question: AtomicQuestion): void;

  /**
   * Retrieves a question definition by ID.
   */
  get(id: string): AtomicQuestion | undefined;

  /**
   * Checks if a question ID is registered.
   */
  has(id: string): boolean;

  /**
   * Lists all registered questions, optionally filtered by primitive type.
   */
  list(filter?: { type?: QuestionPrimitiveType }): AtomicQuestion[];

  /**
   * Removes all registered questions (useful for tests).
   */
  clear(): void;
}
