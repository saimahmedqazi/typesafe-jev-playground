# Phase 3: Execution Adapters & Multi-Provider LLM Engine — Context

## Goal
Implement a decoupled, modular `ExecutionAdapter` architecture and a multi-provider `LLMExecutionAdapter` that supports OpenAI, Anthropic, and Google Gemini. The engine translates atomic question definitions (`noul` and `score`) and states into structured evaluation prompts and strict JSON schemas, executes via provider endpoints using user-supplied ephemeral credentials, and parses the responses into typed JEV evaluation results.

## Key Invariants
1. **Decoupled Architecture**: `ExecutionAdapter` defines an execution contract independent of any specific backend or question. Adding future execution engines (e.g. Native Jev, local models) must not require modifying existing question definitions.
2. **Strict Output Schemas**: Evaluation results must conform to typed structures:
   - `Noul`: boolean value, optional confidence (0-1), and clear rationale.
   - `Score`: continuous numeric value (0.0 to 1.0), optional criteria breakdown, and clear rationale.
3. **Multi-Provider JSON Enforcement**:
   - OpenAI: `response_format: { type: "json_schema", ... }`
   - Anthropic: Tool use with `tool_choice: { type: "tool", name: "submit_jev_evaluation" }`
   - Google Gemini: `generationConfig: { responseMimeType: "application/json", responseSchema: ... }`
4. **Endpoint Allowlisting & SSRF Prevention**: Provider URLs are strictly hardcoded constants (`https://api.openai.com`, `https://api.anthropic.com`, `https://generativelanguage.googleapis.com`). No arbitrary hostnames can be supplied by requests.
5. **BYO Key Security & Error Scrubbing**:
   - API keys are passed solely in execution contexts in-memory.
   - Any HTTP error, timeout, or parsing failure must sanitize error messages, ensuring no API key or auth token is ever reflected in logs or error messages.
   - Missing keys result in `CREDENTIAL_MISSING` errors immediately without network calls.

## Plans
- `03-01`: Core ExecutionAdapter contracts, JEV prompt formatting, and structured JSON schema generation.
- `03-02`: Multi-provider implementations (OpenAI, Anthropic, Gemini) with mock verification test suite.
