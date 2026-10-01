# Roadmap: TypeSafe Jev Playground

## Overview

TypeSafe Jev Playground is an evaluation workbench for JEV logic enabling developers to learn and experiment using their own LLM API key (or native Jev credentials). This roadmap delivers a vertical MVP slice first (core domain models, evaluation adapters, server API, and workbench UI), followed by question registries (`is_sandwich`, `new_score_1`), native Jev integration, browser experiment history, and thorough verification testing.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation, Execution Modes & Domain Models** - Establish TypeScript project, core domain types, execution mode abstraction, and ephemeral credential isolation.
- [ ] **Phase 2: Question Registry & Initial Primitives** - Implement typed question registry, `is_sandwich` (Noul), and `new_score_1` (Score) definitions with state presets.
- [ ] **Phase 3: Execution Adapters & Multi-Provider LLM Engine** - Decoupled adapter layer supporting OpenAI, Anthropic, and Gemini with structured outputs.
- [ ] **Phase 4: Server Evaluation Pipeline, Validation & Security** - Robust `/api/evaluate` endpoint with Zod validation, rate limiting, and structured error responses.
- [ ] **Phase 5: Native Jev Adapter Integration** - Native Jev execution adapter with direct credential routing and clear setup fallback.
- [ ] **Phase 6: Developer Workbench UI & State Editor** - 3-column responsive IDE layout with JSON state editor, question runner, and result inspector.
- [ ] **Phase 7: Local Experiment History & Workflow Polish** - Client-side history storage, quick re-run, diff inspection, and credential exclusion.
- [ ] **Phase 8: Comprehensive Verification & Security Testing** - Unit, integration, and security test suite covering pipeline, credential hygiene, and error cases.

## Phase Details

### Phase 1: Foundation, Execution Modes & Domain Models
**Goal**: Scaffold full-stack TypeScript workspace, core JEV domain models, execution mode abstraction, and ephemeral credential handling.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: EXEC-01, EXEC-02, EXEC-03, DOMAIN-01, DOMAIN-02, DOMAIN-03
**Success Criteria** (what must be TRUE):
  1. Strongly typed domain interfaces for `AtomicQuestion`, `NoulQuestion`, `ScoreQuestion`, `EvaluationContext`, and `EvaluationResult` exist with strict type safety.
  2. Execution mode abstraction clearly differentiates `llm-practice` and `native-jev` without false equivalence claims.
  3. Ephemeral credential handling interface ensures client-held secrets are never written to disk, database, or logs.
  4. Project builds cleanly with strict TypeScript compiler options (`noImplicitAny`, strict null checks).
**Plans**: 2 plans

Plans:
- [x] 01-01: Project scaffolding, monorepo/package layout, build configuration, and base typing setup
- [x] 01-02: Core JEV domain types, execution mode models, and ephemeral credential isolation contracts

### Phase 2: Question Registry & Initial Primitives
**Goal**: Implement typed question registry and register `is_sandwich` (Noul) and `new_score_1` (Score) with state validation and presets.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: REG-01, REG-02, REG-03, REG-04
**Success Criteria** (what must be TRUE):
  1. Generic question registry allows registering and querying questions by ID and primitive type without hardcoded string branching.
  2. `is_sandwich` definition validates state and outputs typed boolean judgment.
  3. `new_score_1` definition validates state and outputs typed continuous score (0-1).
  4. Built-in preset states load reliably for both question definitions.
**Plans**: TBD

Plans:
- [x] 02-01: Typed Question Registry engine with state validation and schema resolution
- [x] 02-02: Initial question implementations (`is_sandwich`, `new_score_1`) and example state presets

### Phase 3: Execution Adapters & Multi-Provider LLM Engine
**Goal**: Implement execution adapter abstraction and multi-provider LLM adapter for OpenAI, Anthropic, and Gemini.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: ADAPT-01, ADAPT-02, ADAPT-03
**Success Criteria** (what must be TRUE):
  1. `ExecutionAdapter` interface isolates execution backends from JEV evaluation semantics.
  2. `LLMExecutionAdapter` produces structured prompts and tool schemas tailored to atomic question definitions.
  3. Adapters for OpenAI, Anthropic, and Gemini format requests and handle provider-specific nuances with endpoint allowlisting.
**Plans**: TBD

Plans:
- [x] 03-01: ExecutionAdapter base contracts and prompt/schema generation engine
- [x] 03-02: OpenAI, Anthropic, and Google Gemini adapter implementations with schema enforcement

