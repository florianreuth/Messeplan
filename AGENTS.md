# AGENTS.md

Guidelines for coding agents (and humans) working on Messeplan. Features and commands are described in the
[README](README.md).

## Stack

- Astro (server output, Node adapter) with Svelte 5 islands, Tailwind CSS 4 and strict TypeScript.
- Astro Actions for all writes, Astro Sessions for the admin login, a Hono app in `src/fetch.ts` for compression,
  security headers and the live event stream.
- Drizzle ORM on SQLite (`better-sqlite3`). The schema lives in `src/server/db/schema.ts`; after changing it run
  `npm run db:generate` and commit the generated migration in `drizzle/`. Never edit a shipped migration. Review the
  generated SQL: for foreign key changes drizzle-kit rebuilds tables behind `PRAGMA foreign_keys=OFF`, which SQLite
  ignores inside the migrator's transaction, so dropping a referenced table would cascade-delete its dependents.
- Zod schemas in `src/lib/schemas.ts` validate actions, backups and the admin forms alike (`formErrors.ts` maps them to
  form fields). bits-ui provides the dialogs; d3-zoom and d3-drag drive the floor plan viewer and editor; runed
  provides small reactive utilities (`PersistedState`, `ElementSize`, `IsMounted`). The reducer uses Immer drafts.
- Uploaded and restored images go through `src/server/images.ts`: file-type checks the real content, sharp resizes raster
  images to a WebP of at most 512 px.
- The user interface is German; code, identifiers, comments and docs are English. Error messages that reach the user
  are German, also when they come from the server.
- `npm test` runs the unit tests with `node --test`; `npm run build` runs `astro check`, `svelte-check` and the build;
  `npm run test:e2e` builds, seeds a fresh database (`e2e/seed.ts`) and runs the Playwright suite in `e2e/`. All must
  pass, without warnings, before a change is done. E2E tests select by role and label, wait for hydration via
  `open()`/`hydrated()` from `e2e/fixtures.ts`, and must not depend on data other specs create.

## Architecture

- `src/lib/`: framework-free domain code (types, the reducer, geometry). Imports use explicit `.ts` extensions so the
  tests run without a bundler.
- `src/server/collections.ts`: the registry tying each entity to its table, key and validation schema. The repository
  and the generated actions (`src/actions/index.ts`) are built from it; a new entity is added there first.
- `src/server/repository.ts`: every read and write. Writes run in a transaction, bump the revision and notify the
  live event stream.
- `src/lib/client/store.svelte.ts`: `FairStore` applies changes optimistically through the reducer and sends them as
  actions via a `MutationQueue`, which coalesces rapid writes to the same item. Components read `store.data` and write
  through `store.actions`.
- Pages render a snapshot on the server and hydrate one root island (`PublicApp`, `AdminApp`). Open pages reload the
  snapshot from `GET /api/data` (ETag-cached) when `/api/events` announces a new revision.

## Rules

- Prefer established libraries and framework features over hand-written infrastructure; ask before adding a dependency.
- Document only what needs explaining: a one-line `/** … */` where the signature does not tell the whole story, inline
  `//` comments for the why. Keep docs short.
- Svelte 5 runes only (`$state`, `$derived`, `$effect`, `$props`, snippets, `onclick=`).
- Never read the theme in JavaScript: colors that differ between light and dark use CSS (`tint`, `plan-fill`,
  `plan-stroke`), so server-rendered pages already match.
- New foreign keys need a matching cascade in the client reducer, otherwise optimistic updates drift from the server.
- Every source file starts with the proprietary license header used in the existing files. 4-space indentation (2 for
  JSON/YAML), double quotes, trailing commas.
- Every `if`, `else` and loop body uses braces, and function or method bodies never sit on one line (`test() { … }`).
  Expression-bodied arrow functions (`(x) => x * 2`) are fine.
