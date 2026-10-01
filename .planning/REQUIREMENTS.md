# Requirements: TypeSafe Jev Playground

**Defined:** 2026-10-01
**Core Value:** A developer can practice and experiment with JEV concepts (State, Atomic Questions, Noul, Score, and typed evaluations) using their own LLM API key without native Jev access, while native Jev users can execute against actual Jev infrastructure.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Core Execution Modes & Security (EXEC)

- [x] **EXEC-01**: Explicit Execution Mode abstraction distinguishing LLM Practice Mode and Native Jev Mode with clear semantic boundaries.
- [x] **EXEC-02**: BYO Key architecture with ephemeral client-side credential handling (memory only, never persisted to disk/DB, sent via headers).
- [x] **EXEC-03**: Zero hidden cost fallback (maintainer credentials are never used as fallback for public/user requests).
- [ ] **EXEC-04**: Rate limiting, request size limits, and fixed provider endpoint allowlisting to prevent abuse and SSRF.

### JEV Domain Model & Primitives (DOMAIN)

- [x] **DOMAIN-01**: Strongly typed Atomic Question interfaces (`NoulQuestion`, `ScoreQuestion`, extensible to future primitives).
- [x] **DOMAIN-02**: Strongly typed State representation and Evaluation Context models.
- [x] **DOMAIN-03**: Discriminated union typed evaluation results and structured metadata.

### Question Registry & Initial Primitives (REG)

- [ ] **REG-01**: Generic typed Question Registry decoupling question definitions from hardcoded switches.
- [ ] **REG-02**: Initial Noul registered question definition: `is_sandwich` with validation and typed boolean result schema.
- [ ] **REG-03**: Initial Score registered question definition: `new_score_1` with validation and typed numeric (0-1) result schema.
- [ ] **REG-04**: Preset state catalog providing example states and question configurations for rapid experimentation.

### Execution Adapters & LLM Practice Engine (ADAPT)

- [ ] **ADAPT-01**: Common Execution Adapter interface (`ExecutionAdapter`) decoupling JEV evaluation semantics from backends.
- [ ] **ADAPT-02**: LLM Practice Adapter implementing structured JEV prompting, tool/structured output formatting, and response parsing.
- [ ] **ADAPT-03**: Multi-provider LLM support for OpenAI, Anthropic, and Google Gemini.
- [ ] **ADAPT-04**: Native Jev execution adapter interface supporting credentials and execution against Jev infrastructure.

### Server API & Runtime Validation (API)

- [ ] **API-01**: Strongly typed `/api/evaluate` endpoint validating requests with Zod schemas.
- [ ] **API-02**: Server-side runtime validation of external LLM responses against expected question output schemas.
- [ ] **API-03**: Structured error model with standardized machine-readable error codes and zero credential/stack trace leakage.

### Workbench Frontend & State Workspace (UI)

- [ ] **UI-01**: Professional 3-column responsive developer workbench layout (Configuration, Workspace, Result Inspector).
- [ ] **UI-02**: Execution mode selector (LLM Practice vs Native Jev) with dynamic provider/model/credential configuration.
- [ ] **UI-03**: Interactive JSON State Editor with syntax validation, formatting, reset, and preset loaders.
- [ ] **UI-04**: Question selection workspace with question details, expected return types, and run controls.
- [ ] **UI-05**: Result Inspector displaying typed result, duration, model metadata, and sanitized execution trace.

### Experimentation History & UX (HIST)

- [ ] **HIST-01**: Browser-local experiment history allowing reload, re-run, and inspection of past runs.
- [ ] **HIST-02**: Zero-credential persistence in experiment history (credentials strictly omitted from local records).

### Testing & Verification (TEST)

- [ ] **TEST-01**: Unit test suite for question registry, state validation, adapters, and output parsing.
- [ ] **TEST-02**: Integration test suite for `/api/evaluate` covering both modes, valid/invalid states, and error scenarios.
- [ ] **TEST-03**: Security test suite verifying no credentials appear in logs, responses, history, or errors.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Composition & Comparison

- **V2-01**: Multi-question sequential evaluation pipeline (Noul -> Score chaining).
- **V2-02**: Parallel atomic question batch evaluation across multiple states (table view).
- **V2-03**: Visual side-by-side experiment comparison and diffing (state diff, model diff).
- **V2-04**: Custom user-defined question builder in UI.
- **V2-05**: Export experiment configurations as standalone TypeScript/SDK code snippets.

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / SaaS auth / billing | Workbench is designed for frictionless, anonymous local/web experimentation |
| Persistent cloud database for states/keys | Backend remains strictly stateless for security and privacy |
| Chatbot / conversational interface | Application is a developer evaluation lab / IDE, not a chat tool |
| Silent maintainer fallback key | Strict security and cost boundary to prevent unauthorized owner billing |
| Identical output claim | LLM Practice Mode is documented as an educational approximation, not native Jev guarantee |
| Speculative multi-agent orchestration | Premature complexity; atomic question evaluation must be perfected first |

## Traceability

Which phases cover which requirements. Populated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| EXEC-01 | Phase 1 | Complete |
| EXEC-02 | Phase 1 | Complete |
| EXEC-03 | Phase 1 | Complete |
| EXEC-04 | Phase 4 | Pending |
| DOMAIN-01 | Phase 1 | Complete |
| DOMAIN-02 | Phase 1 | Complete |
| DOMAIN-03 | Phase 1 | Complete |
| REG-01 | Phase 2 | Pending |
| REG-02 | Phase 2 | Pending |
| REG-03 | Phase 2 | Pending |
| REG-04 | Phase 2 | Pending |
| ADAPT-01 | Phase 3 | Pending |
| ADAPT-02 | Phase 3 | Pending |
| ADAPT-03 | Phase 3 | Pending |
| ADAPT-04 | Phase 5 | Pending |
| API-01 | Phase 4 | Pending |
| API-02 | Phase 4 | Pending |
| API-03 | Phase 4 | Pending |
| UI-01 | Phase 6 | Pending |
| UI-02 | Phase 6 | Pending |
| UI-03 | Phase 6 | Pending |
| UI-04 | Phase 6 | Pending |
| UI-05 | Phase 6 | Pending |
| HIST-01 | Phase 7 | Pending |
| HIST-02 | Phase 7 | Pending |
| TEST-01 | Phase 8 | Pending |
| TEST-02 | Phase 8 | Pending |
| TEST-03 | Phase 8 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0 ✓

---
*Requirements defined: 2026-10-01*
*Last updated: 2026-10-01 after initial definition*
