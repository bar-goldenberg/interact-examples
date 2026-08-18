# Card Spread By Hover

A stack of repeated image cards fans out horizontally with a spring ease when the collection is hovered, revealing every card from behind the top one, and re-collapses on pointer-out.

## 1. Identity

- **id:** `card-spread-by-hover`
- **mechanism:** `hover-stack-fan` — repeated media items are absolutely stacked at one point inside a hover stage; a single `hover` interaction on that stage plays per-item `translateX` keyframes (`triggerType: 'alternate'`, so pointer-out reverses) that distribute the items symmetrically around the stack center.
- **fits sections with:** one uniform group of **3–7 repeated media items** (gallery items / images / cards) that can be pulled out of flow and re-stacked at a single point. Static siblings (heading, paragraph, button) are allowed and are left in place.
- **rejects:** fewer than 3 repeated items; a repeated group that cannot be isolated by element type; or a section whose repeated items are raw `img` descendants with no stable component root.
- **⚠ adaptation crux:** the demo is a purpose-built `#cards-collection` box (`25vw × 70vh`, `position: relative`) whose only children are the cards, and the fan escapes that box freely because the page body clips. A Wix section has no such box: the repeated items sit in a grid alongside static text, and the section root is `height: auto`. **Substitution:** promote the tightest existing wrapper that contains the repeated group to be the `hoverStage` — give it an explicit stack-sized box (`position: relative`, card-sized, `container-type: inline-size`), absolutely stack the items inside it, and derive the fan distance from the **stage's container width**, not from the viewport. The stage must **not** clip (the fan reaches outside it); horizontal containment moves up to the section root (`overflow-x: clip`). This is a hover mechanism — never add a scroll runway, sticky pin, or `viewProgress` range.

## 2. Motion Spec (invariant intent)

This is what the result must look like. Preserve it exactly; only the numbers in §7 adapt.

- **Trigger:** one `hover` interaction whose source key is the `hoverStage` (the element that contains the stack), with `triggerType: 'alternate'` so pointer-out plays the fan back in reverse. There is **no** scroll trigger anywhere in this mechanism.
- **Start state (pointer out):** all repeated items are perfectly superimposed at one point — a single card is visible, the rest hidden directly behind it. Z-order is **center-forward**: the middle item is on top, items further from center sit progressively behind, so the fan reads as unpeeling from a deck. Static siblings untouched.
- **End state (pointer over):** items are distributed **symmetrically along X** around the stack center — leftmost most-negative, rightmost most-positive, the exact center item at `translateX(0)` — spaced by one card width plus a gap, so they sit edge-to-edge with no overlap. No scale, rotation, or opacity change: **horizontal translate only**.
- **Timing:** desktop `duration: 600ms`, mobile variant `500ms`, `easing: cubic-bezier(0.16, 1, 0.3, 1)` (spring-like overshoot-free settle), `fill: 'both'` on every effect.
- **Responsive variant:** a second `hover` interaction gated on a `mobile` media condition (`(max-width: 768px)`) uses the **same** structure with a much smaller step (a peek-fan, items still overlapping) and the shorter duration; the desktop interaction is gated on `(min-width: 769px)`. Both are required — one condition-gated interaction per breakpoint, never one ungated interaction.
- **Reduced motion:** under `prefers-reduced-motion: reduce`, the items are placed in their **fanned end positions statically** via CSS (no animation, no hover dependence), so all cards are visible at rest.
- **Ordering:** fan order follows DOM order (first item leftmost). The center item(s) do not move.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never by class names or text (Wix classes are opaque `comp-*`; text is redacted).

