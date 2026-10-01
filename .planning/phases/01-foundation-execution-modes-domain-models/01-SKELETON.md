# Walking Skeleton — TypeSafe Jev Playground

**Phase:** 1
**Generated:** 2026-10-01

## Capability Proven End-to-End

A developer can run `npm run dev` to start the unified development environment, load the application in a browser, see the active execution mode selection (`LLM Practice` vs `Native Jev`) with zero credentials configured, and have the client communicate with the backend health/routing endpoint proving type-safe connectivity.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime & Language | Node.js v22 + TypeScript (strict) | Native modern ESM, strict type checking, matches target environment |
| Frontend Framework | React 19 + Vite + Tailwind CSS | Fast HMR, component-driven, responsive developer workbench styling |
| Backend Framework | Node.js + Express + Zod | Lightweight, battle-tested HTTP API with schema validation and streaming/header support |
| Build & Dev Orchestration | Concurrently + tsx | Zero-friction single command (`npm run dev`) for full-stack developer experience |
| Test Runner | Vitest | High-speed ESM-native unit and integration testing with TypeScript support |
| Domain Type Boundaries | Shared Core (`src/core`) | Single source of truth for JEV domain models, execution modes, and results |
| Credential Storage Policy | Ephemeral Memory Only | Zero disk/DB storage, zero logging, transported via secure headers only |
| Fallback Policy | Strict Explicit Configuration | No silent maintainer/owner key fallback under any condition |

## Stack Touched in Phase 1

- [ ] Project scaffold (TypeScript, Vite, Express, Tailwind CSS, Vitest)
- [ ] Routing — `/api/health` and basic backend API route structure
- [ ] Domain Models — `src/core` with `ExecutionMode`, `AtomicQuestion`, `Noul`, `Score`, `EvaluationContext`, `EvaluationResult`
- [ ] UI — Initial workbench shell rendering execution mode indicators and status
- [ ] Dev runner — single `npm run dev` running client and server with proxy

## Out of Scope (Deferred to Later Slices)

- Live LLM API invocation (deferred to Phase 3 & 4)
- Question Registry implementations for `is_sandwich` and `new_score_1` (deferred to Phase 2)
- Monolithic state editor with Monaco/CodeMirror (deferred to Phase 6)
- LocalStorage experiment persistence (deferred to Phase 7)
- Native Jev SDK execution (deferred to Phase 5)

## Subsequent Slice Plan

Each later phase adds one vertical slice on top of this skeleton without altering its architectural decisions:

- **Phase 2**: Question Registry & Initial Primitives (`is_sandwich`, `new_score_1`, state presets)
- **Phase 3**: Execution Adapters & Multi-Provider LLM Engine (OpenAI, Anthropic, Gemini)
- **Phase 4**: Server Evaluation Pipeline, Zod Validation, Rate Limiting & Error Taxonomy
- **Phase 5**: Native Jev Adapter Integration
- **Phase 6**: Developer Workbench UI, JSON State Editor & Result Inspector
- **Phase 7**: Local Experiment History & Workflow Polish
- **Phase 8**: Comprehensive Verification & Security Testing
