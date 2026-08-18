# Classic Horizontal Scroll

A row of full-bleed panels translates left as the page scrolls vertically down a tall pinned section, turning vertical scroll into a horizontal pan across the whole group.

## 1. Identity

- **id:** `classic-horizontal-scroll`
- **mechanism:** `scroll-pin-hpan` — a tall runway drives one `viewProgress` interaction; an inner wrapper is pinned (`sticky`, `100vh`, `overflow: clip`); a single `max-content` flex row of panels inside it translates on X across a `contain 0% → 100%` range so the group pans horizontally while the user scrolls vertically.
- **fits sections with:** one uniform group of **3–8 repeated media items** (image cards / panels) that can be laid out in a single horizontal row inside a pinned stage. Static section-level siblings (heading, button) are tolerated only if they can stay layered above the pin without moving.
- **rejects:** fewer than 3 repeated items; or the repeated group cannot be isolated by element type; or the section is flat AND its repeated items are interleaved with static copy that must scroll independently (no way to isolate a mover).
- **⚠ adaptation crux:** the demo nests `section → sticky-wrapper → track → panels` — four purpose-built levels. A Wix section rarely supplies a dedicated `track` wrapper holding *exactly* the panels. **Substitution:** pin the section's inner wrapper as the stage, and if no single child wrapper contains only the repeated group, **synthesize a virtual row** by absolutely positioning each item side-by-side (base offset on the CSS `translate` property) and animating each item's `transform: translateX` by the *same* distance so they pan together as one track. DOM cannot be reparented, so the row is expressed per-item rather than on a real mover.

## 2. Motion Spec (invariant intent)

This is the fidelity target. Only §7 numbers adapt.

