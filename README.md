# TypeSafe Jev Playground ⚡

> Full-stack TypeScript experimentation workbench and developer laboratory for **JEV** (Judgment, Evaluation, and Verification) logic.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-gray.svg)](https://expressjs.com/)
[![Vitest](https://img.shields.io/badge/Vitest-3.0-yellow.svg)](https://vitest.dev/)

---

## 📖 Overview

**TypeSafe Jev Playground** empowers developers to learn, practice, experiment with, and prototype JEV concepts without requiring direct Jev licensing or pre-provisioned infrastructure. 

It provides an **LLM Practice Mode** (powered by your own LLM API key) alongside a **Native Jev Mode** for users with authorized Jev credentials, maintaining strict semantic boundaries between educational approximations and native runtime executions.

### Core Value Proposition

- **Zero-Friction JEV Experimentation**: Prototype and test JEV evaluations (State, Atomic Questions, Noul, and Score) immediately using standard LLM providers (OpenAI, Anthropic, Gemini).
- **First-Class Native Jev Support**: Execute against authentic Jev infrastructure when credentials are provided.
- **Strict Ephemeral BYOK**: API keys exist strictly in client and transient memory during request evaluation. Keys are never saved to disk, never stored in databases, and never logged.
- **Repository Cost Isolation**: Guaranteed zero-fallback policy ensures maintainer credentials are never silently billed.
- **End-to-End Type Safety**: Strict TypeScript discriminated unions for domain states, evaluation requests, and typed results.

---

## 🧭 Dual Execution Modes

The workbench establishes an explicit semantic boundary between modes:

| Feature / Aspect | Mode A: LLM Practice Mode | Mode B: Native Jev Mode |
|---|---|---|
| **Primary Purpose** | Educational modeling, prototyping, and concept practice | Production-grade authoritative evaluation |
| **Required Key** | BYO LLM Key (OpenAI, Anthropic, Gemini) | Authorized Jev API Key |
| **Execution Backend** | LLM structured output / function calling adapter | Official Native Jev Runtime |
| **Semantic Guarantee** | Educational approximation; no false equivalence | Authentic Jev runtime judgment guarantee |
| **Cost Attribution** | Direct to user's LLM provider account | Direct to user's Jev organization account |

---

## 📐 JEV Domain Concepts

The playground implements the core tenets of the JEV paradigm:

- **State (`State`)**: Arbitrary JSON structure describing the context, entity, or scenario to be evaluated.
- **Atomic Questions (`AtomicQuestion`)**: Registered, self-contained evaluative definitions equipped with state validation logic and explicit return type schemas.
- **Noul Primitive (`NoulResult`)**: Discrete boolean judgment (`value: boolean`) with optional confidence rating and reasoning rationale.
- **Score Primitive (`ScoreResult`)**: Bounded continuous metric (`value: number`, e.g., `0.0`–`1.0`) with normalized range constraints and reasoning trace.
- **Evaluation Response (`EvaluationResponse`)**: Strongly typed discriminated union (`success: true` with typed result & execution metadata vs. `success: false` with structured error code).

---

## 🔒 Security & BYOK Architecture

1. **Ephemeral Key Transport**:
   - Credentials are submitted via dedicated HTTP headers (`x-user-llm-key`, `x-user-jev-key`, `x-user-llm-provider`, `x-user-jev-org`).
   - The server inspects headers in memory, executes the single evaluation request, and discards keys.
2. **Zero Maintainer Fallback**:
   - Requests without user-supplied credentials fail immediately with `MISSING_CREDENTIAL`.
   - The application does not contain or fall back to any environment-level master keys.
3. **Trace & Log Sanitization**:
   - Utility functions (`sanitizeSecret`, `sanitizeHeaders`) redact sensitive strings before trace serialization (`sk-...cdef`).

---

## 📂 Repository Structure

```text
typesafe-jev-playground/
├── src/
│   ├── client/               # React 19 frontend
│   │   ├── App.tsx           # 3-column workbench interface
│   │   ├── index.css         # Tailwind & custom workbench styles
│   │   └── main.tsx          # Client entrypoint
│   ├── core/                 # Shared domain logic & type definitions
│   │   ├── credentials.ts    # Ephemeral key contracts & redaction
│   │   ├── domain.ts         # State, Noul, Score & EvaluationContext
│   │   ├── errors.ts         # Standardized error taxonomy
│   │   ├── index.ts          # Core public exports
│   │   └── modes.ts          # Execution mode definitions
│   ├── registry/             # Atomic Question Registry & Presets
│   │   ├── presets/          # State presets (e.g. BLT, hot dog, burritos)
│   │   ├── questions/        # Registered atomic questions (is_sandwich, new_score_1)
│   │   ├── registry.ts       # Typed question registry & lookup
│   │   └── types.ts          # Question definition interfaces & types
│   └── server/               # Express backend API
│       └── index.ts          # Express server & /api/health endpoint
├── tests/
│   ├── core/                 # Core domain & credential tests
│   │   └── domain.test.ts    # Domain models, errors & credential sanitization tests
│   └── registry/             # Question registry & validation tests
│       └── registry.test.ts  # Registry lookup, question schemas & state validation
├── index.html                # Vite HTML shell
├── package.json              # Project scripts & dependencies
├── tsconfig.json             # Strict TypeScript configuration
└── vite.config.ts            # Vite bundler & API proxy configuration
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher (Node 22 recommended)
- **pnpm**: `v9.0.0` or higher (or `npm` / `yarn`)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/typesafe-jev-playground.git
   cd typesafe-jev-playground
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

### Running Locally

To launch both the backend server (`http://localhost:3001`) and frontend workbench (`http://localhost:5173`) concurrently:

```bash
pnpm dev
```

You can also run client or server independently:

```bash
# Frontend only (Vite dev server)
pnpm dev:client

# Backend only (Express with tsx watch)
pnpm dev:server
```

---

## 🧪 Testing & Verification

Run the test suite using [Vitest](https://vitest.dev/):

```bash
pnpm test
```

Perform strict TypeScript static type checks:

```bash
pnpm typecheck
```

Build the production client bundle:

```bash
pnpm build
```

---

## 📡 API Reference

### `GET /api/health`

Returns server health, active supported modes, and confirms zero maintainer fallback status.

**Sample Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-01T10:00:00.000Z",
  "supportedModes": [
    "llm-practice",
    "native-jev"
  ],
  "ownerFallbackEnabled": false,
  "version": "1.0.0",
  "description": "TypeSafe Jev Playground API"
}
```

### Ephemeral Header Specification

When triggering evaluations:

| Header Name | Type | Description |
|---|---|---|
| `x-user-llm-key` | `string` | Ephemeral API key for OpenAI, Anthropic, or Gemini |
| `x-user-llm-provider` | `'openai' \| 'anthropic' \| 'gemini'` | Provider selector for practice mode |
| `x-user-llm-endpoint` | `string` (optional) | Custom or enterprise gateway URL |
| `x-user-jev-key` | `string` | Ephemeral API key for official Jev runtime |
| `x-user-jev-org` | `string` (optional) | Jev organization / workspace ID |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
