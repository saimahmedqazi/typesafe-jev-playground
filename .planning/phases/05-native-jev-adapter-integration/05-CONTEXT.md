# Phase 5: Native Jev Adapter Integration — Context

## Goal
Implement and integrate `NativeJevExecutionAdapter` adhering to the common `ExecutionAdapter` interface. Enable direct execution against official Jev infrastructure when native Jev credentials are provided, maintaining absolute architectural isolation from the LLM Practice engine and providing clear guidance when credentials are missing.

## Key Invariants
1. **Zero LLM Cross-Talk**: Native Jev Mode routes directly to Jev infrastructure. It never invokes LLM providers, LLM prompts, or LLM adapters.
2. **Strict BYO Native Credentials**: Native Jev requests require user-supplied `x-user-jev-key` (and optional `x-user-jev-org`). Missing credentials produce actionable guidance: switch to LLM Practice Mode or provide native credentials.
3. **Common Evaluation Contract**: Like `LLMExecutionAdapter`, `NativeJevExecutionAdapter` implements `ExecutionAdapter.execute(context, credentials)` and returns typed `EvaluationResponse`.
4. **Secret Scrubbing**: Any HTTP failure or connection error with Jev endpoints strictly redacts native API keys before error formatting.

## Plans
- `05-01`: Native Jev execution adapter implementation, server evaluation dispatch wiring, and Supertest integration tests.
