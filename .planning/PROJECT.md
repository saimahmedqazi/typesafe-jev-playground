# TypeSafe Jev Playground

## What This Is

TypeSafe Jev Playground is a comprehensive, production-quality, full-stack TypeScript experimentation workbench and developer laboratory for JEV (Judgment, Evaluation, and Verification) logic. It enables developers to learn, practice, experiment with, and prototype JEV concepts without requiring direct Jev API access or licensing by providing an **LLM Practice Mode** (powered by the developer's own LLM API key), alongside a **Native Jev Mode** for users with authorized Jev infrastructure credentials.

## Core Value

A developer can practice and experiment with JEV concepts (State, Atomic Questions, Noul, Score, and typed evaluations) using their own LLM API key without native Jev access, while native Jev users can execute against actual Jev infrastructure.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] **EXEC-01**: Explicit Execution Mode abstraction distinguishing LLM Practice Mode and Native Jev Mode with clear semantic boundaries (no false equivalence).
- [ ] **EXEC-02**: BYO Key architecture with ephemeral client-side credential handling (memory only, never persisted, never logged, passed via secure headers).
- [ ] **EXEC-03**: Strict repository-owner cost isolation with zero silent fallback to owner/maintainer credentials.
- [ ] **DOMAIN-01**: Strongly typed JEV domain model covering State (JSON), Atomic Questions (Noul, Score), Evaluation Context, and Typed Results.
- [ ] **REG-01**: Typed Question Registry treating questions as first-class registered definitions with state validation and typed result schemas.
- [ ] **REG-02**: Initial registered question definitions for `is_sandwich` (Noul: boolean) and `new_score_1` (Score: 0-1 numeric) using generic question architecture.
- [ ] **ADAPT-01**: Decoupled Execution Adapter architecture separating evaluation semantics from execution backends (`LLMExecutionAdapter`, `NativeJevExecutionAdapter`).
- [ ] **LLM-01**: Multi-provider LLM adapter supporting OpenAI, Anthropic, and Google Gemini with structured output generation and schema enforcement.
- [ ] **VAL-01**: Server-side runtime validation of states, questions, requests, and external LLM outputs using Zod, handling malformed model responses gracefully.
- [ ] **API-01**: Strongly typed evaluation endpoint (`POST /api/evaluate`) with structured error codes and sanitized responses (zero secret leakage).
- [ ] **UI-01**: Professional 3-column workbench interface (Configuration & Credentials, Question & State Workspace, Result Inspector & Execution Trace).
- [ ] **UI-02**: Interactive JSON State Editor with formatting, syntax validation, preset loading, and error highlights.
- [ ] **HIST-01**: Browser-local experiment history enabling developers to inspect, re-run, load, and compare past evaluations (strictly omitting credentials).
- [ ] **TEST-01**: Comprehensive unit, integration, and security test suite verifying evaluation pipeline, credential safety, and error handling.

### Out of Scope

- User authentication / cloud accounts / SaaS billing — Workbench is designed for frictionless, anonymous local/web experimentation.
- Server-side persistent storage of states or API keys — Backend remains strictly stateless.
- Arbitrary chat / conversational interface — Application is an IDE/lab evaluation environment, not a chatbot.
- Silent fallback to maintainer keys — Absolute boundary to protect repository owners from unauthorized costs.
- False equivalence claims — LLM Practice Mode is documented as an educational approximation, not native Jev runtime guarantee.
- Complex graph workflows / multi-step agent pipelines in v1 — Focus on solid atomic question evaluation foundation.

## Context

- JEV provides an evaluation-centric paradigm where atomic questions (such as Noul for boolean classification and Score for continuous metrics) evaluate structured state into typed judgments.
- Developers often lack native Jev licenses or API access during initial discovery and prototyping.
- By providing an LLM Practice Mode where the developer brings their own API key (OpenAI, Anthropic, Gemini), the barrier to experimentation is lowered to near-zero.
- The project is initialized as a greenfield TypeScript application in `d:\typesafe-jev-playground` with Node 22, modern frontend tooling, and strict TypeScript verification.

## Constraints

- **Security**: API keys must remain strictly ephemeral. No logging, no URL query params, no local storage persistence for keys, no leakage in error payloads or traces.
- **Cost Isolation**: If no credential is provided, the system must halt and instruct the user to configure their key; never fallback to server keys.
- **SSR / Network Safety**: Backend LLM requests must target only validated, allowlisted official provider endpoints (no SSRF proxying).
- **Type Safety**: End-to-end strict TypeScript (`noImplicitAny`, strict null checks, discriminated unions) for requests, responses, and evaluation contexts.
- **Runtime Validation**: Dual-layer validation (client feedback + mandatory independent server validation via Zod).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Registered Question Definitions | Decouples questions from hardcoded strings/switches, enabling arbitrary future atomic questions | — Pending |
| Ephemeral BYOK via Secure Headers | Prevents storing user credentials anywhere on disk, in DBs, or in experiment logs | — Pending |
| Execution Adapter Pattern | Isolates provider-specific prompting and formatting from core JEV evaluation semantics | — Pending |
| Structured Outputs / Tool Calling for LLMs | Guarantees typed results (boolean for Noul, float for Score) rather than fragile free-text scraping | — Pending |
| Vertical MVP Phasing | Delivers a fully functional end-to-end slice early before adding advanced providers and features | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-01 after initialization*
