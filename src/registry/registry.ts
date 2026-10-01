import { AtomicQuestion, QuestionPrimitiveType } from '../core/domain';
import { JevEvaluationError, EvaluationErrorCode } from '../core/errors';
import { IQuestionRegistry } from './types';

export class QuestionRegistry implements IQuestionRegistry {
  private questions = new Map<string, AtomicQuestion>();

  public register(question: AtomicQuestion): void {
    if (this.questions.has(question.id)) {
      throw new JevEvaluationError(
        EvaluationErrorCode.INVALID_REQUEST,
        `Question with ID "${question.id}" is already registered in registry.`,
        400
      );
    }
    this.questions.set(question.id, question);
  }

  public get(id: string): AtomicQuestion | undefined {
    return this.questions.get(id);
  }

  public has(id: string): boolean {
    return this.questions.has(id);
  }

  public list(filter?: { type?: QuestionPrimitiveType }): AtomicQuestion[] {
    const all = Array.from(this.questions.values());
    if (!filter || !filter.type) {
      return all;
    }
    return all.filter((q) => q.type === filter.type);
  }

  public clear(): void {
    this.questions.clear();
  }
}
