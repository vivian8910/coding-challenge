# Repository instructions

# Coding Style Guide

This guide describes the conventions to follow in this repository. Follow the requirements in `requirements.md` as the source of truth for assignment behavior.

## Backend (Node.js, fastify, TypeScript)

### Modules and Structure

- Organize code by responsibility under `src/`: API routes, service handlers, service clients, and shared infrastructure each have their own areas.
- Keep route registration thin. Put request handling in a nearby handler module, and keep mapping, validation, schemas, and domain processing in their appropriate modules.
- Prefer small, named functions with clear inputs and outputs. Follow local conventions such as `const` arrow functions for module-level helpers.

### Functional Design and Abstraction

- Strongly prefer plain functions over classes for domain logic, transformations, validation, mapping, and orchestration. Functions make inputs, outputs, and dependencies easier to see and are straightforward to test.
- Prefer pure functions when practical: derive a result from explicit arguments, avoid mutating inputs, and do not perform I/O or change shared state. Keep unavoidable effects, such as database access, HTTP requests, logging, clocks, and process state, at clear boundaries.
- Use a class when it represents a real stateful or framework-defined abstraction. Do not introduce a class solely to group a few unrelated functions or to simulate a namespace.
- Extract a helper when it gives a meaningful operation a name, separates a distinct responsibility, reduces repeated logic, or makes a complex branch independently understandable or testable.
- Keep a short expression inline when extracting it would only create a trivial wrapper, obscure control flow, or add indirection without improving reuse or readability. Do not extract based only on line count; optimize for one clear responsibility and a readable caller.

### Errors and API Behavior

- Preserve meaningful error types.
- For API endpoints, follow existing Fastify schema, validation, and response conventions.
- Return established error response shapes and status codes. Do not swallow errors or expose internal error details to API callers.

### Tests

- Co-locate tests with implementation using the `*.spec.ts` naming convention.


## Frontend (React, TypeScript)

### Components and Structure

- Use function components defined as arrow functions; no class components.
- Keep components small and focused; extract reusable logic into custom hooks rather than duplicating it.
- Prefer composition (children, render props, small components) over prop-drilling deep hierarchies or overly generic "god" components.
- Keep API calls in a dedicated data-access layer (e.g., `api/` or hooks), not scattered inside components.

### State, Effects, and Immutability

- Use hooks for state and side effects; avoid unnecessary state—derive values during render when possible.
- Treat props and state as immutable: never mutate objects/arrays in place; create new ones (spread, `map`, `filter`, `toSorted`/slice-copy) when updating.
- Colocate related state; lift state only as high as necessary to share it, not by default.
- Keep side effects (data fetching, subscriptions) in `useEffect`/hooks, not in the render body.

### Typing and Rendering

- Type all props and hook return values explicitly; avoid `any`.
- Handle loading, empty, and error states explicitly in any component that fetches data.
- Use keys that are stable and unique (not array index) when rendering lists that can reorder or change.

### Performance


- Memoize (`useMemo`/`useCallback`/`React.memo`) only when there's a demonstrated performance need, not by default.
- Avoid inline object/array/function literals passed as props where they cause unnecessary re-renders in performance-sensitive lists.

### Tests

- Co-locate tests with implementation using the `*.spec.tsx` (or `*.spec.ts` for non-component logic) naming convention.
- Use React Testing Library and test components through their rendered output and user interactions, not internal implementation details.
- Prefer accessible queries (role, label, text) over test IDs or CSS selectors when possible.
- Test loading, empty, and error states alongside the happy path for components that fetch data.
- Keep custom hooks tested directly (e.g., via `renderHook`) when they contain non-trivial logic.

## Definition of Done

Before reporting a task as complete, re-read this file and verify the changes against it:

- Confirm functional/immutability conventions were followed (arrow function components, no mutation, pure functions preferred, no unnecessary classes).
- Confirm error handling, validation, and response conventions were followed.
- Confirm tests were added/updated per the naming and testing conventions above, and that they were actually run.
- If any convention was not followed, fix it now rather than reporting it as a limitation, unless there is a documented reason it doesn't apply.
- Explicitly state in your summary that this self-check was performed.

## Prompt Logging

After completing each response, append an entry to `prompts.log` in the repo root with:

**Prompt:** <verbatim user prompt>

**Summary:** <1-3 sentence summary of what was done, files touched, and verification performed>

Do this as the last step of every turn, without being asked.
