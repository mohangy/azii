Developer documentation and comment conventions
===========================================

Purpose
-------
This file describes the minimal documentation standards for the Fastnet Radius Dashboard project.

Policy
------
- "Document everything": every file touched should contain a short header describing its purpose.
- Public components and utilities should include a small JSDoc-style header showing inputs/outputs/side-effects.
- Complex logic (e.g., simulated ping, localStorage merging, routing decisions) must have inline comments explaining intent.

Conventions
-----------
- Use JSDoc-style comments for components and functions at the top of files.
- Use single-line comments (//) for local explanations and rationale. Avoid restating obvious code.
- Keep comments up-to-date when the code changes. Prefer small comments near non-obvious code over long blocks.

LocalStorage keys
-----------------
- `fastnet:settings` — theme and sidebar state.
- `fastnet:users` — array of user objects added/edited in the UI.
- `fastnet:transactions` — array of locally created transaction receipts.

Helpful patterns
----------------
- When persisting to localStorage, always guard with try/catch and keep operations idempotent.
- Prefer small, focused components — add a comment header describing the component contract.

Next steps
----------
- Optionally convert the project to TypeScript to make types self-documenting.
- Add a section for API contracts if/when a backend is introduced.

*** End of guide
