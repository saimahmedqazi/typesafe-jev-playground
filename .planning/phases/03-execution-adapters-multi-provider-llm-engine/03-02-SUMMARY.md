---
phase: 03-execution-adapters-multi-provider-llm-engine
plan: 02
subsystem: adapters
tags: [typescript, adapters, multi-provider, openai, anthropic, gemini, llm-adapter, security]

requires: [03-01]
provides:
  - OpenAI sub-adapter with strict json_schema formatting and token tracking
  - Anthropic sub-adapter with tool_use schema enforcement and token tracking
  - Google Gemini sub-adapter with responseSchema enforcement and token tracking
  - LLMExecutionAdapter coordinating validation, prompt compilation, provider execution, and result normalization
  - Vitest test suite verifying provider formatting, token metrics, error classification, and secret scrubbing
affects: [phase-04, phase-05, phase-06]

actuals:
  tokens: 4500
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns: [sub-adapter-dispatch, secret-scrubbing-pipeline, provider-error-classification, token-usage-normalization]

key-files:
  created:
    - src/adapters/providers/openai.ts
    - src/adapters/providers/anthropic.ts
    - src/adapters/providers/gemini.ts
    - src/adapters/llm-adapter.ts
    - tests/adapters/llm-adapter.test.ts
  modified:
    - src/adapters/index.ts

key-decisions:
  - "Enforced missing credential checks prior to any external network dispatch to prevent phantom calls"
  - "Standardized provider HTTP errors to JEV error codes (401/403 -> INVALID_CREDENTIAL, 429 -> RATE_LIMITED)"
  - "Guaranteed API key redaction in all caught error messages using string replacement and secret masking"

patterns-established:
  - "ExecutionAdapter dispatches through provider sub-adapters and returns strongly typed EvaluationResponse"
  - "Token metrics extracted consistently across OpenAI, Anthropic, and Gemini"

requirements-completed: [ADAPT-03]

coverage:
  - id: A3
    description: "Multi-provider LLM support for OpenAI, Anthropic, and Google Gemini with schema enforcement"
    requirement: ADAPT-03
    verification:
      - kind: unit
        ref: "tests/adapters/llm-adapter.test.ts"
        status: pass
    human_judgment: false
---

# Phase 03 Plan 02 Summary: Multi-Provider LLM Engine & Adapters

## Objectives Achieved
1. **OpenAI Provider Sub-Adapter (`src/adapters/providers/openai.ts`)**:
   - Dispatches POST requests to allowlisted `https://api.openai.com/v1/chat/completions`.
   - Injects `Authorization: Bearer <apiKey>` and `response_format` with strict JSON schema.
   - Extracts parsed JSON result and token usage (`prompt_tokens`, `completion_tokens`, `total_tokens`).
2. **Anthropic Provider Sub-Adapter (`src/adapters/providers/anthropic.ts`)**:
   - Dispatches POST requests to allowlisted `https://api.anthropic.com/v1/messages`.
   - Injects `x-api-key: <apiKey>` and `tools` with `tool_choice: { type: 'tool', name: 'submit_jev_evaluation' }`.
   - Extracts structured input from `tool_use` blocks and maps input/output tokens.
3. **Google Gemini Provider Sub-Adapter (`src/adapters/providers/gemini.ts`)**:
   - Dispatches POST requests to allowlisted `https://generativelanguage.googleapis.com/v1beta/models/...:generateContent?key=<apiKey>`.
   - Injects `generationConfig` with `responseMimeType: 'application/json'` and uppercase `responseSchema`.
   - Redacts query parameter API keys in any thrown network error.
   - Extracts parsed candidate text and token usage from `usageMetadata`.
4. **LLMExecutionAdapter (`src/adapters/llm-adapter.ts`)**:
   - Validates execution mode (`llm-practice`), guards against missing/empty credentials.
   - Resolves question from registry and validates state schema before network calls.
   - Dispatches to matching provider and normalizes output into typed `JevResult` (`NoulResult` or `ScoreResult`).
   - Computes execution `durationMs` and attaches `EvaluationMetadata`.
   - Comprehensive error handler wraps and sanitizes any thrown error, scrubbing API keys.
5. **Unit Test Suite (`tests/adapters/llm-adapter.test.ts`)**:
   - 10 unit tests covering mode guards, missing credentials, unknown questions, invalid states, OpenAI flow, Anthropic flow, Gemini flow, 401 mapping, 429 mapping, and raw key scrubbing.

## Verification Results
- `pnpm test`: 40/40 tests passing across all 4 test suites.
- `pnpm run typecheck`: 0 errors.
- `pnpm run build`: built in 6.8s.