- **Trigger:** a single `viewProgress` interaction whose source is the section runway (the demo's `#scroll-container`). Preserve `viewProgress` — this is scroll-driven, not hover or a loop.
- **Start state:** the first panel exactly fills the pinned stage; panels 2…N sit off-screen to the right in DOM order, one stage-width apart. Nothing overlaps; no gaps.
- **End state:** the last panel exactly fills the stage; the whole row has translated left by (total row width − one stage width). Panels keep full size and full opacity throughout — this is a pan, not a fade or scale.
- **Range:** `contain 0% → 100%` (the pan begins the instant the stage is fully pinned and finishes as the pin releases). `easing: linear`, `fill: both`.
- **Ordering:** left-to-right DOM order maps to first-to-last in the scroll. Motion is monotonic and uniform (constant speed) — every panel is on-screen and readable for an equal share of the runway.
- **Distance is self-/container-relative**, never viewport-arithmetic (see §5b / §7): the row translates by its own width minus the visible clip width.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never class names or text (Wix classes are opaque `comp-*`; text is redacted).

| Role | Signature | Owns |
| --- | --- | --- |
| `scrollSource` | The outermost `<section>` / container. Exactly one. | The scroll runway (tall height). Drives `viewProgress`. |
| `stickyStage` | The tightest single wrapper inside `scrollSource` that contains the repeated group; falls back to the section's direct content child, else the section itself. Exactly one. | Pinning (`sticky`, `100vh`), clipping (`overflow: clip`), `container-type: inline-size`, and the positioning context for the row. |
| `track` | *Optional.* A single wrapper whose children are **exactly** the repeated group. | The `max-content` horizontal row; the animated `translateX`. **If absent → not created; the row is synthesized per-item (see §4.5).** |
| `repeatedItem{n}` | The largest uniform group of ≥3 sibling media components (same type), in DOM order. | Its slot in the row. In the synthesized-row path, each also owns its base X offset and its own `translateX` effect. |
| `staticSibling` | Any non-repeated sibling (heading, button, decoration). | Nothing — left untouched, layered above the pin. |

**Ownership is strict:** runway → `scrollSource`; pin + clip + containment → `stickyStage`; the horizontal translate → `track` (or, if synthesized, the individual `repeatedItem`s moving in lockstep). `track` and `stickyStage` are distinct elements that must never resolve to the same node (one is fixed, one moves).

## 4. Mapping Procedure (Wix sanitized HTML)

Match on **type + count + order + containment only** — never on redacted text, never on the `comp-…` hash. Run in order:

1. **`scrollSource`** = the outermost `<section class="… comp-XXXX">` (or outermost element). Selector = `.comp-XXXX`.
2. **`stickyStage`** = the tightest single wrapper that contains the whole repeated group. Prefer the section's direct `.content comp-XXXX__content` child; if the section is bare with no such wrapper, use its single structural child; if none, use the section itself. Ignore `.backgroundLayer`. This element gets the pin, clip, and `container-type`.
3. **Find the repeated group:** among the descendants of `stickyStage`, take the **largest set of ≥3 siblings sharing the same component type** — priority `root image` → `g-item` → `root video` → generic repeated `comp-*` with identical inner structure. These become `repeatedItem1..N` in DOM order. Items with their own unique `comp-…` class each get a class selector; shared-class items (`g-item`) select positionally: `.<stage-comp> .g-item:nth-child(k)`.
4. **`track`** = a single wrapper inside `stickyStage` whose children are **exactly** that repeated group (nothing static). If it exists, it is the mover: selector = its `.comp-…`. Its ancestor stage keeps the pin; the track keeps the translate.
5. **If no such `track` wrapper exists** (items sit directly in `stickyStage` beside static siblings, i.e. a flat section) → **synthesize the row per-item**: do not animate `stickyStage` (it holds static copy). Absolutely position each `repeatedItem` filling the stage, give item *i* (0-based) a base X offset via the CSS `translate` property (`calc(i * 100cqw) 0`), and animate each item's `transform: translateX` by the identical end distance so they move as one. `staticSibling`s stay in flow / layered above.
6. **`staticSibling`** = every non-repeated child of `stickyStage`. Do not target them; ensure they render above the pinned media (higher `z-index`) and do not move.
7. **Reject** if step 3 yields fewer than 3 items, or the only candidates are raw `img` descendants with no stable component root, or (flat path) the items cannot be isolated from static copy that must scroll on its own.

Emit each mapped role into `elements` as `{ key → { selector: ".comp-…" } }`, keys carrying the trailing index (`repeatedItem1`, `repeatedItem2`, …). Include `track` only on the real-track path.

## 5. Structure & CSS Overrides

Structural only — never emit color, font, typography, or background. Neutralize the Wix layout **first**, then apply scaffolding.

### 5a. Neutralize (on the mapped Wix elements)

- **`scrollSource`** — Wix sets `height: auto; min-height: 0`. Override with the runway height (§7).
- **`stickyStage`** — usually `display: grid` with fixed `grid-template-rows`. On the real-track path it just needs to become the pin/positioning box (grid content is the single track). On the flat path, keep the grid only for `staticSibling`s; the repeated items leave flow (below).
- **`repeatedItem{n}`** — Wix places each via `grid-row`, `grid-column`, `margin-*: %`, and sometimes `transform: rotate(…)`. **Reset all of these in the emitted `styles`** (`grid-area: auto; margin: 0; transform: none`) or the row/start state is wrong. Prose alone is not enough — the reset must be in each item's `styles` entry.
- **Media child** — if a mapped item wraps a direct anonymous media wrapper / `.ph-box` / raw `img` carrying dimensions, set that child (and nested `img`/`.ph-box`) to `width:100%; height:100%; object-fit:cover; display:block`, and neutralize broken `aspect-ratio:0` with `aspect-ratio:auto !important`. Emit per mapped item, not via a broad `img`/`.ph-box` selector.

### 5b. Apply

```css
/* scrollSource — runway */
{ height: calc(var(--hscroll-runway) * 1vh); position: relative; } /* §7 */

/* stickyStage — pin + clip + horizontal positioning context */
{
  position: sticky; top: 0;
  height: 100vh; width: 100%;
  overflow: clip;               /* clip, NOT hidden — hidden breaks ViewTimeline */
  container-type: inline-size;   /* enables 100cqw = visible stage width */
  display: flex; align-items: center;
}

/* --- Path A: real track wrapper exists --- */
/* track — a single max-content, non-wrapping, left-aligned row */
{
  display: flex; flex-wrap: nowrap;
  width: max-content; height: 100%;
  will-change: transform;
}
/* repeatedItem{n} on path A — equal panels, no shrink */
{ flex: 0 0 var(--panel-w, 100cqw); height: 100%; }

/* --- Path B: synthesized virtual row (flat section, no track) --- */
/* repeatedItem{n}, item index i (0-based) */
{
  position: absolute; top: 0; left: 0;
  width: var(--panel-w, 100cqw); height: 100%;
  translate: calc(<i> * var(--panel-w, 100cqw)) 0;  /* base row slot on the translate PROPERTY */
  will-change: transform;                            /* animation owns transform only */
}
```

- **Centering/positioning on `translate`, animation on `transform`** — they compose, so keyframes never clobber the row layout.
- **The pin owns clip AND positioning AND `container-type`** — one box, so `100cqw` and the clip agree.
- Distance is **clip-relative** (`100cqw`), so the last panel lands on-screen at every viewport width; never `100vw` (over-translates when Wix constrains content width) and never card-width arithmetic.
- Guard the no-overflow case: if the row is not wider than the stage, the translate distance clamps to `0` (no negative pan).

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "scrollSource":  { "selector": "<section .comp-…>" },
    "stickyStage":   { "selector": "<.comp-…__content>" },
    "track":         { "selector": "<.comp-…>" },          // omit on synthesized-row path
    "repeatedItem1": { "selector": "<.comp-…>" },
    "repeatedItem2": { "selector": "<.comp-…>" },
    "repeatedItem3": { "selector": "<.comp-…>" }
    // … repeatedItemN
  },
  "styles": [
    { "selector": "<scrollSource>", "properties": { "height": "calc(var(--hscroll-runway) * 1vh)", "position": "relative" } },
    { "selector": "<stickyStage>",  "properties": { "position": "sticky", "top": "0", "height": "100vh", "width": "100%",
        "overflow": "clip", "container-type": "inline-size", "display": "flex", "align-items": "center" } },

    // Path A (real track):
    { "selector": "<track>", "properties": { "display": "flex", "flex-wrap": "nowrap", "width": "max-content", "height": "100%", "will-change": "transform" } },
    { "selector": "<repeatedItem>", "properties": { "grid-area": "auto", "margin": "0", "transform": "none",
        "flex": "0 0 100cqw", "height": "100%" } }

    // Path B (synthesized row) — replaces the two rules above; one per item, translate varies by index:
    // { "selector": "<repeatedItem_i>", "properties": { "grid-area": "auto", "margin": "0", "transform": "none",
    //     "position": "absolute", "top": "0", "left": "0", "width": "100cqw", "height": "100%",
    //     "translate": "calc(<i> * 100cqw) 0", "will-change": "transform" } }
  ],
  "interact": {
    "effects": {},
    "interactions": [
      { "key": "scrollSource", "trigger": "viewProgress", "effects": [ /* §6b */ ] }
    ]
  },
  "controls": [ /* §8 */ ]
}
```

### 6b. Interact effects (template)

```ts
// N = mapped item count. distance = row width − visible stage width, container-relative.
const RANGE = {
  rangeStart: { name: 'contain', offset: { unit: 'percentage', value: 0 } },
  rangeEnd:   { name: 'contain', offset: { unit: 'percentage', value: 100 } },
  easing: 'linear',
  fill: 'both' as const,
};