### Phase 4: Server Evaluation Pipeline, Validation & Security
**Goal**: Build strongly typed `/api/evaluate` backend pipeline with Zod runtime validation, rate limiting, and structured error responses.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: EXEC-04, API-01, API-02, API-03
**Success Criteria** (what must be TRUE):
  1. `POST /api/evaluate` coordinates request validation, question lookup, adapter execution, and result normalization.
  2. External LLM outputs are validated against question result schemas, catching malformed outputs with clear error codes.
  3. Rate limiting and payload size limits reject abusive requests.
  4. Response payloads and server logs never leak API keys, authorization tokens, or raw stack traces.
**Plans**: TBD

Plans:
- [ ] 04-01: Server evaluation pipeline, Zod request/response validation, and sanitized error taxonomy
- [ ] 04-02: Abuse protection middleware (rate limiting, payload limits, SSRF endpoint restrictions)

### Phase 5: Native Jev Adapter Integration
**Goal**: Integrate Native Jev execution adapter using direct credentials and actual Jev execution routing.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: ADAPT-04
**Success Criteria** (what must be TRUE):
  1. `NativeJevExecutionAdapter` implements the common `ExecutionAdapter` interface.
  2. Native Jev credentials route directly to native execution without involving LLM adapters.
  3. Missing Jev credentials produce clear guidance on obtaining access without blocking LLM Practice Mode.
**Plans**: TBD

Plans:
- [ ] 05-01: Native Jev execution adapter contract, credential routing, and fallback handling

### Phase 6: Developer Workbench UI & State Editor
**Goal**: Deliver a responsive 3-column developer workbench UI with JSON state editor, question runner, and result inspector.
**Mode:** mvp
**Depends on**: Phase 5
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05
**Success Criteria** (what must be TRUE):
  1. Desktop 3-column layout provides Configuration, Question & State Workspace, and Result Inspector with dark mode.
  2. JSON state editor supports live syntax validation, indentation formatting, preset loaders, and reset actions.
  3. Developer can select execution mode, configure credentials in-memory, pick questions, and trigger evaluations.
  4. Result Inspector renders typed outputs, execution durations, usage tokens, and sanitized execution traces.
**Plans**: TBD

Plans:
- [ ] 06-01: Layout shell, theme/dark mode, configuration panel, and ephemeral credential state store
- [ ] 06-02: Interactive JSON State Editor with validation, formatting, and preset loader
- [ ] 06-03: Question runner, evaluation controls, Result Inspector, and execution trace viewer

### Phase 7: Local Experiment History & Workflow Polish
**Goal**: Implement browser-local experiment history, rapid iterative re-run workflow, and security verification on stored history.
**Mode:** mvp
**Depends on**: Phase 6
**Requirements**: HIST-01, HIST-02
**Success Criteria** (what must be TRUE):
  1. Evaluations are saved to local browser storage with timestamp, question, state, and typed result.
  2. User can reload or re-run any historical experiment into the workbench with one click.
  3. Local storage records are verified to never contain API keys or secret credentials.
**Plans**: TBD

Plans:
- [ ] 07-01: Local experiment history manager with re-run/load controls and zero-credential storage validation

### Phase 8: Comprehensive Verification & Security Testing
**Goal**: Build and run comprehensive unit, integration, and security test suites validating all core guarantees.
**Mode:** mvp
**Depends on**: Phase 7
**Requirements**: TEST-01, TEST-02, TEST-03
**Success Criteria** (what must be TRUE):
  1. Unit tests pass for question registry, state validation, output parsing, and execution adapters.
  2. Integration tests verify `POST /api/evaluate` end-to-end for both modes and all standardized error codes.
  3. Security test suite confirms zero credential leakage in logs, responses, error payloads, and client history.
**Plans**: TBD

Plans:
- [ ] 08-01: Unit and integration test suites with Vitest / Supertest
- [ ] 08-02: Automated credential security audit and end-to-end verification

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation, Execution Modes & Domain Models | 2/2 | Complete | 2026-10-01 |
| 2. Question Registry & Initial Primitives | 2/2 | Complete | 2026-10-01 |
| 3. Execution Adapters & Multi-Provider LLM Engine | 2/2 | Complete | 2026-10-01 |
| 4. Server Evaluation Pipeline, Validation & Security | 0/2 | Not started | - |
| 5. Native Jev Adapter Integration | 0/1 | Not started | - |
| 6. Developer Workbench UI & State Editor | 0/3 | Not started | - |
| 7. Local Experiment History & Workflow Polish | 0/1 | Not started | - |
| 8. Comprehensive Verification & Security Testing | 0/2 | Not started | - |
