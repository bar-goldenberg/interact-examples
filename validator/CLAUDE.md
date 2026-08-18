# CLAUDE.md — Interact Validator

Guidance for working in `validator/`. This folder is a self-contained tool and
is **not** governed by the repo-root workflow notes (explorer.html, `analysis/`,
etc.). The root `CLAUDE.md` still applies to the animation files this tool reads.

## What it is

A local Node/Express tool that scans the repo's ~130 `@wix/interact` animation
HTML demos, detects problems (old versions, non-interact JS, custom effects),
and uses the local `claude` CLI to fix or convert them. It has two agent-driven
workflows plus a human-in-the-loop UI:

1. **Fix loop** — detect issues in example HTML → run the agent to produce a
   corrected version → save as a *draft* → human reviews the diff/preview and
   applies or discards.
2. **Convert to prompt** — turn a demo into a reusable prose *guideline* by
   running the **`interact-demo-to-guideline`** skill headlessly (installed
   under `~/.claude/skills/`), stored under `Ani-Mate Prompts/`. See `lib/skill.js`
   (loads the skill instructions + exemplar) and `lib/convert.js` (builds/runs
   the prompt).
3. **Refinery** (autonomous prompt refinement) — a Node-orchestrated pipeline
   that iterates a guideline: generate sections via the playground → capture
   scroll-sweep frames/GIF → judge fidelity → refine → repeat until green
   (score ≥8) or capped. Human approves the winning guideline to overwrite the
   `.md`.

## Running

```bash
cd validator
npm start                 # node server.js → http://localhost:4500
# or: PORT=xxxx npm start
node --watch server.js    # auto-restart during development
```

- **Client changes** (`public/*`): hard-refresh the browser.
- **Server changes** (`server.js`, `lib/*`): restart the process (the UI is a
  stateless window onto disk state, so a restart + refresh is always safe).
- The Refinery needs the playground running (see below) and, on a fresh clone,
  `npx playwright install chromium` for capture.

## Tests

```bash
npm test        # node --test — all suites under test/ must pass
```

Plain `node:test` + `node:assert/strict`, no framework. Each `lib/*.js` module
has a matching `test/*.test.js`. Server routes are covered in
`test/server.test.js` by starting a real app on an ephemeral port. Keep
lib logic pure and injectable so it can be tested without the network — every
module that reaches out (agent, playground, capture, judge) takes its side
effect as an injected `deps`/`*Impl` argument.

## Architecture

`server.js` — `createApp(rootDir, { port })` wires all routes and constructs the
Refinery engine. Routes are thin: they validate input and delegate to `lib/`.
`public/` is a dependency-free vanilla SPA (`app.js` is the whole client).

### lib/ module map

**HTTP-facing orchestration**
- `files.js` — `listAnimationFiles` walks the repo (skipping `IGNORED_DIRS`),
  listing every `.html` plus `.md` docs under an allowlisted dir
  (`EXAMPLE_MD_DIRS` in `constants.js`, e.g. `interactor-examples/`). `.md`
  examples show in the Examples tab as **rendered markdown** (Rendered/Raw
  tabs), not live previews, and are excluded from scan/diagnosis.
- `detect.js` — `detect(path, source)` categorizes a file (version, extra JS,
  custom effects, …). Pure.
- `fix.js` — `runFix`/`fixFile` apply codemods and/or the agent per selected
  option; write results as drafts. `mapLimit` bounds concurrency.
- `codemod.js` — `applyCodemods`: deterministic source rewrites (version pin,
  syntax migration) that don't need the model.
- `prompt.js` — `FIX_OPTIONS` (the checkbox list) + `buildPrompt`.
- `convert.js` / `skill.js` — build and run the convert-to-guideline prompt from
  the `interact-demo-to-guideline` skill installed under `~/.claude/skills`.
- `drafts.js` — draft persistence under `.drafts/` (mirrors source paths),
  `computeDiff`, `applyDraft`, `discardDraft`, `listDrafts`.
