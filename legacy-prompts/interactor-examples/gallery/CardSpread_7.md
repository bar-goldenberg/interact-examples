# 7-Card Fan Spread

Stacked cards start in a tight near-aligned pile at the center of a pinned viewport and fan out around a pivot below the deck — like a hand of cards opening — as the section scrolls.

## 1. Identity

- **id:** `fan-spread`
- **mechanism:** `scroll-pin-fan` — a tall runway drives a `viewProgress` trigger; a single wrapper is pinned (`sticky`, `100vh`, `overflow: clip`); repeated media items overlap at center, share a `transform-origin` **below** their box, and rotate from a nearly-aligned pile to a symmetric fan across the progress range.
- **fits sections with:** one uniform group of **3–9 repeated media items** (image cards, gallery/repeater items) that can be re-stacked at center and rotated as whole faces. Any card-level caption must be overlaid on the image (part of the face), not a separate stacked text block. Static section-level siblings (heading, paragraph, button) are allowed and left in place.
- **rejects:** fewer than 3 repeated items; the repeated group cannot be isolated by element type; or the "cards" are really image + independent stacked text where the text must not rotate with the image (rotate the image wrapper only, or reject).
- **⚠ adaptation crux:** the demo's native shape is three nested devices — a `#scroll-wrapper` runway, a `.sticky-container` pin, and a `.deck` collection — plus per-card `interact-element` wrappers. A Wix section gives you far fewer levels. **Substitution:** collapse the runway onto the section root, collapse the pin + collection onto one inner wrapper (or the section itself), and absolutely stack the repeated items directly on that wrapper. The fan is unchanged; only the scaffolding is folded into fewer elements.

## 2. Motion Spec (invariant intent)

This is what the result must look like. Preserve it exactly; only the numbers in §7 adapt.

- **Trigger:** a single `viewProgress` interaction whose source is the section runway. This is genuine scroll — not hover, not a time loop.
- **Start state:** all repeated items overlap, centered in the pinned stage, at full size, each rotated by a tiny per-item angle (`off * ~0.8°`) so they read as a barely-splayed pile. Higher-DOM-order items stack above lower ones (ascending `z-index`).
- **End state:** items are rotated into a **symmetric fan around the center item** — center item ≈ `0°`, items to one side rotate negative, the other side positive, magnitude growing with distance from center (`off * spread°`). Because every item shares a `transform-origin` **below** its own box (≈`center 140%`), the rotation swings each card outward from a common pivot, so tops fan apart while bottoms stay near the pivot.
- **Ranges:** `contain 0% → 55%` (the fan completes partway through the pinned window, then holds). `easing: cubic-bezier(0.22, 1, 0.36, 1)`, `fill: both`.
- **Ordering:** fan angle follows DOM order; the center item(s) barely move, outermost items rotate most.
- No opacity or color change; cards remain fully opaque throughout.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never by class names or text (Wix classes are opaque `comp-*`; text is redacted).

