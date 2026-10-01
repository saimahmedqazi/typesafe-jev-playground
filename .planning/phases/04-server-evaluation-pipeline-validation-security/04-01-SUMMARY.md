---
phase: 04-server-evaluation-pipeline-validation-security
plan: 01
subsystem: api
tags: [typescript, express, zod, validation, evaluate-route, questions-route]

requires: [03-01, 03-02]
provides:
  - Zod request validation schema (EvaluateRequestBodySchema)
  - Runtime JevResult validation (validateEvaluationResult)
  - Ephemeral credential header extractor (extractEphemeralCredentials)
  - Route handlers for POST /api/evaluate and GET /api/questions
  - Vitest test suite verifying request validation and schema assertions
affects: [04-02, phase-05, phase-06]

actuals:
  tokens: 3400
  tasks: 3
  commits: 1

tech-stack:
  added: []
  patterns: [zod-request-validation, runtime-schema-assertion, header-credential-extraction]

key-files:
  created:
    - src/server/validation.ts
    - src/server/credentials.ts
    - src/server/evaluate.ts
    - tests/server/validation.test.ts
  modified: []

key-decisions:
  - "Enforced non-array, non-null object requirement on state representation via Zod refinement"
  - "Implemented dual extraction for ephemeral credentials (custom headers and fallback Authorization Bearer)"
  - "Asserted runtime output compliance ensuring Noul returns boolean and Score is bounded within [0, 1]"

patterns-established:
  - "Route controllers separate validation, authentication extraction, and adapter execution"
  - "GET /api/questions bundles registry metadata and state presets in a single discovery response"

requirements-completed: [API-01, API-02]

coverage:
  - id: V1
    description: "POST /api/evaluate validates request body using Zod and rejects malformed payloads"
    requirement: API-01
    verification:
      - kind: unit
        ref: "tests/server/validation.test.ts"
        status: pass
    human_judgment: false
  - id: V2
    description: "Server validates model outputs against question result schemas before responding"
    requirement: API-02
    verification:
      - kind: unit
        ref: "tests/server/validation.test.ts"
        status: pass
    human_judgment: false
---

# Phase 04 Plan 01 Summary: Server Validation & Evaluation Pipeline

## Objectives Achieved
1. **Zod Request Validation (`src/server/validation.ts`)**:
   - Implemented `EvaluateRequestBodySchema` validating `mode`, `questionId`, `questionType`, `state`, and `modelConfig`.
   - Guaranteed `state` is a valid non-null, non-array object.
   - Built `validateEvaluationResult(question, result)` asserting return type fidelity (boolean for Noul, [0, 1] continuous for Score).
2. **Ephemeral Credential Extraction (`src/server/credentials.ts`)**:
   - Built `extractEphemeralCredentials` extracting `x-user-llm-key`, `x-user-llm-provider`, and `authorization` bearer tokens.
   - Built native Jev credential extraction (`x-user-jev-key`, `x-user-jev-org`).
3. **Route Handlers (`src/server/evaluate.ts`)**:
   - `handleEvaluateRequest`: Coordinates Zod parsing, credential verification, question lookup, execution adapter dispatch, and runtime output validation.
   - `handleQuestionsListRequest`: Exposes registered questions, metadata, and curated state presets.
4. **Unit Verification (`tests/server/validation.test.ts`)**:
   - 11 unit tests verifying payload validation, result schema enforcement, and credential extraction.

## Verification Results
- `pnpm test tests/server/validation.test.ts`: 11/11 passed.
- `pnpm run typecheck`: 0 errors.
