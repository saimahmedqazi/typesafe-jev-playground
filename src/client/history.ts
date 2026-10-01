/**
 * Browser-Local Experiment History Manager.
 *
 * Implements persistent local storage for JEV evaluation experiments with
 * strict zero-credential guarantees.
 */

import { ExecutionMode, JevResult, QuestionPrimitiveType } from '../core';

export const HISTORY_STORAGE_KEY = 'typesafe_jev_experiment_history';
export const MAX_HISTORY_ITEMS = 50;

export interface ExperimentRecord {
  id: string;
  timestamp: string;
  mode: ExecutionMode;
  questionId: string;
  questionName: string;
  questionType: QuestionPrimitiveType;
  state: Record<string, unknown>;
  modelConfig?: {
    provider: string;
    model: string;
    temperature?: number;
  };
  result: JevResult;
  metadata: {
    durationMs: number;
    requestId: string;
    provider?: string;
    model?: string;
    tokenUsage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
    };
  };
}

const SUSPICIOUS_CREDENTIAL_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{12,}/i,
  /AIza[0-9A-Za-z_-]{20,}/,
  /jev_[a-zA-Z0-9_-]{10,}/i,
  /bearer\s+[a-zA-Z0-9._-]{10,}/i,
];

/**
 * Asserts that an experiment record contains no API keys or credentials.
 * Throws an error if any prohibited credential pattern is detected.
 */
export function assertNoSecretInRecord(record: unknown): void {
  const serialized = JSON.stringify(record);

  for (const pattern of SUSPICIOUS_CREDENTIAL_PATTERNS) {
    if (pattern.test(serialized)) {
      throw new Error('Security Invariant Violation: Attempted to store API key in local experiment history.');
    }
  }
}

/**
 * Loads experiment history records from browser localStorage.
 */
export function loadExperimentHistory(): ExperimentRecord[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('Failed to load experiment history from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new experiment record into localStorage while ensuring zero credential persistence
 * and capping history size.
 */
export function saveExperimentRecord(
  data: Omit<ExperimentRecord, 'id' | 'timestamp'>
): ExperimentRecord {
  const newRecord: ExperimentRecord = {
    ...data,
    id: `exp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  // Verify zero credential leakage invariant
  assertNoSecretInRecord(newRecord);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const existing = loadExperimentHistory();
      const updated = [newRecord, ...existing.filter((r) => r.id !== newRecord.id)].slice(0, MAX_HISTORY_ITEMS);
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to persist experiment record to localStorage:', err);
    }
  }

  return newRecord;
}

/**
 * Deletes a single experiment record by ID from localStorage.
 */
export function deleteExperimentRecord(id: string): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    const existing = loadExperimentHistory();
    const updated = existing.filter((r) => r.id !== id);
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to delete experiment record from localStorage:', err);
  }
}

/**
 * Clears all experiment history records from localStorage.
 */
export function clearExperimentHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }

  try {
    window.localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear experiment history from localStorage:', err);
  }
}
