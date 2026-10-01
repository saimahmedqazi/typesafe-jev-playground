# Phase 6: Developer Workbench UI & State Editor — Context

## Goal
Transform the Phase 1 client shell into a fully interactive, production-quality 3-column Developer Workbench UI. Enable developers to select execution modes, supply ephemeral keys in-memory, load presets, edit JSON states with live validation, trigger atomic evaluations, and inspect typed results, execution metrics, and raw payloads.

## Key Invariants
1. **Desktop 3-Column Technical Layout**:
   - Column 1: Mode & Credential Configuration
   - Column 2: Question & State Workspace
   - Column 3: Result Inspector & Execution Metrics
2. **Strict In-Memory BYO Credentials**:
   - Keys exist solely in React state during the browser session.
   - Keys are never persisted to `localStorage` or `sessionStorage`.
   - Visual indicators remind users that keys are memory-only.
3. **Interactive JSON State Editor**:
   - Live syntax validation (detects malformed JSON instantly).
   - Indentation formatting (2-space pretty printing).
   - Preset loaders for all registered questions.
   - Reset button to restore default state.
4. **Result Inspection Fidelity**:
   - Distinct visualizations for `Noul` (boolean truth badges + confidence) and `Score` (meter bar + normalized numeric score).
   - Metrics display: duration (ms), token usage (prompt, completion, total), provider, and model.
   - Raw output inspector for full debugging transparency.

## Plans
- `06-01`: Layout shell, client state hooks, and Configuration Panel (Column 1).
- `06-02`: Question workspace and Interactive JSON State Editor with validation, formatting, and presets (Column 2).
- `06-03`: Execution controls, Result Inspector, metrics display, and full workbench integration (Column 3).
