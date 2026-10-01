# TypeSafe Jev Playground ⚡

> **The Free, Open-Source Developer Experimentation Workbench for [TypeSafe AI](https://typesafe.ai) (JEV).**  
> Learn, practice, and prototype JEV evaluation concepts (State, Atomic Questions, Noul, Score, Choice) using your own LLM API key (Groq, OpenAI, Anthropic, Gemini, or local Ollama) or connect directly to native Jev infrastructure.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-gray.svg)](https://expressjs.com/)
[![Vitest](https://img.shields.io/badge/Tests-102%20Passed-brightgreen.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero-Fallback BYOK](https://img.shields.io/badge/Security-Zero--Fallback%20BYOK-emerald.svg)](#-zero-fallback-byok--security)

---

## 🎯 The Real Problem This Project Solves

Developers interested in **TypeSafe AI** and the **JEV** (Judgment, Evaluation, and Verification) neurosymbolic paradigm need a hands-on environment to experiment with evaluation workflows. However:
- Access to official hosted environments may require enterprise licensing, permissions, or waiting for access.
- Most developers already hold general-purpose LLM API keys (such as **Groq**, **OpenAI**, **Anthropic**, or **Google Gemini**), but do not yet have a native Jev API key.

**TypeSafe Jev Playground** bridges this gap:
```text
Existing LLM API Key (Groq / OpenAI / Gemini / Anthropic / Ollama)
                          +
          JEV Concepts & Neurosymbolic Semantics
                          ↓
          TypeSafe Jev Developer Workbench
                          ↓
            State  +  Atomic Questions Map
                          ↓
           Noul  /  Score  /  Choice Primitives
                          ↓
         Calibrated Probabilities & Typed Results
                          ↓
         Prototype Real JEV Workflows for Free
```

> ⚠️ **Important Semantic Distinction:**  
> **LLM Practice Mode** provides an educational practice environment using LLM adapters to emulate JEV concepts. It does not falsely claim equivalence to official hosted Jev runtimes. Users with native access can toggle **Native Jev Mode** to run directly against official Jev infrastructure.

---

## ✨ Features

- **Aligned with Official Documentation**: Designed to mirror the official [TypeSafe AI Documentation](https://docs.typesafe.ai) and playground layout.
- **Pure Domain State**: State contains natural domain facts (`{"food": "Burger", ...}`) without artificial meta-tags.
- **Official Questions Map**: Multi-question evaluation support mapping question keys to instructions and criteria rubrics.
- **All 3 JEV Primitives**:
  - **`noul`**: Calibrated truth-value probabilities (`0.000`–`1.000`) with deterministic boolean thresholding (`verdict: true/false`).
  - **`score`**: Bounded continuous metrics (`0.000`–`1.000`) with rubric labels and probability distributions.
  - **`choice`**: Categorical classification with normalized probability distributions across options.
- **Authentic JEV System 1 Semantics**: Enforces surgical 1–2 sentence formal analytical rationales directly grounded in state attributes vs criteria rules (no conversational chatbot rambling).
- **Ultra-Fast with Groq LPUs**: Sub-second evaluations (~800ms) with automatic retry backoff and token-reset rate-limit handling.
- **100% Client-Held BYOK (Zero Server Persistence)**: API keys reside strictly in browser memory during requests and are never stored on disk, never written to databases, and never logged.
- **Official 2-Column Split Layout**: Line-numbered State and Questions editors on the left; official response decision table on the right.
- **Interactive Walkthrough Tour**: Built-in 4-step onboarding guide for developers new to JEV.
- **Browser-Local Experiment History**: Inspect past evaluations, compare metrics, and restore previous states with zero credential persistence.

---

## 🧭 Dual Execution Modes

| Feature / Aspect | Mode A: LLM Practice Mode | Mode B: Native Jev Mode |
|---|---|---|
| **Primary Purpose** | Educational learning, experimentation & prototyping | Authoritative production evaluation |
| **Required Key** | BYO LLM Key (Groq, OpenAI, Anthropic, Gemini, Ollama) | Authorized Jev API Key |
| **Default Model** | `qwen/qwen3.8-27b` (Groq), `gpt-4o-mini`, `claude-3-5-haiku` | `native-jev-systemone` |
| **Cost Attribution** | Direct to user's LLM provider account (or free via Groq) | Direct to user's Jev organization account |
| **Semantic Guarantee** | Educational simulation; no false equivalence | Official native Jev runtime judgment |

---

## 📐 Official JEV Product Model

```text
STATE (Domain Facts)
         +
QUESTIONS MAP (noul, score, choice)
         +
EXECUTION MODE (LLM Practice vs Native Jev)
         +
MODEL CONFIG (Provider, Model, Temperature)
         ↓
JEV EVALUATION ENGINE
         ↓
TYPED EVALUATION RESULT TABLE
```

### 1. State Definition
In official TypeSafe AI, state is pure domain context:
```json
{
  "food": "Burger",
  "definition": "A sandwich is defined as a dish consisting of fillings placed between two or more slices of bread, or a split roll or bun. The key components are a bread-like carrier and a distinct filling."
}
```

### 2. Questions Map Definition
Questions specify the primitive `type`, `instructions`, and `criteria`:
```json
{
  "is_sandwich": {
    "type": "noul",
    "instructions": "Is `food` a sandwich?",
    "criteria": {
      "true": "A sandwich is a kebab closed in bun",
      "false": "The food has no bread enclosing a filling or uses only a single slice of bread, or uses a non-bread wrapper such as a tortilla, wafer, or cookie."
    }
  }
}
```

### 3. Multi-Primitive Composition
You can evaluate multiple primitives simultaneously across a single state:
```json
{
  "department": {
    "type": "choice",
    "instructions": "Which team should handle this ticket?",
    "criteria": {
      "billing": "Payments, refunds, disputes, invoicing",
      "technical": "Software bugs, system outages, API issues",
      "shipping": "Damaged packages, logistics, carrier tracking"
    }
  },
  "frustration": {
    "type": "score",
    "instructions": "How frustrated is the customer on a scale of 0 to 1?",
    "criteria": ["Calm", "Frustrated", "Very angry"]
  },
  "is_urgent": {
    "type": "noul",
    "instructions": "Does this issue require urgent escalation?",
    "criteria": {
      "true": "Customer demands immediate refund or repeated failure",
      "false": "Routine query or standard processing"
    }
  }
}
```

---

## 🔒 Zero-Fallback BYOK & Security

1. **Zero Maintainer Fallback**:
   - The application does not contain or fall back to any environment-level master keys.
   - If a request is submitted without credentials, it is rejected with `MISSING_CREDENTIAL`.
2. **Ephemeral Memory-Only Transport**:
   - User keys are transmitted in HTTP headers (`x-user-llm-key`, `x-user-jev-key`).
   - Keys exist solely in transient process memory for the duration of the evaluation request and are immediately discarded.
3. **Leakage Audit & Sanitization**:
   - All errors and debug traces automatically scrub credential patterns (`sk-...`, `gsk_...`, `AIza...`, `jev_...`).
   - Covered by an automated security test suite (`tests/security/credential-leakage.test.ts`).

---

## 🚀 Quickstart

### Prerequisites

- **Node.js**: `v20.0.0` or higher (Node 22 recommended)
- **pnpm**: `v9.0.0` or higher (or `npm` / `yarn`)

### 1. Clone & Install

```bash
git clone https://github.com/saimahmedqazi/typesafe-jev-playground.git
cd typesafe-jev-playground
pnpm install
```

### 2. Run Locally

Start both the backend server (`http://localhost:3001`) and Vite frontend (`http://localhost:5173`):

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Configure Your Key & Evaluate

1. Click **Settings** or **API Keys** in the sidebar.
2. Select your provider:
   - **Groq** (Recommended for free, ~800ms lightning-fast evaluations): Provide your Groq key (`gsk_...`).
   - **OpenAI**: Provide your OpenAI key (`sk-...`).
   - **Anthropic / Gemini**: Provide your respective provider key.
   - **Custom / Local**: Connect to local Ollama (`http://localhost:11434/v1/chat/completions`) or vLLM.
3. Click **Run request (Ctrl+Enter)** to evaluate!

---

## 🧪 Testing & Quality Assurance

The workbench includes 102 comprehensive automated tests covering domain logic, question registries, providers, error scrubbing, and multi-question evaluation:

```bash
# Run full Vitest test suite
pnpm test

# Run strict TypeScript typechecking
pnpm typecheck

# Build production bundle
pnpm build
```

---

## 📡 REST API Reference

### `POST /api/evaluate`

Evaluates an official questions map or registered atomic question against a target state.

#### Request Headers
| Header | Required | Description |
|---|---|---|
| `Content-Type` | Yes | `application/json` |
| `x-user-llm-key` | Mode A | Ephemeral LLM API key |
| `x-user-llm-provider` | Mode A | `groq`, `openai`, `anthropic`, `gemini`, or `custom` |
| `x-user-llm-endpoint` | Optional | Custom OpenAI-compatible endpoint URL |
| `x-user-jev-key` | Mode B | Official Native Jev API key |

#### Sample Request Body
```json
{
  "mode": "llm-practice",
  "state": {
    "food": "Burger",
    "definition": "A sandwich is defined as a dish consisting of fillings placed between two or more slices of bread..."
  },
  "questions": {
    "is_sandwich": {
      "type": "noul",
      "instructions": "Is `food` a sandwich?",
      "criteria": {
        "true": "A sandwich is a kebab closed in bun",
        "false": "The food has no bread enclosing a filling..."
      }
    }
  },
  "modelConfig": {
    "provider": "groq",
    "model": "qwen/qwen3.8-27b",
    "temperature": 0
  }
}
```

#### Sample Response Body
```json
{
  "success": true,
  "result": {
    "type": "noul",
    "value": false,
    "confidence": 0.05,
    "explanation": "The target food 'Burger' is not a kebab, failing the specific true criterion."
  },
  "answers": {
    "is_sandwich": {
      "type": "noul",
      "noul": 0.05,
      "verdict": false,
      "confidence": 0.05,
      "rationale": "The target food 'Burger' is not a kebab, failing the specific true criterion."
    }
  },
  "metadata": {
    "durationMs": 818,
    "requestId": "eval_1790865008749_qvnbjm",
    "mode": "llm-practice",
    "provider": "groq",
    "model": "qwen/qwen3.8-27b",
    "tokenUsage": {
      "promptTokens": 733,
      "completionTokens": 95,
      "totalTokens": 828
    },
    "timestamp": "2026-10-01T14:30:08.749Z"
  }
}
```

---

## 🔗 Official References

- **TypeSafe AI Official Site**: [typesafe.ai](https://typesafe.ai)
- **Official Documentation**: [docs.typesafe.ai](https://docs.typesafe.ai)

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
