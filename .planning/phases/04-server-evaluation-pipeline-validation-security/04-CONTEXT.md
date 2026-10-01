# Phase 4: Server Evaluation Pipeline, Validation & Security — Context

## Goal
Build the production-quality `/api/evaluate` backend pipeline with Zod runtime request/response validation, robust error taxonomy, abuse protections (rate limiting, payload size controls), and absolute credential security guarantees (zero key persistence or leakage in logs or responses).

## Key Invariants
1. **Strict Zod Runtime Validation**:
   - Request bodies validated against `EvaluateRequestBodySchema`: mode, questionId, questionType, state (non-null object), and optional modelConfig.
   - LLM model outputs validated at runtime against question return type schemas (boolean for Noul, 0-1 continuous number for Score).
2. **Ephemeral BYO Key Header Extraction**:
   - `x-user-llm-key`, `x-user-llm-provider`, `x-user-llm-endpoint` (or `x-user-jev-key`).
   - If missing in `llm-practice` mode, reject with HTTP 401 `MISSING_CREDENTIAL`.
   - Never log headers containing keys.
3. **Abuse & Security Controls**:
   - Rate limiting: per-IP window rate limiting returning HTTP 429 `RATE_LIMITED`.
   - Payload size limit: reject payloads exceeding 100KB with HTTP 413 `PAYLOAD_TOO_LARGE`.
   - Error serialization: strip stack traces and redact any sensitive strings.
4. **Questions Discovery Endpoint**:
   - Expose `GET /api/questions` allowing the frontend workbench to discover registered questions, their metadata, schemas, and presets without hardcoding.

## Plans
- `04-01`: Zod request/response validation, ephemeral credential extraction, and evaluation pipeline route (`POST /api/evaluate`, `GET /api/questions`).
- `04-02`: Abuse protection middleware (rate limiting, payload limits, sanitized logging) and end-to-end integration test suite with Supertest.