| Role | Signature | Owns |
| --- | --- | --- |
| `scrollSource` | The outermost section/container element. Exactly one. | The scroll runway (tall height). Drives `viewProgress`. |
| `stickyStage` | The tightest single wrapper that contains the repeated group (the section's direct content child, or the section itself if none). Exactly one. | Pinning (`sticky`, `100vh`), clipping (`overflow: clip`), flex-centering, and the positioning context. |
| `collection` | *Optional.* A dedicated wrapper whose only/primary children are the repeated group (the demo `.deck`). | Centered inner stage. **If absent, collapses into `stickyStage`.** |
| `repeatedItem{n}` | The largest uniform group of sibling media components (same type, ≥3) — image cards / gallery items. | Its own overlap placement, shared below-box `transform-origin`, `z-index` stacking, and fan rotation. |
| `staticSibling` | Any non-repeated sibling (heading, paragraph, button, decoration). | Nothing — explicitly left untouched. |

**Ownership is strict:** runway → `scrollSource`; pinning → `stickyStage`; per-item rotation → `repeatedItem`. Never put runway height on the sticky element, and never put the rotation on a descendant `img` (rotate the item root so its overlaid caption fans with it).

## 4. Mapping Procedure (Wix sanitized HTML)

Run in order against the sanitized markup. Match on **type + count + order + containment only** — never on text or on the `comp-…` hash.

1. **`scrollSource`** = the outermost `<section class="container comp-…">` or bare `<section class="comp-…">`. Its selector is the `.comp-…` class.
2. **`stickyStage`** = the section's direct `.content` child (`.comp-…__content`) if present; otherwise the section's own single direct child that holds the group; otherwise the section itself. This is the pin + positioning context. Ignore `.backgroundLayer`.
3. **Find the repeated group:** among the descendants of `stickyStage`, take the **largest set of ≥3 siblings sharing the same component type**, by priority: `root image` → `g-item` → `root video` → generic repeated `comp-*` with identical inner structure. These become `repeatedItem1..N` in DOM order.
   - If each item carries its own unique `comp-…` class → one class selector per item.
   - If items share a class (`g-item`, most repeater children) → select positionally: `.<stickyStage-comp> .g-item:nth-child(k)`.
4. **Caption handling (media/text separation):** if an item root contains the image **and** an overlaid caption absolutely positioned over it, map the item **root** (the caption is part of the face and should fan with it). If an item's text is a *separate, in-flow* stacked block that should not rotate, map instead the item's **image/media wrapper** as `repeatedItem{n}` and leave the text static.
5. **Everything else** in `stickyStage` (`rich-text`, `root button`, lone nested decorative `container`) = `staticSibling`. Do not target them.
6. **`collection`:** if a single wrapper's children are *exactly* the repeated group, use it; otherwise **collapse `collection` into `stickyStage`** and stack the items absolutely there.
7. **Reject** if step 3 yields fewer than 3 items, or the only candidates are raw `img` descendants with no stable component root.

Emit each mapped role into `elements` as `{ key → { selector: ".comp-…" } }`. Keys carry the trailing index (`repeatedItem1`, `repeatedItem2`, …).

## 5. Structure & CSS Overrides

Structural only — never touch color, font, or background. Emit the neutralize lines **in the actual `styles` entries**, not just as prose; some sections place items decoratively (per-item `rotate(…)` + `margin-*: %`) and prose-only resets get dropped.

### 5a. Neutralize (on the mapped Wix elements)

- **`scrollSource`** — Wix sets `height: auto; min-height: 0`. Override with runway height (§7).
- **`stickyStage`** — often `display: grid` with fixed `grid-template-rows`. Replace with flex-centering so the stacked items sit at center; `staticSibling`s that must keep grid placement stay untouched (the items leave flow via `position: absolute`).
- **`repeatedItem{n}`** — Wix places each via `grid-row`, `grid-column`, `margin-*: %`, and sometimes `transform: rotate(…)`. **Reset all of these** in the emitted style (`grid-area: auto; margin: 0; transform: none`) or the start pile is wrong (items stay scattered/pre-rotated and never align).

### 5b. Apply

```css
/* scrollSource — runway */
{ height: calc(var(--fan-runway) * 1vh); position: relative; }  /* see §7 */

/* stickyStage — pin + clip + centering + positioning context */
{ position: sticky; top: 0; height: 100vh; overflow: clip;
  display: flex; align-items: center; justify-content: center;
  position: relative; }  /* relative so absolute items resolve against the pinned box */

/* repeatedItem{n} — overlap at center, pivot below the box, then be rotatable */
{
  grid-area: auto; margin: 0; transform: none;   /* neutralize (5a) */
  position: absolute;
  top: 50%; left: 50%;
  translate: -50% -50%;                 /* centering lives on translate, NOT transform */
  width: var(--card-w); height: var(--card-h);   /* fixed card box, from §7 */
  transform-origin: center var(--fan-pivot);      /* ≈ 140% → pivot below the card */
  will-change: transform;
  /* z-index ascending in DOM order: repeatedItem{k} → z-index: k */
}
/* media child fill (if item root wraps an anonymous wrapper / .ph-box / img): */
{ width: 100%; height: 100%; object-fit: cover; display: block; aspect-ratio: auto !important; }
```

- Use `overflow: clip` (not `hidden`) on the pin so it doesn't create a scroll container.
- Keep `translate` (centering) separate from the animated `transform: rotate(...)` so keyframes never clobber the centering — they compose.
- `transform-origin: center 140%` is the heart of the fan; put it on the item, not on a child. Ascending `z-index` keeps later cards visually on top like a real hand.

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

Replace `<…>` with real `.comp-…` selectors from §4; expand `repeatedItem{n}` to the real count.

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "scrollSource":  { "selector": "<section .comp-…>" },
    "stickyStage":   { "selector": "<.comp-…__content or section>" },
    "repeatedItem1": { "selector": "<.comp-…>" },
    "repeatedItem2": { "selector": "<.comp-…>" },
    "repeatedItem3": { "selector": "<.comp-…>" }
    // … repeatedItemN
  },
  "styles": [
    { "selector": "<scrollSource>", "properties": { "height": "calc(var(--fan-runway) * 1vh)", "position": "relative" } },
    { "selector": "<stickyStage>",  "properties": { "position": "sticky", "top": "0", "height": "100vh", "overflow": "clip", "display": "flex", "align-items": "center", "justify-content": "center" } },
    { "selector": "<repeatedItem1>", "properties": { "grid-area": "auto", "margin": "0", "transform": "none",
        "position": "absolute", "top": "50%", "left": "50%", "translate": "-50% -50%",
        "width": "var(--card-w)", "height": "var(--card-h)",
        "transform-origin": "center var(--fan-pivot)", "z-index": "1", "will-change": "transform" } }
    // one repeatedItem style rule per mapped item; z-index ascends with the index
  ],
  "interact": {
    "effects": {},
    "interactions": [
      { "key": "scrollSource", "trigger": "viewProgress", "effects": [ /* §6b: one fan effect per item */ ] }
    ]
  },
  "controls": [ /* §8: spread angle, card size */ ]
}
```

### 6b. Interact effects (template)

Keyed to the element keys from §4. Illustrative values; recompute per §7.

```ts
// N = number of mapped repeated items (from §4)
// spread   = end fan angle per unit offset, in degrees (control, §8)
// startFan = tiny start angle per unit offset (keeps the pile barely splayed), e.g. 0.8

