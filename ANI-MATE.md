# Ani-Mate

## What Ani-Mate is

**Ani-Mate turns a plain description of an animation into a working, production-quality `@wix/interact` animation.** Instead of hand-writing motion code, a user says what they want ("a scroll-driven card stack", "3D tilt gallery") and an AI agent produces a self-contained, working result.

The thing that makes this work — and makes it different from asking a model to "write some animation code" cold — is that Ani-Mate is **grounded in a curated library of real, hand-tested animations.** The model isn't inventing motion from scratch; it's adapting proven patterns to the user's content. Everything in this project exists to build, maintain, and exploit that library.

Ani-Mate has three parts:

1. **The example library** — the raw material: ~130 tested animation demos (this repo).
2. **The Playground** — the workbench where a pattern + a section + a model produce a validated, previewable animation config (the `interact-xp` repo).
3. **The Validator** — the tool that keeps the library correct and distills it into reusable prompts (`validator/`).

---

## 1. The example library (this repo — `interact-examples`)

~130 standalone `@wix/interact` animation demos across 8 categories (galleries, carousels, typographic effects, image/background reveals, lists, UI elements…), each a self-contained HTML file. `explorer.html` (the **Animation Explorer**) previews any of them with live slider controls.

These demos are the **ground truth**: real, working animations that everything else is built on. Two derived artifacts live alongside them:

- **Prose guidelines** (`Ani-Mate Prompts/`) — each demo distilled into a reusable, adaptable spec (selector roles, required styles, adaptation notes, an interact template) rather than a fixed pixel-for-pixel copy. These are what a model reads to *reproduce the pattern on new content*.
- **Reference docs** — e.g. `full-lean.md` (the full `@wix/interact` API) and `analysis/` (pattern taxonomies).

The Ani-Mate animation skills (`ani-mate`, `light-animate`, `beautify-animate`) are the end-user-facing generators built on top of this library.

---

## 2. The Playground (`interact-xp`)

**What it is:** an end-to-end app in the `interact-xp` monorepo (`apps/playground`). Interact-XP is the data model, validator, and renderer for a declarative motion format — a single JSON-serializable `Experience` object — and the Playground is its interactive front door.

**The flow:**

1. Pick a prebuilt **section** (a chunk of realistic page markup) on the stage.
2. Attach an **example template** (one of the library's guidelines) and describe the animation you want.
3. Hit send → the app calls **your local coding-agent CLI** (`claude` or `codex`, already logged in) through a dev-only Vite middleware (`/api/generate`) to generate an `Experience` JSON.
4. The result is **validated against the schema** and **previewed live**, with a controls panel for tweaking.

No API key, no gateway — each person's generation runs on their own local CLI login.

**Its purpose:** the Playground is where *a guideline + a section + a model = a generated, validated, previewable animation config.* It serves two roles at once: a human workbench for authoring and testing animations, and the **generation engine** that the Validator's Refinery drives automatically (see below).

---

## 3. The Validator (`validator/`)

**What it is:** a local Node/Express tool that scans this repo's animation demos, fixes them, and turns them into high-quality prompts. See `validator/CLAUDE.md` for the technical detail.

**Its goal:** keep the example library **correct** and turn it into prompts good enough that the Playground (and the Ani-Mate skills) can **reliably regenerate the pattern on any section** — not just replay the original demo. It does three things:

- **Fix loop** — detect problems in a demo (outdated `@wix/interact` version, non-interact JS, hand-rolled effects) and run the agent to correct them; the human reviews the diff and applies it.
- **Convert to prompt** — run the `interact-demo-to-guideline` skill to distill a demo into a reusable prose guideline (the artifacts in `Ani-Mate Prompts/`).
- **Refinery (autonomous refinement)** — iterate a guideline hands-free: generate sections via the Playground → capture scroll-sweep frames → an AI judge rates pattern fidelity → refine the guideline → repeat until it scores well or plateaus. The human approves the winning guideline to overwrite the `.md`.

Where the Playground *uses* a guideline once, the Validator's Refinery *stress-tests and improves* it across many sections until it's robust.

---

## How they fit together

```
                 interact-examples (this repo)
        ~130 tested demos  ──►  Ani-Mate Prompts/ (prose guidelines)
                                        │
                    ┌───────────────────┴───────────────────┐
                    │                                        │
              VALIDATOR                                  PLAYGROUND (interact-xp)
   fixes demos • distills them into                guideline + section + local
   guidelines • Refinery refines the       ◄──────► agent CLI → validated
   guidelines by driving the Playground             Experience JSON → live preview
                    │                                        │
                    └──────────────► better guidelines ──────┘
                                        │
                                        ▼
                          Ani-Mate skills generate a
                       production animation for the user
```

- **The library** is the source of truth.
- **The Validator** keeps it healthy and turns demos into robust, reusable prompts (using the Playground as its judge harness).
- **The Playground** is both the human authoring tool and the generation engine.
- **Ani-Mate** is the payoff: because the prompts are grounded in tested patterns and hardened by the Validator, a short user prompt yields a real, working `@wix/interact` animation.