| Role | Signature | Owns |
| --- | --- | --- |
| `sectionRoot` | The outermost `<section>` / outermost element of the section. Exactly one. | Horizontal containment (`overflow-x: clip`) and a minimum height that fits the stack. Never animated. |
| `hoverStage` | The tightest single wrapper that contains **all** the repeated items (the section's direct content child, or the section itself if there is no inner wrapper). Exactly one. | The `hover` trigger source, the positioning context for the stack, the stack-sized box, and `container-type: inline-size` (fan distances are `cqw` of this box). Must **not** clip. |
| `repeatedItem{n}` | The largest uniform group of sibling media components (same type, ≥3), in DOM order. | Its own absolute stack placement, z-order, and the animated `translateX`. |
| `mediaChild{n}` | *Optional.* The direct image/media wrapper (or `img` / `.ph-box`) inside `repeatedItem{n}` that carries the item's picture. | Filling the card face (or a height fraction of it, when the item also stacks text). Never animated itself. |
| `staticSibling` | Any non-repeated sibling of the group (heading, paragraph, button, decoration). | Nothing — explicitly left in place and untouched. |

**Ownership is strict:** the hover trigger belongs to `hoverStage`; the translate belongs to each `repeatedItem`; sizing/fill belongs to `mediaChild`. Never put the translate on a descendant `img`, and never animate `hoverStage` itself (moving the hover source under the pointer causes enter/leave flicker).

## 4. Mapping Procedure (Wix sanitized HTML)

Run in order against the sanitized markup. Match on **element type + cardinality + DOM order + containment only** — never on text (it is redacted to `█`) and never on the `comp-…` hash.

1. **`sectionRoot`** = the outermost `<section class="…comp-XXXX">`. Selector = `.comp-XXXX`. Do not require a `container` class — some sections are bare `<section class="comp-…">`.
2. **Find the repeated group first, then derive the stage from it.** Scan the section's descendants for the **largest set of ≥3 sibling elements sharing the same component type**, matched by leading type class in priority order: `root image` → `g-item` → `root video` → repeated `.container comp-…` / card nodes with identical inner structure. These become `repeatedItem1..N` in DOM order.
   - Items carrying their own unique `comp-…` class → one class selector each (`.comp-…`).
   - Items sharing one class with no per-item hash (`g-item`, most repeater children) → positional selectors under their parent: `.<parent-comp> .g-item:nth-child(k)`, one per item.
3. **`hoverStage`** = the **direct parent** of that repeated group, resolved structurally, not by class name:
   - if the parent is an inner content wrapper (`.content comp-…__content`, or any single wrapper containing the group) → that element;
   - if the group's parent *is* the section root → **`hoverStage` collapses onto `sectionRoot`**; in that case the same selector carries both the stage styles and the `overflow-x: clip`, and the hover source key is still `hoverStage`.
   - Ignore `.backgroundLayer comp-…__bg` entirely when resolving.
   - `hoverStage` and `sectionRoot` may be the same element (neither of them moves, so sharing is safe). `hoverStage` and any `repeatedItem` may **never** be the same element.
4. **`mediaChild{n}`** — inside each mapped item, look for a direct media child that carries the dimensions: an anonymous wrapper containing an `img`, a `.ph-box`, or a bare `img`. If one exists, map it as `mediaChild{n}` with a selector scoped to that item (`<item-selector> > *:first-child`, or the item's own `.ph-box` / `img` scoped under the item selector — **never a bare `.g-image`, `.ph-box`, or `img` global selector**, which would hit unrelated gallery internals). If no such child exists, skip the role for that item.
5. **Classify item shape** (checkable from the subtree, drives §5b fill only):
   - **media-cover** — the item is dominated by the image (no text, or a single short label overlaid) → media fills 100% of the card face.
   - **content-stack** — the item stacks an image plus real text below it (title + a filled description node) → media takes a **fraction** of the card height (~60%) and the text takes the remainder, inside a card that is `height: 100%` of the stack box. Do not switch to `height: auto` or vertically center the stack; that leaves dead space in the card face.
6. **Everything else** in the section (`rich-text wrichtext`, `root button`, a lone decorative nested `.container comp-…`, `.backgroundLayer`) = `staticSibling`. Do not target it, do not animate it, do not restyle it.
7. **If a role is absent:** `mediaChild` absent → skip it (the item itself is the face). `hoverStage` absent as a distinct wrapper → collapse per step 3. **Reject** if step 2 yields fewer than 3 items, or if the only repeated candidates are raw `img` descendants with no stable component root of their own.

Emit `sectionRoot`, `hoverStage`, every `repeatedItem{n}`, and every present `mediaChild{n}` into the `elements` map as `{ key → { selector } }`. Keys carry the trailing index so they group as `repeatedItem{n}` / `mediaChild{n}`. `staticSibling`s are never emitted.

## 5. Structure & CSS Overrides

Wix ships its own layout; the fan only reads correctly if you both **neutralize** what fights it and **apply** the stack scaffolding. Structural only — never emit color, font, typography, or background overrides.

### 5a. Neutralize (on the mapped Wix elements)

- **`sectionRoot`** — usually `height: auto; min-height: 0`. It must be tall enough to hold a stack that is no longer in flow → set `min-height` from §7. Add `overflow-x: clip` (never `hidden`, never `overflow: clip` on all axes if any static sibling relies on vertical spill) so the fan cannot create a page-wide horizontal scrollbar.
- **`hoverStage`** — typically `display: grid` with fixed `grid-template-rows`. **Keep the grid** so `staticSibling`s stay laid out; the items leave the grid below, so they no longer consume tracks. Ensure it is **not** `overflow: clip/hidden` — the fanned items must be visible outside its box.
- **`repeatedItem{n}`** — Wix places each item decoratively via `grid-row`, `grid-column`, `margin-*: %`, and often a per-item `transform: rotate(…)`. **These resets must appear in the emitted `styles` entry for every item**, not merely in prose:
  `grid-area: auto; margin: 0; transform: none; inset: auto;`
  Without them the stack is rotated/offset and never superimposes.
- **`mediaChild{n}`** — Wix media wrappers sometimes carry a broken inline `aspect-ratio: 0` and intrinsic sizes. Neutralize with `aspect-ratio: auto !important` on the mapped child only.

### 5b. Apply

```css
/* sectionRoot — containment + room for the out-of-flow stack */
{ min-height: var(--fan-stage-height); overflow-x: clip; }

/* hoverStage — hover source, positioning context, distance basis. NO clipping. */
{
  position: relative;
  container-type: inline-size;      /* fan distances are cqw of THIS box */
  min-height: var(--fan-stage-height);
}

/* repeatedItem{n} — superimposed at the stack point, then translatable */
{
  grid-area: auto; margin: 0; transform: none; inset: auto;  /* 5a resets, re-stated in the rule */
  position: absolute;
  top: 50%; left: 50%;
  translate: -50% -50%;             /* centering lives on `translate`, animation owns `transform` */
  width: var(--fan-card-width);
  height: var(--fan-card-height);
  transform-origin: center center;
  will-change: transform;
  overflow: clip;                   /* clip the card's OWN media, not the stage */
  z-index: <N - |i - center|>;      /* center-forward deck order, per item */
}

/* mediaChild{n} — fill the card face */
/* media-cover items: */
{ width: 100%; height: 100%; object-fit: cover; display: block; aspect-ratio: auto !important; }
/* content-stack items: media takes a fraction, text takes the rest */
{ width: 100%; height: 60%; object-fit: cover; display: block; aspect-ratio: auto !important; }
/* plus, scoped under the same mapped child, its nested img/.ph-box: */
{ width: 100%; height: 100%; object-fit: cover; display: block; }

/* reduced motion — static fan, no hover dependence */
@media (prefers-reduced-motion: reduce) {
  /* one rule per item: transform: translateX(<offset_i>cqw) !important; */
}
```

- Centering stays on the CSS `translate` **property** so keyframes animating `transform` never clobber it.
- `overflow: clip` belongs on each **card**, never on `hoverStage` — clipping the stage would hide the fan.
- Emit `z-index` per item as an explicit value: `N - |i - (N-1)/2|` rounded, so the center card is topmost and the outermost are deepest (this reproduces the demo's `3,4,5,2,1` deck order for `N = 5`).

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

Replace `<…>` with real selectors from §4; expand `repeatedItem{n}` / `mediaChild{n}` to the real count.

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "sectionRoot":   { "selector": "<section .comp-…>" },
    "hoverStage":    { "selector": "<.comp-…__content or .comp-…>" },
    "repeatedItem1": { "selector": "<.comp-… | .comp-parent .g-item:nth-child(1)>" },
    "repeatedItem2": { "selector": "<…:nth-child(2)>" },
    "repeatedItem3": { "selector": "<…:nth-child(3)>" },
    // … repeatedItemN
    "mediaChild1":   { "selector": "<repeatedItem1-selector> img" }
    // … mediaChildN (omit entirely if the role is absent)
  },
  "styles": [
    { "selector": "<sectionRoot>", "properties": { "min-height": "var(--fan-stage-height)", "overflow-x": "clip" } },
    { "selector": "<hoverStage>",  "properties": { "position": "relative", "container-type": "inline-size", "min-height": "var(--fan-stage-height)" } },
    { "selector": "<repeatedItem1>", "properties": {
        "grid-area": "auto", "margin": "0", "transform": "none", "inset": "auto",
        "position": "absolute", "top": "50%", "left": "50%", "translate": "-50% -50%",
        "width": "var(--fan-card-width)", "height": "var(--fan-card-height)",
        "transform-origin": "center center", "overflow": "clip",
        "will-change": "transform", "z-index": "<N - |i - center|>" } },
    // one style rule per repeatedItem (identical except selector + z-index)
    { "selector": "<mediaChild1>", "properties": {
        "width": "100%", "height": "100%", "object-fit": "cover",
        "display": "block", "aspect-ratio": "auto !important" } }
    // one per mediaChild; height becomes "60%" for content-stack items
  ],
  "interact": {
    "conditions": {
      "desktop": { "type": "media", "predicate": "(min-width: 769px)" },
      "mobile":  { "type": "media", "predicate": "(max-width: 768px)" }
    },
    "effects": {},
    "interactions": [
      { "key": "hoverStage", "trigger": "hover", "conditions": ["desktop"], "effects": [ /* §6b, one per item */ ] },
      { "key": "hoverStage", "trigger": "hover", "conditions": ["mobile"],  "effects": [ /* §6b, peek step */ ] }
    ]
  },
  "controls": [ /* §8 */ ]
}
```

### 6b. Interact effects (template)

Illustrative values — recompute every number from §7 against the real section.

```ts
// N    = number of mapped repeated items (§4)
// step = horizontal spacing between adjacent cards, in cqw of hoverStage (§7)

// Symmetric offsets around the stack center, DOM order.
// N=5, step=25  ->  [-50, -25, 0, 25, 50]   (exact center card does not move)
const offsets = (N: number, step: number) =>
  Array.from({ length: N }, (_, i) => +(((i - (N - 1) / 2) * step).toFixed(2)));

// Center-forward deck order for the STYLE rules (not the effects):
const zIndex = (N: number, i: number) => N - Math.abs(i - (N - 1) / 2);

const fanEffect = (key: string, endX: number, duration: number) => ({
  key,
  keyframeEffect: {
    name: `${key}-fan`,
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: `translateX(${endX}cqw)` },
    ],
  },
  triggerType: 'alternate' as const,   // pointer-out reverses the fan
  duration,                            // 600 desktop / 500 mobile
  easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
  fill: 'both' as const,
});

