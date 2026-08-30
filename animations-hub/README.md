# Animations Hub

A local tool for browsing every `@wix/interact` example in this repo and reviewing
its tags. Preview on the left, live animation in the middle, tags on the right.

## Run it

```bash
python3 animations-hub/server.py
# then open http://localhost:3000/animations-hub/
```

Python 3.8+, no dependencies. The server also serves the repo statically, which is
what makes the animation previews work.

Opening `index.html` straight off disk also works, but read-only: tag editing needs
the server.

## What you get

* **157 presets** grouped into collapsible folder drawers, with search over names
  *and* tags.
* **Live preview** of each animation in an iframe. `↑`/`↓` or `j`/`k` to flip
  between them, `↻` to restart a scroll-driven one.
* **Three tag axes** per preset — Atmosphere (always open), Business type and
  Section type (folded away by default).
* **Provenance** — a green dot means a human tagged it, purple means Claude did.
* **Suggested tags** — the ten nearest tags this preset does not have yet, from a
  PPMI co-occurrence model. Click to add.
* **Inline dictionary** — what each applied and suggested tag means, and what to
  look for in the animation.
* **Change tracking** — a pencil marks any preset whose tags differ from their
  baseline; the diff and a Revert button sit in the panel.
* **Done toggle** — mark a preset reviewed; filter the list by All / To review / Done.

Keyboard: `/` search · `t` all tags · `d` dictionary · `h` history · `Esc` close.

## Editing is deliberately guarded

Tag editing writes straight to `interact-examples-tags.csv`, so it sits behind
three locks:

1. The panel is **read-only until you unlock it** (with a confirm).
2. **Removing a tag takes two clicks** — the first only arms it.
3. A tag outside `vocabulary.json` needs a **second confirm**.

The server enforces the vocabulary and refuses to leave a preset with no tags, so
a stray request cannot bypass the UI. Writes are atomic (temp file + `os.replace`)
and serialised behind a lock. Before the first write of each run the CSV is
snapshotted to `tags-backup.csv` (gitignored).

## The data

| file | what it is |
| --- | --- |
| `../interact-examples-tags.csv` | the source of truth — 157 rows × 8 columns |
| `tag-history.csv` | append-only audit trail of every tag change and approval |
| `tag-dictionary.md` / `.json` | what all 81 atmosphere tags mean |
| `tag-suggestions.json` | per-preset nearest-tag suggestions |
| `vocabulary.json` | the 82 allowed atmosphere tags |
| `features.json` | extracted structural features per example, feeds the dictionary |

CSV columns: `Name of preset`, `Alternative names`, `Atmosphere` (a JSON array),
`business_type`, `section_type `, `path`, `atmosphere_original` (baseline, filled
on first edit), `reviewed` (timestamp when marked done).

`business_type` and `section_type` are currently populated only on the 21
originally hand-tagged rows — that axis is still to be done for the rest.

## Regenerating

```bash
python3 animations-hub/build-hub.py          # rebuild index.html from the CSV
python3 animations-hub/suggest-tags.py --k 12 # recluster + refresh suggestions
python3 animations-hub/build-dictionary.py    # rebuild the dictionary
```

Re-run `suggest-tags.py` after a batch of edits — the model learns from whatever
the CSV currently says.
