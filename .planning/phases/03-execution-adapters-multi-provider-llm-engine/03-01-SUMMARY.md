---
phase: 03-execution-adapters-multi-provider-llm-engine
plan: 01
subsystem: adapters
tags: [typescript, adapters, prompt-engine, schemas, openai, anthropic, gemini]

requires: [02-01, 02-02]
provides:
  - ExecutionAdapter base interface and provider types
  - Strictly allowlisted provider endpoints for SSRF protection
  - JEV prompt compilation engine (buildEvaluationPrompt)
  - Multi-provider structured output schema definitions (OpenAI, Anthropic, Gemini)
  - Unit tests for prompt synthesis and schema structure
affects: [03-02, phase-04]

actuals:
  tokens: 3200
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns: [decoupled-execution-adapter, prompt-compilation-engine, provider-schema-mapping]

key-files:
  created:
    - src/adapters/types.ts
    - src/adapters/prompt.ts
    - src/adapters/schemas.ts
    - src/adapters/index.ts
    - tests/adapters/prompt-schema.test.ts
  modified: []

key-decisions:
  - "Hardcoded PROVIDER_ENDPOINTS as strictly allowlisted constants to prevent SSRF vulnerabilities"
  - "Decoupled prompt compilation from providers so system/user prompts are consistent across all LLMs"
  - "Implemented provider-specific schema wrappers (OpenAI strict json_schema, Anthropic tool definition, Gemini responseSchema)"

patterns-established:
  - "Adapters consume EvaluationContext and optional ephemeral credentials"
  - "Prompt engine formats JSON state inside markdown code blocks with explicit primitive guidelines"

requirements-completed: [ADAPT-01, ADAPT-02]

coverage:
  - id: A1
    description: "ExecutionAdapter interface separates evaluation semantics from backends"
    requirement: ADAPT-01
    verification:
      - kind: unit
        ref: "tests/adapters/prompt-schema.test.ts"
        status: pass
    human_judgment: false
  - id: A2
    description: "Prompt engine compiles AtomicQuestion and state into typed prompts with schemas"
    requirement: ADAPT-02
    verification:
      - kind: unit
        ref: "tests/adapters/prompt-schema.test.ts"
        status: pass
    human_judgment: false
---

# Phase 03 Plan 01 Summary: Execution Adapter Engine & Schema Synthesis

## Objectives Achieved
1. **Execution Adapter Contracts (`src/adapters/types.ts`)**:
   - Defined `ExecutionAdapter` interface with `supportsMode(mode)` and `execute(context, credentials)`.
   - Defined `PROVIDER_ENDPOINTS` with immutable, strictly allowlisted HTTPS URLs (`https://api.openai.com`, `https://api.anthropic.com`, `https://generativelanguage.googleapis.com`) to prevent SSRF.
   - Defined `PROVIDER_DEFAULT_MODELS` and `SUPPORTED_MODELS` catalog.
2. **Prompt Compilation Engine (`src/adapters/prompt.ts`)**:
   - Implemented `buildEvaluationPrompt(question, state)`.
   - Generates objective system prompt asserting JEV LLM Practice Mode boundaries and strict JSON formatting.
   - Injects formatted state, question metadata, and prompt instructions into user prompt.
3. **Multi-Provider Structured Schemas (`src/adapters/schemas.ts`)**:
   - Built `getBaseJsonSchema(question)` for Noul and Score primitives.
   - Implemented `getOpenAISchema(question)` producing strict OpenAI `response_format`.
   - Implemented `getAnthropicTool(question)` producing tool definition with input schema.
   - Implemented `getGeminiSchema(question)` producing Gemini OpenAPI `responseSchema`.
4. **Unit Verification (`tests/adapters/prompt-schema.test.ts`)**:
   - 8 unit tests verifying prompt synthesis, schema shapes, allowlisted endpoints, and default models.

## Verification Results
- `pnpm test`: 30/30 tests passing across all test suites.
- `pnpm run typecheck`: 0 errors.
