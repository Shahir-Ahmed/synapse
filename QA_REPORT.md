# ClearFeedback QA Report

**Date:** 2026-10-22  
**Scope:** Source review, core data-store/authentication logic, input validation, project packaging and dependency-free tests.

## Status

The final source package is internally consistent and the included Node test suite passes. A full frontend build, complete project type-check, live server run, HTTP API integration tests and browser end-to-end checks could not be completed in this environment because project dependencies could not be installed. The original archive did not include a dependency lockfile.

## Fixes implemented

- Removed automatic teacher sign-in on a new/expired session and clear stale local credentials when session verification fails.
- Replaced user-ID-derived/fixed demo session behavior with random opaque bearer tokens; production demo sign-in is disabled by default.
- Hash passwords with salted scrypt, verify hashes safely, and upgrade legacy plaintext password fields when loading persisted data.
- Normalize email/student IDs and reject duplicate accounts and roster IDs at both store and request-validation layers.
- Generate unique server-side student IDs when one is not supplied.
- Validate assessment topics, finite/non-negative marks, maximum marks, calendar dates and feedback fields on the server; calculate percentages and grades from marks rather than trusting client totals.
- Require assessment review through the dedicated publication endpoint and reject publication without all three non-empty feedback sections.
- Validate and safely fall back when AI feedback output is malformed.
- Fixed demo account email mismatches, improved registration configuration for production, corrected local-date defaults, and improved student email suggestions/form labels.
- Updated visible product naming, setup instructions, environment template and test script.

## Verification performed

- `npm test`: **8 passed, 0 failed**.
- Focused TypeScript check for `server/passwords.ts`, `server/assessmentValidation.ts`, `server/store.ts` and `src/types/index.ts`: **passed**.
- TypeScript/TSX transpilation and relative-import scan: **24 files checked, 0 syntax errors, 0 unresolved relative imports**.
- JSON/config parsing: **passed** for `package.json`, `metadata.json`, and `data/store.json`.
- Actual persisted demo credentials: **3/3 verified**; all persisted account password fields are scrypt hashes.
- ZIP archive integrity and extraction check: performed before delivery (see final report).

## Checks blocked or not performed

- `npm run build`: blocked (`vite: not found`).
- `npm run lint`: blocked because the project dependency `vite/client` is not installed.
- Full `npm install`: timed out; offline installation could not resolve the required Google GenAI package.
- Browser layout/responsive checks, browser console/network checks, live Express API endpoint tests, Gemini API calls and complete teacher/student end-to-end flows: **not run**.

## Remaining limitations and deployment cautions

- Install dependencies in a network-enabled environment, run the full build/type-check, then perform live API/browser testing before production use.
- Data is stored in a local JSON file and sessions are in memory; this is appropriate for a single-process demonstration, not a multi-instance production deployment with real student records. Use a transactional database and a durable session strategy for production.
- Set `GEMINI_API_KEY` only on the server if Gemini generation is needed. Configure a strong `TEACHER_REGISTRATION_CODE` before enabling teacher self-registration in production. Keep `.env` private.
- Demo passwords are intentionally included for sample accounts and must not be reused for real users.
