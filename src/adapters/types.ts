/**
 * Execution Adapter Interfaces, Providers, and Endpoint Allowlists.
 *
 * Provides the decoupling layer between JEV domain semantics and external execution backends.
 */

import { ExecutionMode, EvaluationContext, EvaluationResponse, LLMProviderType, LLMUserCredentials, UserCredentials } from '../core';

export type LLMProvider = LLMProviderType;

export interface ModelOption {
  id: string;
  name: string;
  description: string;
}

/**
 * Strictly allowlisted provider API endpoints.
 * Prevents SSRF attacks by forbidding requests to arbitrary hosts.
 */
export const PROVIDER_ENDPOINTS = {
  openai: 'https://api.openai.com/v1/chat/completions',
  anthropic: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  groq: 'https://api.groq.com/openai/v1/chat/completions',
} as const;

/**
 * Recommended default models per provider for cost-effective JEV practice.
 */
export const PROVIDER_DEFAULT_MODELS: Record<LLMProvider, string> = {
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  gemini: 'gemini-1.5-flash',
  custom: 'default-model',
};

/**
 * Catalog of verified supported models per provider.
 */
export const SUPPORTED_MODELS: Record<LLMProvider, ModelOption[]> = {
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', description: 'Flagship Meta open-weights model on Groq LPU inference' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', description: 'Ultra low-latency fast evaluation model' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B 32k', description: 'High-speed MoE model on Groq' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B IT', description: 'Google Gemma 2 hosted on Groq' },
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Fast, cost-effective reasoning for rapid atomic evaluations' },
    { id: 'gpt-4o', name: 'GPT-4o', description: 'High-capability flagship model for complex state evaluations' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Legacy cost-effective model' },
  ],
  anthropic: [
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', description: 'Ultra-fast Anthropic model with strong reasoning' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', description: 'Industry-leading reasoning for subtle borderline cases' },
  ],
  gemini: [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'High-speed Google multimodal model optimized for latency' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning model with deep analytical capability' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Next-generation low-latency Google model' },
  ],
  custom: [
    { id: 'custom-model', name: 'Custom Model', description: 'Any model ID hosted on your OpenAI-compatible endpoint' },
  ],
};

/**
 * Generated prompt structure passed to LLMs.
 */
export interface EvaluationPrompt {
  systemPrompt: string;
  userPrompt: string;
}

/**
 * Normalized token usage across providers.
 */
export interface ProviderTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * Raw output and token usage extracted from a provider response before domain normalization.
 */
export interface ProviderExecutionResult {
  rawResult: unknown;
  tokenUsage?: ProviderTokenUsage;
  rawResponseText?: string;
}

/**
 * Core Execution Adapter contract.
 * Any execution backend (LLM practice, Native Jev, local mock) implements this interface.
 */
export interface ExecutionAdapter {
  readonly id: string;
  readonly name: string;

  /**
   * Returns true if this adapter can execute the requested execution mode.
   */
  supportsMode(mode: ExecutionMode): boolean;

  /**
   * Executes a JEV evaluation against the target backend.
   */
  execute(
    context: EvaluationContext,
    credentials?: LLMUserCredentials | UserCredentials
  ): Promise<EvaluationResponse>;
}
