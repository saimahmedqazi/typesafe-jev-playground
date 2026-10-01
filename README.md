# TypeSafe Jev Playground ⚡

> **The Free, Open-Source Developer Experimentation Workbench for [TypeSafe AI](https://typesafe.ai) (JEV).**  
> Learn, practice, and prototype JEV evaluation concepts (State, Atomic Questions, Noul, Score, Choice) using standard LLM API keys (Groq, OpenAI, Anthropic, Gemini, or local Ollama), or connect native Jev credentials.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.4-646cff.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-gray.svg)](https://expressjs.com/)
[![Vitest](https://img.shields.io/badge/Tests-102%20Passed-brightgreen.svg)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Zero-Fallback BYOK](https://img.shields.io/badge/Security-Zero--Fallback%20BYOK-emerald.svg)](#-zero-fallback-byok--security)

---

> ⚠️ **CRITICAL ARCHITECTURAL & SEMANTIC NOTICE**  
> **This project provides an LLM-powered practice environment to learn, prototype, and experiment with JEV concepts — IT IS NOT THE ACTUAL JEV RUNTIME.**  
>  
> • **LLM Practice Mode (Default)**: Uses standard commodity LLMs (such as Groq's `qwen/qwen3.8-27b`, OpenAI, Anthropic, or local Ollama) as the underlying reasoning engine to emulate JEV evaluation workflows. It is built specifically so developers who do not have official Jev access can practice JEV concepts for free using API keys they already own. **It does NOT run TypeSafe AI's proprietary model weights or official hosted infrastructure.**  
> • **Native Jev Mode**: Provided for developers who hold authorized/official native Jev API credentials to execute directly against authentic TypeSafe AI Jev infrastructure.  
>  
> This workbench makes **zero false equivalence claims** between general-purpose LLM prompting and the actual proprietary TypeSafe AI Jev neurosymbolic engine.

---

## 🔍 Semantic Boundary: Practice Workbench vs. Actual Jev

This project adheres to a strict policy of architectural transparency and honesty:

| Dimension | Mode A: LLM Practice Mode | Mode B: Native Jev Mode |
|:---|:---|:---|
| **What is executing?** | Standard commodity LLMs (Groq, OpenAI, Gemini, Anthropic, Ollama) | Authentic TypeSafe AI Jev System 1 runtime |
| **Is this actual Jev?** | **No.** It is an educational practice / emulation layer | **Yes.** Executes against official Jev infrastructure |
| **Do I need a Jev license?** | **No.** Practice freely with any existing LLM key (e.g. free Groq key) | **Yes.** Requires authorized native Jev API credentials |
| **Primary purpose** | Learn JEV concepts, draft questions/criteria rubrics, and prototype workflows | Authoritative production evaluation with official Jev guarantees |
| **Equivalence guarantee?** | **No.** Emulates JEV concepts via structured prompting; makes no equivalence claim | **Yes.** Full native guarantees provided by TypeSafe AI |
| **Cost attribution** | Direct to your personal LLM provider (or free via Groq) | Direct to your official Jev organization account |

---

## 🎯 The Real Problem This Project Solves

Developers interested in **TypeSafe AI** and the **JEV** (Judgment, Evaluation, and Verification) neurosymbolic paradigm need a practical place to experiment with its programming and evaluation concepts. However:
- Access to official hosted environments may require enterprise licensing, approvals, account requirements, or waitlists.
- Many developers already hold general-purpose LLM API keys (such as **Groq**, **OpenAI**, **Anthropic**, or **Google Gemini**), but do not have native Jev API access at the stage when they are simply trying to learn and prototype.

**TypeSafe Jev Playground** bridges this gap:
```text
Existing LLM Key (Groq / OpenAI / Gemini / Anthropic / Ollama)
                          +
          JEV Concepts & Neurosymbolic Semantics
                          ↓
      TypeSafe Jev Practice Workbench (BYO LLM)
                          ↓
            State  +  Atomic Questions Map
                          ↓
           Noul  /  Score  /  Choice Primitives
                          ↓
         Calibrated Probabilities & Typed Results
                          ↓
       Prototype Real JEV Concepts Before Production
```

Developers can go from:
> *"Let me see how JEV works and how Noul, Score, and Choice operate."*

to:
> *"I can prototype a real JEV-powered evaluation workflow."*

without the official hosted playground being the limiting factor. When ready, validated concepts can transition directly to native Jev.

---

## ✨ Features

- **Aligned with Official Documentation**: Designed to mirror the layout, schemas, and interaction model from the official [TypeSafe AI Documentation](https://docs.typesafe.ai).
- **Pure Domain State**: State contains natural domain context (`{"food": "Burger", ...}`) without artificial meta-tags.
- **Official Questions Map**: Multi-question evaluation support mapping question keys to instructions and criteria rubrics.
- **All 3 JEV Primitives Supported**:
  - **`noul`**: Calibrated truth-value probabilities (`0.000`–`1.000`) with deterministic boolean thresholding (`verdict: true/false`).
  - **`score`**: Bounded continuous metrics (`0.000`–`1.000`) with rubric labels and probability distributions.
  - **`choice`**: Categorical classification with normalized probability distributions across options.
- **Authentic JEV System 1 Semantics**: Enforces surgical 1–2 sentence formal analytical rationales directly grounded in state attributes vs criteria rules (no conversational chatbot rambling).
- **Ultra-Fast with Groq LPUs**: Sub-second evaluations (~800ms) with automatic retry backoff and token-reset rate-limit handling.
- **100% Client-Held BYOK (Zero Server Persistence)**: API keys reside strictly in browser memory during requests and are never stored on disk, never written to databases, and never logged.
- **Official 2-Column Split Layout**: Line-numbered State and Questions editors on the left; official response decision table on the right.
- **Interactive Walkthrough Tour**: Built-in 4-step onboarding guide for developers new to JEV concepts.
- **Browser-Local Experiment History**: Inspect past evaluations, compare metrics, and restore previous states with zero credential persistence.

---

## 📐 Official JEV Product Model

The workbench implements the core abstractions of the JEV paradigm:

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