// --- Path A: single track translates by its own width minus the clip width ---
const trackInteraction = {
  key: 'scrollSource',
  trigger: 'viewProgress',
  effects: [{
    key: 'track',
    keyframeEffect: {
      name: 'hscroll-track',
      keyframes: [
        { transform: 'translateX(0)' },
        { transform: 'translateX(calc(-100% + 100cqw))' }, // -100% = track's own max-content width
      ],
    },
    ...RANGE,
  }],
};

// --- Path B: every item translates by the SAME distance, in lockstep (no per-item offset here —
//     the base row slot lives on the CSS `translate` property from §5b) ---
const END = `translateX(calc(-1 * ${N - 1} * 100cqw))`; // shift row left by (N-1) stage widths
const synthInteraction = {
  key: 'scrollSource',
  trigger: 'viewProgress',
  effects: Array.from({ length: N }, (_, i) => ({
    key: `repeatedItem${i + 1}`,
    keyframeEffect: {
      name: `hscroll-item-${i + 1}`,
      keyframes: [ { transform: 'translateX(0)' }, { transform: END } ],
    },
    ...RANGE,
  })),
};
```

Recompute: on Path A the `100cqw` term = the visible stage width (leave symbolic — the browser resolves it); on Path B the end distance uses `(N − 1)` and the same `--panel-w`. Do not hardcode the demo's `8`/`800vh`.

## 7. Adaptive Parameters

Recompute from the real section; never copy demo literals.

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped `repeatedItem`s | 3–8 |
| `--panel-w` | full stage by default: `100cqw`. Narrow to show peeks of neighbors if desired. | `60cqw`–`100cqw` |
| pan distance (Path A) | `calc(-100% + 100cqw)` — track's own width minus clip width; clamps to 0 if no overflow | — |
| pan distance (Path B) | `-(N − 1) × var(--panel-w)` in `cqw` | — |
| `--hscroll-runway` (vh) | `max(300, N * 100)` — one full viewport of scroll per panel so each dwells equally | 300–800 |

If the row is not wider than the stage (`N × panel-w ≤ 100cqw`), there is no pan — reduce `--panel-w` or reject.

## 8. Suggested Controls

### `panel-width`
- **Label:** Panel Width · **Group:** Layout · **Type:** range
- **Default:** 100 · **Constraints:** min 60, max 100, step 1, unit cqw
- **Description:** width of each panel relative to the stage; below 100 reveals a peek of the neighboring panels.
- **Suggested variable:** `--panel-w`

### `scroll-length`
- **Label:** Scroll Length · **Group:** Motion · **Type:** range
- **Default:** derived `max(300, N*100)` · **Constraints:** min 300, max 800, step 10, unit vh
- **Description:** how much vertical scroll the full horizontal pan takes — higher = slower, more dwell per panel.
- **Suggested variable:** `--hscroll-runway`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] Exactly one `viewProgress` interaction, keyed to `scrollSource`; range is `contain 0→100` (not `exit`, not `cover`), `easing: linear`, `fill: both`.
- [ ] `stickyStage` has `overflow: clip`, a `100vh`/`sticky` pin, **and** `container-type: inline-size` — all on one element, which is also the row's positioning ancestor.
- [ ] Pan distance is container-relative (`100cqw`), not `100vw` and not card-width arithmetic; distance clamps to 0 when the row does not overflow.
- [ ] `scrollSource` height ≥ `max(300, N*100)vh`.
- [ ] Every mapped item's Wix `grid-area` / `margin` / `transform` is reset **in its emitted `styles`** (not prose only).
- [ ] Path A: `track` selects a wrapper whose children are exactly the repeated group; `track` ≠ `stickyStage`. Path B: no `track` key exists, each item is absolutely positioned with its base slot on `translate` and animates `transform` by the identical distance.
- [ ] Effect count matches the mover: Path A = 1 effect on `track`; Path B = N effects, one per `repeatedItem`, none dropped.
- [ ] No effect targets a key absent from `elements`; no `staticSibling` is animated and static copy stays layered above the moving media.
- [ ] Item count matched by media-child fill rules equals N (no broad `img`/`.ph-box` rule leaving only the first panel filled).