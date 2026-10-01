---
phase: 05-native-jev-adapter-integration
plan: 01
subsystem: adapters
tags: [typescript, adapters, native-jev, byok, security, routing]

requires: [04-01, 04-02]
provides:
  - NativeJevExecutionAdapter implementing ExecutionAdapter for official Jev infrastructure
  - Zero-crossover routing between LLM Practice Mode and Native Jev Mode
  - Clear user guidance when native credentials are missing
  - Supertest and Vitest test coverage verifying native evaluation and error categorization
affects: [phase-06, phase-07, phase-08]

actuals:
  tokens: 3800
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns: [native-infrastructure-adapter, mode-isolated-routing, secret-scrubbed-error-handling]

key-files:
  created:
    - src/adapters/native-jev-adapter.ts
    - tests/adapters/native-jev-adapter.test.ts
  modified:
    - src/adapters/index.ts
    - src/server/evaluate.ts
    - tests/server/evaluate.test.ts

key-decisions:
  - "Decoupled Native Jev execution strictly from LLM adapters: native mode invokes no LLMs or prompt compilers"
  - "Configured missing native credential response to guide developers toward LLM Practice Mode"
  - "Implemented secret-scrubbing on all native Jev network connection failures"

patterns-established:
  - "NativeJevExecutionAdapter connects to https://api.jev.ai/v1/evaluate with Bearer auth and optional x-jev-organization header"
  - "Dynamic fetch resolution ensures testability and prevents stale global fetch bindings"

requirements-completed: [ADAPT-04]

coverage:
  - id: N1
    description: "Native Jev execution adapter interface supporting credentials and execution against Jev infrastructure"
    requirement: ADAPT-04
    verification:
      - kind: integration
        ref: "tests/server/evaluate.test.ts"
        status: pass
    human_judgment: false
---

# Phase 05 Plan 01 Summary: Native Jev Adapter Integration

## Objectives Achieved
1. **Native Jev Execution Adapter (`src/adapters/native-jev-adapter.ts`)**:
   - Implemented `NativeJevExecutionAdapter` adhering to `ExecutionAdapter`.
   - `supportsMode` returns true only for `native-jev` mode.
   - Dispatches evaluation payloads directly to the official Jev infrastructure endpoint (`https://api.jev.ai/v1/evaluate`).
   - Forwards `Authorization: Bearer <apiKey>` and optional `x-jev-organization: <orgId>`.
   - Normalizes native responses into typed `JevResult` with `metadata.mode = 'native-jev'`.
   - Categorizes error codes (401/403 -> `INVALID_CREDENTIAL`, 404 -> `UNKNOWN_QUESTION`, 429 -> `RATE_LIMITED`).
   - Scrubs API keys from all caught error strings.
2. **Server Pipeline Routing (`src/server/evaluate.ts`)**:
   - Wired `nativeAdapter` alongside `llmAdapter` in `handleEvaluateRequest`.
   - Dispatches directly according to `mode`.
   - Provides clear feedback when native credentials are not provided, suggesting switching to LLM Practice Mode.
3. **Unit & Integration Verification**:
   - `tests/adapters/native-jev-adapter.test.ts` (8 tests): Verifies mode isolation, missing key guidance, response normalization, error mapping, and key scrubbing.
   - `tests/server/evaluate.test.ts`: Added end-to-end tests for `POST /api/evaluate` under `native-jev` mode.

## Verification Results
- `pnpm test`: 70/70 tests passing across 7 test suites.
- `pnpm run typecheck`: 0 errors.
- `pnpm run build`: built in 5.2s.
