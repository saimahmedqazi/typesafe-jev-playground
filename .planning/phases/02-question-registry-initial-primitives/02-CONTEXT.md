# Phase 2: Question Registry & Initial Primitives - Context

**Gathered:** 2026-10-01
**Status:** Ready for planning
**Requirements Covered:** REG-01, REG-02, REG-03, REG-04

<domain>
## Phase Boundary

Build a typed Question Registry system and implement the initial registered question definitions for `is_sandwich` (Noul: boolean truth value) and `new_score_1` (Score: normalized 0-1 score) along with state validation schemas and ready-to-experiment state presets.

</domain>

<decisions>
## Implementation Decisions

### 1. Extensible Registry Architecture (REG-01)
- Never hardcode string comparisons (`if (id === 'is_sandwich')`).
- Question Registry manages registered question definitions with `registerQuestion()`, `getQuestion(id)`, `listQuestions()`, `listQuestionsByType(type)`.
- Each question definition encapsulates state validation rules, output typing constraints, evaluation instructions, and metadata.

### 2. Noul Question: `is_sandwich` (REG-02)
- Primitive Type: `noul`
- Identifier: `is_sandwich`
- Name: "Is Sandwich"
- Description: "Evaluates whether an item or state representation qualifies as a sandwich based on structural and compositional state attributes."
- State Schema: expects an object representation (e.g., `object`, `bread`, `filling`, `layers`, etc.).
- Expected Output: boolean (`true` / `false`) with optional confidence and explanation.

### 3. Score Question: `new_score_1` (REG-03)
- Primitive Type: `score`
- Identifier: `new_score_1`
- Name: "New Score 1"
- Description: "Computes a continuous quality/compatibility score (0.0 to 1.0) against given item state attributes."
- State Schema: expects evaluation attributes (e.g., criteria, attributes, metrics).
- Expected Output: floating point number normalized between `0.0` and `1.0`.

### 4. Built-in State Presets (REG-04)
- Catalog of presets for `is_sandwich` (e.g. Classic BLT, Open-Faced Tartine, Hot Dog edge case, Burrito edge case, Non-sandwich like Soup).
- Catalog of presets for `new_score_1` (e.g. High quality state, Mid quality state, Low quality state).

</decisions>

<code_context>
## Existing Code Insights

- `src/core/domain.ts` defines `AtomicQuestion`, `NoulQuestionDefinition`, `ScoreQuestionDefinition`, `NoulResult`, `ScoreResult`.
- We will build `src/registry/` implementing `QuestionRegistry`, `questions/is_sandwich.ts`, `questions/new_score_1.ts`, and `presets/index.ts`.
</code_context>