const desktop = {
  key: 'hoverStage',
  trigger: 'hover',
  conditions: ['desktop'],
  effects: offsets(N, stepDesktop).map((x, i) => fanEffect(`repeatedItem${i + 1}`, x, 600)),
};

const mobile = {
  key: 'hoverStage',
  trigger: 'hover',
  conditions: ['mobile'],
  effects: offsets(N, stepMobile).map((x, i) => fanEffect(`repeatedItem${i + 1}`, x, 500)),
};
```

Emit an effect for **every** mapped item, including the exact center item when `N` is odd (its offset is `0`; the demo keeps this no-op effect so the set stays uniform).

## 7. Adaptive Parameters

Recompute from the real section; never copy demo literals (`25vw`, `50vw + 20px`, `70vh` are demo-stage-specific).

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped `repeatedItem`s | 3–7 (reject `< 3`; if `> 7`, map the first 7 in DOM order and `log` the drop) |
| `--fan-card-width` | `min(<source item width>, 100cqw / N)` — a card must be narrow enough that `N` of them fit the stage width when fanned | 12–30% of stage width |
| `--fan-card-height` | keep the source item's aspect ratio: `card-width / <source aspect>`; cap at `70vh` so the stack fits the viewport | ≤ `70vh` |
| `--fan-stage-height` | `--fan-card-height + 2 * <existing vertical padding>` — the stack is out of flow, so the stage/section needs explicit height | ≥ card height |
| `stepDesktop` (cqw) | `min(cardWidthCqw + gapCqw, (100 - cardWidthCqw) / (N - 1))` — one card + gap, capped so the outermost card stays inside the stage's own width | 10–34 |
| `gapCqw` | small breathing room between fanned cards: `~2` | 0–5 |
| `stepMobile` (cqw) | `stepDesktop * 0.35` — a peek fan; cards deliberately still overlap | 3–12 |
| `duration` | `600` desktop / `500` mobile (from the source; scale by the `pace` control) | 300–1000 ms |
| reduced-motion offsets | identical to `offsets(N, stepDesktop)`, applied statically as `transform: translateX(<x>cqw) !important` | — |

If the outermost card would land outside the stage's clip-free area *and* past the section edge, reduce `stepDesktop` (or `--fan-card-width`) before returning — never widen the section.

## 8. Suggested Controls

### `spread`
- **Label:** Spread · **Group:** Layout · **Type:** range
- **Default:** derived `stepDesktop` (§7) · **Constraints:** min 10, max 34, step 1, unit cqw
- **Description:** how far apart the cards sit when the stack is fanned open.
- **Suggested variable:** `--fan-step`

### `card-size`
- **Label:** Card Size · **Group:** Layout · **Type:** range
- **Default:** derived `--fan-card-width` (§7) · **Constraints:** min 12, max 30, step 1, unit cqw
- **Description:** width of each card in the stack; height follows the source aspect ratio.
- **Suggested variable:** `--fan-card-width`

### `pace`
- **Label:** Pace · **Group:** Motion · **Type:** range
- **Default:** 600 · **Constraints:** min 300, max 1000, step 50, unit ms
- **Description:** how long the fan takes to open (and to close on pointer-out).
- **Suggested variable:** `--fan-duration`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] Exactly **two** interactions, both `trigger: 'hover'` on `hoverStage`, one gated `desktop`, one gated `mobile`. No `viewProgress`, no sticky pin, no runway height anywhere.
- [ ] Every effect has `triggerType: 'alternate'` — otherwise the fan never closes on pointer-out.
- [ ] Effect count per interaction `== N`; no mapped item silently dropped, including the zero-offset center item.
- [ ] Offsets are symmetric around 0 and in DOM order (leftmost negative → rightmost positive).
- [ ] `hoverStage` is **not** a `repeatedItem` and is never itself animated (a moving hover source flickers).
- [ ] `hoverStage` has `position: relative` **and** `container-type: inline-size`, and does **not** carry `overflow: clip/hidden`; `overflow-x: clip` lives on `sectionRoot` instead.
- [ ] Every `repeatedItem` style entry literally contains `grid-area: auto`, `margin: 0`, `transform: none`, `inset: auto` — prose alone is not enough; without these the stack stays scattered/rotated.
- [ ] Centering is on `translate: -50% -50%`; keyframes touch only `transform`.
- [ ] Each item has an explicit `z-index` following the center-forward formula (center topmost).
- [ ] Media selectors are scoped per item — no bare `.g-image`, `.ph-box`, or `img` layout/hide rule; the number of matched media nodes equals the number of mapped items.
- [ ] `sectionRoot` / `hoverStage` `min-height` covers the out-of-flow card height, so the section does not collapse.
- [ ] A `prefers-reduced-motion: reduce` block statically places every item at its fanned offset.
- [ ] No effect targets a key absent from `elements`; no `staticSibling` (heading, paragraph, button, `.backgroundLayer`) is styled or animated.