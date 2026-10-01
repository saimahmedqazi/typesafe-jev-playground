import { describe, it, expect } from 'vitest';
import {
  defaultQuestionRegistry,
  QuestionRegistry,
  isSandwichQuestion,
  newScore1Question,
  STATE_PRESETS,
  getPresetsForQuestion,
  getPresetById,
} from '../../src/registry';
import { JevEvaluationError, EvaluationErrorCode } from '../../src/core';

describe('Question Registry & Initial Primitives', () => {
  describe('QuestionRegistry', () => {
    it('initializes default registry with is_sandwich and new_score_1', () => {
      expect(defaultQuestionRegistry.has('is_sandwich')).toBe(true);
      expect(defaultQuestionRegistry.has('new_score_1')).toBe(true);

      const all = defaultQuestionRegistry.list();
      expect(all.length).toBeGreaterThanOrEqual(2);
      expect(all.map((q) => q.id)).toContain('is_sandwich');
      expect(all.map((q) => q.id)).toContain('new_score_1');
    });

    it('filters questions by primitive type (noul vs score)', () => {
      const noulQuestions = defaultQuestionRegistry.list({ type: 'noul' });
      expect(noulQuestions.every((q) => q.type === 'noul')).toBe(true);
      expect(noulQuestions.some((q) => q.id === 'is_sandwich')).toBe(true);

      const scoreQuestions = defaultQuestionRegistry.list({ type: 'score' });
      expect(scoreQuestions.every((q) => q.type === 'score')).toBe(true);
      expect(scoreQuestions.some((q) => q.id === 'new_score_1')).toBe(true);
    });

    it('prevents registering duplicate question IDs', () => {
      const customRegistry = new QuestionRegistry();
      customRegistry.register(isSandwichQuestion);

      expect(() => {
        customRegistry.register(isSandwichQuestion);
      }).toThrowError(JevEvaluationError);

      try {
        customRegistry.register(isSandwichQuestion);
      } catch (err: unknown) {
        expect((err as JevEvaluationError).code).toBe(EvaluationErrorCode.INVALID_REQUEST);
      }
    });

    it('retrieves individual questions safely', () => {
      const q = defaultQuestionRegistry.get('is_sandwich');
      expect(q).toBeDefined();
      expect(q?.id).toBe('is_sandwich');
      expect(q?.type).toBe('noul');
      expect(q?.expectedReturnType).toBe('boolean');

      const nonExistent = defaultQuestionRegistry.get('non_existent_question');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Initial Question Definitions', () => {
    describe('is_sandwich (Noul)', () => {
      it('has valid Noul metadata and boolean return type', () => {
        expect(isSandwichQuestion.id).toBe('is_sandwich');
        expect(isSandwichQuestion.type).toBe('noul');
        expect(isSandwichQuestion.expectedReturnType).toBe('boolean');
        expect(isSandwichQuestion.defaultState).toBeDefined();
      });

      it('validates state correctly', () => {
        expect(isSandwichQuestion.validateState({ bread: true, filling: 'cheese' }).valid).toBe(true);
        expect(isSandwichQuestion.validateState(null).valid).toBe(false);
        expect(isSandwichQuestion.validateState('not an object').valid).toBe(false);
        expect(isSandwichQuestion.validateState({}).valid).toBe(false);
      });
    });

    describe('new_score_1 (Score)', () => {
      it('has valid Score metadata and number return type with [0, 1] range', () => {
        expect(newScore1Question.id).toBe('new_score_1');
        expect(newScore1Question.type).toBe('score');
        expect(newScore1Question.expectedReturnType).toBe('number');
        expect(newScore1Question.scoreRange).toEqual([0, 1]);
        expect(newScore1Question.defaultState).toBeDefined();
      });

      it('validates state correctly', () => {
        expect(newScore1Question.validateState({ freshness: 0.9, quality: 'high' }).valid).toBe(true);
        expect(newScore1Question.validateState(null).valid).toBe(false);
        expect(newScore1Question.validateState({}).valid).toBe(false);
      });
    });
  });

  describe('State Presets Catalog', () => {
    it('contains comprehensive presets for both initial questions', () => {
      const isSandwichPresets = getPresetsForQuestion('is_sandwich');
      expect(isSandwichPresets.length).toBeGreaterThanOrEqual(3);
      expect(isSandwichPresets.map((p) => p.id)).toContain('classic-blt');
      expect(isSandwichPresets.map((p) => p.id)).toContain('bowl-of-soup');

      const newScore1Presets = getPresetsForQuestion('new_score_1');
      expect(newScore1Presets.length).toBeGreaterThanOrEqual(2);
      expect(newScore1Presets.map((p) => p.id)).toContain('pristine-state');
    });

    it('ensures every preset passes state validation for its target question', () => {
      for (const preset of STATE_PRESETS) {
        const question = defaultQuestionRegistry.get(preset.questionId);
        expect(question).toBeDefined();
        const validation = question!.validateState(preset.state);
        expect(validation.valid).toBe(true);
        expect(validation.errors).toBeUndefined();
      }
    });

    it('allows finding preset by ID', () => {
      const blt = getPresetById('classic-blt');
      expect(blt).toBeDefined();
      expect(blt?.name).toBe('Classic BLT Sandwich');
      expect(blt?.questionId).toBe('is_sandwich');
    });
  });
});
