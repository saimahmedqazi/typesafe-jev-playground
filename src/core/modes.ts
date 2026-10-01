/**
 * Execution Mode Abstraction for TypeSafe Jev Playground.
 *
 * Explicitly separates LLM Practice Mode from Native Jev Mode with clear
 * semantic boundaries to avoid false equivalence claims.
 */

export type ExecutionMode = 'llm-practice' | 'native-jev';

export interface ExecutionModeMetadata {
  id: ExecutionMode;
  name: string;
  tagline: string;
  description: string;
  requiresLLMKey: boolean;
  requiresJevKey: boolean;
  semanticNotice: string;
}

export const EXECUTION_MODES: Record<ExecutionMode, ExecutionModeMetadata> = {
  'llm-practice': {
    id: 'llm-practice',
    name: 'LLM Practice Mode',
    tagline: 'BYO LLM API Key',
    description:
      'Practice JEV evaluation concepts, state modeling, and atomic questions using your own LLM API key (OpenAI, Anthropic, Gemini).',
    requiresLLMKey: true,
    requiresJevKey: false,
    semanticNotice:
      'LLM Practice Mode provides an educational and prototyping approximation of JEV semantics using general-purpose models. It does not claim or guarantee runtime identity with native Jev infrastructure.',
  },
  'native-jev': {
    id: 'native-jev',
    name: 'Native Jev Mode',
    tagline: 'Official Jev Access',
    description:
      'Execute atomic questions directly against official native Jev infrastructure using authorized Jev credentials.',
    requiresLLMKey: false,
    requiresJevKey: true,
    semanticNotice:
      'Native Jev Mode invokes authorized Jev APIs directly to produce authoritative Jev evaluation results.',
  },
};

export function isLLMPracticeMode(mode: string): mode is 'llm-practice' {
  return mode === 'llm-practice';
}

export function isNativeJevMode(mode: string): mode is 'native-jev' {
  return mode === 'native-jev';
}

export function isValidExecutionMode(mode: unknown): mode is ExecutionMode {
  return typeof mode === 'string' && (mode === 'llm-practice' || mode === 'native-jev');
}
