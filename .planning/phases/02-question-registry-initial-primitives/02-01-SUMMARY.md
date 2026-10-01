---
phase: 02-question-registry-initial-primitives
plan: 01
subsystem: registry
tags: [typescript, registry, jev, atomic-questions, primitives]

requires: [01-02]
provides:
  - Generic question registry interface (IQuestionRegistry)
  - In-memory registry implementation (QuestionRegistry) with duplicate protection and type filtering
  - Singleton defaultQuestionRegistry instance
affects: [02-02, phase-03, phase-04]

actuals:
  tokens: 2800
  tasks: 2
  commits: 1

tech-stack:
  added: []
  patterns: [in-memory-registry, generic-question-catalog, dynamic-lookup-decoupling]

key-files:
  created:
    - src/registry/types.ts
    - src/registry/registry.ts
    - src/registry/index.ts
  modified: []

key-decisions:
  - "Decoupled question definition from evaluation engine through IQuestionRegistry abstraction to avoid hardcoded switch statements"
  - "Enforced duplicate registration rejection with explicit INVALID_REQUEST error codes"

patterns-established:
  - "Registry lookup pattern: list({ type?: 'noul' | 'score' }) and get(id)"

requirements-completed: [REG-01]

coverage:
  - id: R1
    description: "QuestionRegistry allows registering and querying questions without hardcoded switches"
    requirement: REG-01
    verification:
      - kind: unit
        ref: "tests/registry/registry.test.ts"
        status: pass
    human_judgment: false
---

# Phase 02 Plan 01 Summary: Question Registry Engine

## Objectives Achieved
1. **Registry Contracts (`src/registry/types.ts`)**:
   - Defined `IQuestionRegistry` with typed methods for `register`, `get`, `has`, `list`, and `clear`.
   - Exposed filtering contracts for retrieving questions by primitive type (`noul` vs `score`).
2. **Registry Implementation (`src/registry/registry.ts`)**:
   - Implemented `QuestionRegistry` backed by an in-memory `Map<string, AtomicQuestion>`.
   - Guaranteed duplicate prevention throwing `JevPlaygroundError` with `INVALID_REQUEST` code.
   - Implemented filtered and unfiltered listing.
3. **Singleton Export (`src/registry/index.ts`)**:
   - Initialized and exported `defaultQuestionRegistry` for application-wide dependency resolution.

## Verification
- Unit tested extensively in `tests/registry/registry.test.ts`.
- Validated TypeScript typing and build output via `pnpm run typecheck` and `pnpm run build`.
