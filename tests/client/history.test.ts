import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_ITEMS,
  loadExperimentHistory,
  saveExperimentRecord,
  deleteExperimentRecord,
  clearExperimentHistory,
  assertNoSecretInRecord,
  ExperimentRecord,
} from '../../src/client/history';

describe('Experiment History Storage', () => {
  let mockStore: Record<string, string> = {};

  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      mockStore[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete mockStore[key];
    }),
    clear: vi.fn(() => {
      mockStore = {};
    }),
  };

  beforeEach(() => {
    mockStore = {};
    vi.stubGlobal('window', {
      localStorage: mockLocalStorage,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const sampleRecordData: Omit<ExperimentRecord, 'id' | 'timestamp'> = {
    mode: 'llm-practice',
    questionId: 'is_sandwich',
    questionName: 'Is Sandwich?',
    questionType: 'noul',
    state: { layers: ['bread', 'cheese', 'bread'], structure: 'stacked' },
    modelConfig: {
      provider: 'openai',
      model: 'gpt-4o-mini',
      temperature: 0,
    },
    result: {
      type: 'noul',
      value: true,
      explanation: 'State describes classic sandwich layers.',
      confidence: 0.98,
    },
    metadata: {
      durationMs: 412,
      requestId: 'req_123',
      provider: 'openai',
      model: 'gpt-4o-mini',
      tokenUsage: {
        promptTokens: 120,
        completionTokens: 25,
        totalTokens: 145,
      },
    },
  };

  it('saves and loads experiment records successfully', () => {
    const saved = saveExperimentRecord(sampleRecordData);

    expect(saved.id).toMatch(/^exp_\d+_[a-z0-9]+$/);
    expect(saved.timestamp).toBeDefined();
    expect(saved.questionId).toBe('is_sandwich');

    const loaded = loadExperimentHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(saved.id);
    expect(loaded[0].result.value).toBe(true);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      HISTORY_STORAGE_KEY,
      expect.stringContaining('is_sandwich')
    );
  });

  it('orders records newest first when multiple are saved', () => {
    const record1 = saveExperimentRecord({
      ...sampleRecordData,
      questionId: 'first_question',
    });

    const record2 = saveExperimentRecord({
      ...sampleRecordData,
      questionId: 'second_question',
    });

    const loaded = loadExperimentHistory();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].id).toBe(record2.id);
    expect(loaded[0].questionId).toBe('second_question');
    expect(loaded[1].id).toBe(record1.id);
    expect(loaded[1].questionId).toBe('first_question');
  });

  it('caps history at MAX_HISTORY_ITEMS, preserving the newest records', () => {
    for (let i = 0; i < MAX_HISTORY_ITEMS + 5; i++) {
      saveExperimentRecord({
        ...sampleRecordData,
        questionId: `question_${i}`,
      });
    }

    const loaded = loadExperimentHistory();
    expect(loaded).toHaveLength(MAX_HISTORY_ITEMS);
    expect(loaded[0].questionId).toBe(`question_${MAX_HISTORY_ITEMS + 4}`);
  });

  it('deletes a single experiment record by ID', () => {
    const r1 = saveExperimentRecord({ ...sampleRecordData, questionId: 'q1' });
    const r2 = saveExperimentRecord({ ...sampleRecordData, questionId: 'q2' });

    deleteExperimentRecord(r1.id);

    const loaded = loadExperimentHistory();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].id).toBe(r2.id);
  });

  it('clears all experiment history', () => {
    saveExperimentRecord(sampleRecordData);
    saveExperimentRecord(sampleRecordData);

    expect(loadExperimentHistory()).toHaveLength(2);

    clearExperimentHistory();

    expect(loadExperimentHistory()).toHaveLength(0);
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(HISTORY_STORAGE_KEY);
  });

  it('handles invalid or corrupted localStorage data gracefully', () => {
    mockStore[HISTORY_STORAGE_KEY] = 'not-json-content';
    const loaded = loadExperimentHistory();
    expect(loaded).toEqual([]);
  });

  describe('Security & Zero-Credential Invariants (assertNoSecretInRecord)', () => {
    it('accepts clean records without credentials', () => {
      expect(() => assertNoSecretInRecord(sampleRecordData)).not.toThrow();
    });

    it('rejects records containing OpenAI-like API keys', () => {
      const contaminated = {
        ...sampleRecordData,
        state: { apiKey: 'sk-proj-1234567890abcdefghijklmn' },
      };

      expect(() => assertNoSecretInRecord(contaminated)).toThrowError(
        /Security Invariant Violation/
      );
      expect(() => saveExperimentRecord(contaminated)).toThrowError(
        /Security Invariant Violation/
      );
    });

    it('rejects records containing Gemini-like API keys', () => {
      const contaminated = {
        ...sampleRecordData,
        state: { key: 'AIzaSyA123456789012345678901234' },
      };

      expect(() => assertNoSecretInRecord(contaminated)).toThrowError(
        /Security Invariant Violation/
      );
    });

    it('rejects records containing Jev-like API keys', () => {
      const contaminated = {
        ...sampleRecordData,
        state: { jevSecret: 'jev_live_abcdef123456789' },
      };

      expect(() => assertNoSecretInRecord(contaminated)).toThrowError(
        /Security Invariant Violation/
      );
    });

    it('rejects records containing Bearer tokens in serialized strings', () => {
      const contaminated = {
        ...sampleRecordData,
        result: {
          ...sampleRecordData.result,
          explanation: 'Evaluated with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 token',
        },
      };

      expect(() => assertNoSecretInRecord(contaminated)).toThrowError(
        /Security Invariant Violation/
      );
    });
  });
});