- `prompts.js` — guideline persistence under `Ani-Mate Prompts/`; `promptRelPath`
  maps `X.html` → `X.md` (inverse in `jobs-store.examplePathFor`).
- `loop-store.js` — the *manual* refinement loop history (`.md.history.json`).
- `spec.js` — loads `full-lean.md` (the @wix/interact spec) as agent context.

**Refinery (autonomous)**
- `refinery.js` — pure core (`decide`, `historyBlock`, `extractTriggers`) +
  `createRefinery({ runsDir, rootDir, port, deps })` engine: a resumable
  queue-of-2 iteration loop. Every step is an injected dep.
- `jobs-store.js` — job records at `runs/<jobId>/job.json` + frames.
  `markInterrupted` (boot recovery), `finalGuideline`, `deleteJob`, path guards.
- `playground.js` — reuses the playground's OWN prompt builder + schema to
  `generate` a config; `listSections` reads section HTML/CSS.
- `capture.js` — Playwright scroll-sweep → PNG frames + GIF (`gifenc`+`fast-png`).
- `judge.js` — builds the judge prompt, runs it (reads frames via the CLI's Read
  tool), parses strict JSON `{score, notes, sections}`.
- `refine.js` — refines a guideline from cross-section judge feedback.

**Shared infra**
- `agent.js` — `runAgent(system, user, opts)`: spawns the local `claude` CLI.
- `agent-state.js` — model override + token accounting for the context meter.
- `constants.js` — paths, CDN pins, `LATEST_VERSION`, `PLAYGROUND_REPO/URL`.

### vendor/ and rendering

Live previews render a generated config in a sandboxed iframe via
`GET /render/:jobId/:iter/:sectionId` → `public/render-frame.js:buildRenderDoc`,
which loads `vendor/render-runtime.js`. `vendor/` (`render-runtime.js` +
`experience.schema.json`) is a **built** artifact — `npm run build:vendor`
(`scripts/build-vendor.mjs`, esbuild) bundles it from the playground repo. Don't
hand-edit the bundle; regenerate it (the source lives in the read-only
playground, so changes there are out of scope for this tool).

## The agent backend

All model calls shell out to the local `claude` CLI (`lib/agent.js`), not an
API. Notes that bite:

- Invoked with `--output-format stream-json --system-prompt-file <f>
  --exclude-dynamic-system-prompt-sections`. The judge additionally uses
  `--allowedTools Read --add-dir <jobDir>` to read PNG frames.
- The installed CLI returns `--output-format json` as a **JSON array** of stream
  events — find the `type:'result'` element, not a single object.
- The model override from the UI flows through `agent-state.js` into both the
  agent and the playground `generate` call.

## Hard constraints

- **`PLAYGROUND_REPO` (`~/Documents/Dev/Wix/interact-xp`) is READ-ONLY.** Never
  create/edit/delete/build/install/checkout there. The validator imports its
  compiled prompt package and reads its `examples/` + `sections/` only.
- **`/vendor` must send `Access-Control-Allow-Origin: *`** — sandboxed
  null-origin preview iframes module-import from it; without the header they
  break. There is a regression test; don't remove the middleware.
- **Drafts/prompts/runs live on disk and outlive the process.** The client's
  in-memory sets must hydrate from disk on load (`loadDrafts` ↔ `GET /api/drafts`).
  A running job's *execution* dies with the server; only its *record* survives,
  which is what makes a job resumable (and why boot flips running→amber).
- `.drafts/`, `Ani-Mate Prompts/`, and `runs/` are untracked scratch — treat
  their contents as unrecoverable (not in git). Look before overwriting.

## Conventions

- ES modules (`"type": "module"`), Node built-ins over deps where reasonable.
- Keep new logic in a `lib/*.js` module with a sibling test; keep routes thin.
- Prefer pure functions + injected side effects so tests need no network.
- Match the terse, comment-the-why style of the existing modules.
