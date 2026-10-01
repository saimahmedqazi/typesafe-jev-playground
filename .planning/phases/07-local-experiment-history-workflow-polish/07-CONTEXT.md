# Phase 7: Local Experiment History & Workflow Polish — Context

## Goal
Implement a browser-local experiment history system enabling developers to review past runs, inspect outcomes, and reload/re-run prior states with a single click. Maintain strict zero-credential guarantees ensuring stored history records contain only state, questions, and results, with zero persistence of user credentials.

## Key Invariants
1. **Zero-Credential Local Storage**:
   - `localStorage` records strictly contain `{ id, timestamp, mode, questionId, questionType, state, modelConfig, result, metadata }`.
   - API keys and authorization headers are never included in the schema or stored on disk.
2. **One-Click Re-run / Reload**:
   - Any historical experiment can be loaded back into the active workbench (question, state, configuration) instantly.
3. **Capacity Management**:
   - In-browser history ring buffer (up to 50 recent experiments) with "Clear History" and individual deletion controls.
4. **Rapid Iteration Polish**:
   - History drawer accessible from the workbench header with live item count badge.

## Plans
- `07-01`: Local storage experiment manager, History drawer UI component, workbench integration, and security verification tests.
