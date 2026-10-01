---
phase: 02-question-registry-initial-primitives
plan: 02
subsystem: registry
tags: [typescript, registry, is-sandwich, new-score-1, noul, score, presets]

requires: [02-01]
provides:
  - is_sandwich Noul question definition with validation and prompt instruction
  - new_score_1 Score question definition with [0, 1] range constraint and validation
  - State preset catalog for rapid developer experimentation (BLT, Tartine, Hot Dog, Burrito, Soup, Pristine, Average, Degraded)
  - Vitest test suite covering registry operations, question validators, and presets (11 tests)
affects: [phase-03, phase-04, phase-06]

actuals:
  tokens: 4200
  tasks: 4
  commits: 1

tech-stack:
  added: []
  patterns: [question-definition-contract, state-validator-function, curated-preset-catalog]

key-files:
  created:
    - src/registry/questions/is_sandwich.ts
    - src/registry/questions/new_score_1.ts
    - src/registry/presets/index.ts
    - tests/registry/registry.test.ts
  modified:
    - src/registry/index.ts

key-decisions:
  - "Configured `is_sandwich` as a Noul primitive returning boolean with structural sandwich evaluation criteria"
  - "Configured `new_score_1` as a Score primitive with numeric [0, 1] range and criteria evaluation"
  - "Curated a set of 8 realistic state presets across classic borderline cases (Hot Dog, Tartine) and metric evaluations"

patterns-established:
  - "Question definitions export typed objects adhering to NoulQuestionDefinition or ScoreQuestionDefinition"
  - "Each question provides a `validateState(state)` function returning `{ valid: boolean, errors?: string[] }`"

requirements-completed: [REG-02, REG-03, REG-04]

coverage:
  - id: R2
    description: "is_sandwich registered as Noul question with state validation and boolean output"
    requirement: REG-02
    verification:
      - kind: unit
        ref: "tests/registry/registry.test.ts"
        status: pass
    human_judgment: false
  - id: R3
    description: "new_score_1 registered as Score question with state validation and [0, 1] range"
    requirement: REG-03
    verification:
      - kind: unit
        ref: "tests/registry/registry.test.ts"
        status: pass
    human_judgment: false
  - id: R4
    description: "Preset states exist and pass validation for their respective questions"
    requirement: REG-04
    verification:
      - kind: unit
        ref: "tests/registry/registry.test.ts"
        status: pass
    human_judgment: false
---

# Phase 02 Plan 02 Summary: Initial Question Primitives & Presets

## Objectives Achieved
1. **`is_sandwich` Noul Definition (`src/registry/questions/is_sandwich.ts`)**:
   - Implemented `isSandwichQuestion` of type `noul` with `expectedReturnType: 'boolean'`.
   - Included structural state validator checking for non-empty object with descriptive fields.
   - Built comprehensive prompt instructions regarding sandwich definitions (two slices of bread / split roll enclosing filling).
2. **`new_score_1` Score Definition (`src/registry/questions/new_score_1.ts`)**:
   - Implemented `newScore1Question` of type `score` with numeric range `[0, 1]`.
   - Included state validator verifying attributes and criteria structure.
   - Built comprehensive prompt instructions for scoring quality/completeness from 0.0 to 1.0.
3. **Preset State Catalog (`src/registry/presets/index.ts`)**:
   - Curated 5 presets for `is_sandwich`:
     - Standard BLT Sandwich (Classic sandwich)
     - Open-Faced Tartine (Borderline single slice)
     - Hot Dog in Split Bun (Structural borderline)
     - Burrito in Tortilla (Wrapped bread / non-sliced)
     - Bowl of Chicken Noodle Soup (Negative control)
   - Curated 3 presets for `new_score_1`:
     - Pristine Condition (High score target)
     - Average Condition (Mid score target)
     - Degraded Condition (Low score target)
4. **Registry Bootstrap & Unit Test Suite (`tests/registry/registry.test.ts`)**:
   - Initialized `defaultQuestionRegistry` with both questions automatically loaded.
   - 11 comprehensive Vitest tests verifying:
     - Pre-loaded question presence and type categorization
     - Retrieval and metadata correctness
     - State validation on valid and invalid payloads
     - Duplicate registration rejection
     - Validity of all 8 preset states against their respective questions

## Verification Results
- `pnpm test`: 22 passed across `tests/core/domain.test.ts` and `tests/registry/registry.test.ts`.
- `pnpm run typecheck`: 0 errors.
- `pnpm run build`: built client cleanly in 4.7s.