const MID = (N - 1) / 2;

const RANGE = {
  rangeStart: { name: 'contain', offset: { unit: 'percentage', value: 0 } },
  rangeEnd:   { name: 'contain', offset: { unit: 'percentage', value: 55 } },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  fill: 'both' as const,
};

const fanEffect = (key: string, startAngle: number, endAngle: number) => ({
  key,
  keyframeEffect: {
    name: `${key}-fan`,
    keyframes: [
      { transform: `rotate(${startAngle}deg)` },
      { transform: `rotate(${endAngle}deg)` },
    ],
  },
  ...RANGE,
});

const interaction = {
  key: 'scrollSource',
  trigger: 'viewProgress',
  effects: Array.from({ length: N }, (_, i) => {
    const off = i - MID;                 // symmetric around center
    return fanEffect(`repeatedItem${i + 1}`, +(off * startFan).toFixed(2), +(off * spread).toFixed(2));
  }),
};
// e.g. N=7, spread=12 -> end angles [-36,-24,-12,0,12,24,36]; start angles [-2.4,-1.6,-0.8,0,0.8,1.6,2.4]
```

No mobile variant is required; the fan reads at all widths since it is rotation about a fixed pivot, not a horizontal translate.

## 7. Adaptive Parameters

Recompute from the real section; never copy demo literals.

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped `repeatedItem`s | 3–9 |
| `--fan-runway` (vh) | `max(300, N * 85)` — enough scroll for the fan to open and hold | 300–800 |
| `spread` (deg per unit offset) | end angle step; keep outermost card `MID * spread ≤ ~40°` so tips stay in the clipped stage | 6–16 |
| `startFan` (deg per unit offset) | tiny start splay | 0.4–1.2 |
| `--card-w` / `--card-h` | fit the deck to the stage: `card-h ≤ ~82vh`, `card-w ≤ ~40vw`; preserve source item aspect ratio | — |
| `--fan-pivot` | `transform-origin` Y, below the box | 120%–160% (default 140%) |

If the outermost card would rotate its top out of the clipped stage, reduce `spread` or `--card-h` before returning.

## 8. Suggested Controls

### `spread`
- **Label:** Fan Spread · **Group:** Motion · **Type:** range
- **Default:** derived (see §7, ≈12) · **Constraints:** min 6, max 16, step 1, unit deg
- **Description:** how wide the cards fan open at the end of scroll.
- **Suggested variable:** `--fan-spread`

### `card-size`
- **Label:** Card Size · **Group:** Layout · **Type:** range
- **Default:** derived (see §7) · **Constraints:** min 20, max 40, step 1, unit vw
- **Description:** width of each card in the deck (height scales with the source aspect ratio).
- **Suggested variable:** `--card-w`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] **Every** mapped repeated item has exactly one fan effect (count of effects == N); no item silently dropped, and no effect targets a key absent from `elements`.
- [ ] End angles are symmetric around 0 in DOM order (center ≈ 0°, one side negative, the other positive), magnitude growing outward.
- [ ] Every item carries `transform-origin: center <pivot>` with the pivot **below** the box (>100%), or the cards spin in place instead of fanning.
- [ ] Centering is on the `translate` property; the animated `transform` holds **only** `rotate()` — keyframes never restate the centering.
- [ ] `z-index` ascends with DOM order across items (later cards on top).
- [ ] `stickyStage` has `overflow: clip` **and** a `100vh`/`sticky` pin **and** is the positioning ancestor of the items (so `top:50%` resolves to the pinned box).
- [ ] `scrollSource` height ≥ `max(300, N*85)vh`.
- [ ] Each item's Wix `grid-*` / `margin` / `transform` reset is present **in the emitted styles** (not just prose); start state = centered pile.
- [ ] No `staticSibling` (section heading/paragraph/button) is animated; card captions rotate only when overlaid on the image face (else the image wrapper is the mapped role and text stays static).