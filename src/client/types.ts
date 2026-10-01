/**
 * Frontend Workbench State and Configuration Types.
 */

import { EvaluationResponse, LLMProviderType, QuestionPrimitiveType } from '../core';

export interface ClientPreset {
  id: string;
  name: string;
  description: string;
  questionId: string;
  state: Record<string, unknown>;
}

export interface ClientQuestion {
  id: string;
  name: string;
  type: QuestionPrimitiveType;
  description: string;
  expectedReturnType: 'boolean' | 'number';
  defaultState?: Record<string, unknown>;
  presets: ClientPreset[];
}

export interface WorkbenchConfig {
  mode: 'llm-practice' | 'native-jev';
  provider: LLMProviderType;
  model: string;
  temperature: number;
  llmApiKey: string;
  nativeJevKey: string;
  nativeOrgId: string;
}

export interface WorkbenchHealth {
  status: string;
  timestamp: string;
  supportedModes: string[];
  ownerFallbackEnabled: boolean;
  version: string;
  description: string;
}
