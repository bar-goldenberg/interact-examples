# Manta Ray

A row of overlapping images glides in on view-enter, breathes with a continuous vertical loop, and scales up under the pointer.

## 1. Identity

- **⚠ adaptation crux:** the demo builds its row with a purpose-made `display: flex; flex-nowrap` container and per-item negative `margin-left`, with the interact wrapper set to `display: contents`. A Wix section has no such container — the images are grid children of a content wrapper that **also holds static text/buttons**, so the wrapper itself must not be re-flowed. **Substitution:** keep the content wrapper in place, take the mapped image items **out of flow** (`position: absolute`) inside it, and reproduce the overlap by placing each item at `left: calc(50% + <offset>)` with `translate: -50% -50%` centering. Offsets are computed from item width × (1 − overlap), so the visual result — one centered, overlapping, non-wrapping row — is identical while static siblings keep their grid layout.
- **id:** `manta-ray`
- **mechanism:** `viewenter-loop-hover-scale` — a single `viewEnter` (once) sequence starts an infinite, alternating vertical translate loop on each image's media child; an independent `hover` interaction per item scales that same media child up, composited additively over the loop.
- **fits sections with:** one uniform group of **3–8 repeated image components** that can be re-placed as a centered overlapping row. Static siblings (heading, paragraph, button) are allowed and are left in place.
- **rejects:** sections with fewer than 3 repeated image components; sections where the repeated group cannot be isolated by element type; sections whose repeated items are **content-stacks whose text must stay readable** (image + filled description) — this pattern's face is a pure image scaled 2×+, and text has nowhere to go, so map only the media wrapper or reject.

## 2. Motion Spec (invariant intent)

This is what the result must look like. Preserve it exactly; only the numbers in §7 adapt. **Two independent triggers — neither is scroll-driven. Do not invent `viewProgress`, a sticky stage, or a scroll runway.**

- **Static composition (before any motion):** N images form a single horizontal, non-wrapping, centered row, each overlapping its left neighbour by ~2/3 of its width. DOM order is left → right; later items paint above earlier ones.
- **Trigger A — entrance + loop (`viewEnter`, `threshold: 0`, `triggerType: 'once'`):** after a short initial offset (~150 ms), each item's media child begins an **infinite alternating** vertical translate loop (`translateY(-A) ⇄ translateY(+A)`), `duration ≈ 2000 ms`, `easing: 'ease-in-out'`, `iterations: Infinity`, `alternate: true`, `composite: 'add'`. Items start their loop **staggered by DOM index**, so the row undulates as a travelling wave rather than bobbing in unison.
- **Trigger B — hover (`hover`, per item):** hovering an item scales **its media child** from `scale(1)` to `scale(S)` (S ≈ 2.5) over `300 ms`, `easing: 'ease-out'`, `fill: 'both'`, `triggerType: 'alternate'` (so it reverses on pointer-out), `composite: 'add'`.
- **Ownership split (critical):** the **item root** is the hover source; the **media child** is the animated element. This keeps the hover hit-area a fixed size while the picture grows — scaling the hover source itself causes enter/leave feedback flicker.
- **Composition:** both effects write `transform` on the same element. Both MUST use `composite: 'add'` so the hover scale layers on top of the running loop instead of cancelling it.
- **Optional media condition:** under `prefers-reduced-motion: reduce`, skip the infinite loop interaction entirely and keep only the hover scale.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never by class names or text (Wix classes are opaque `comp-*`; text is redacted).

| Role | Signature | Owns |
| --- | --- | --- |
| `sectionRoot` | The outermost `<section>` / outermost element. Exactly one. | Nothing animated. Only `overflow: clip` so the loop and hover scale don't leak into neighbouring sections. |
| `stage` | The tightest single wrapper that contains the whole repeated image group (the `.content` child if present, else the section's own direct child, else `sectionRoot`). Exactly one. | `position: relative` (positioning ancestor for the row), `min-height` (breathing room), and being the **`viewEnter` source key**. |
| `item{n}` | The largest uniform group of sibling image components (`root image comp-…`, `g-item`, …), ≥3, in DOM order. | Its absolute placement in the overlap row (`left`, `top`, `translate`, `width`, `aspect-ratio`, `z-index`) and being the **hover source key**. Never animated itself. |
| `media{n}` | The first direct child element of `item{n}` (anonymous wrapper, `.ph-box`, or `img`) — the node that actually carries the picture. One per item. | The animated `transform`: breathe loop + hover scale. Fills its item box. |
| `staticSibling` | Any non-repeated sibling (`rich-text`, `root button`, decorative container). | Nothing — explicitly left untouched, and left in the stage's normal grid flow. |

**Ownership is strict:** trigger source → `stage` (viewEnter) and `item{n}` (hover); placement → `item{n}`; transform → `media{n}`. Never put the animated transform on `item{n}` unless the fallback in §4 step 5 applies.

## 4. Mapping Procedure (Wix sanitized HTML)

Run in order against the sanitized markup. Match on **element type + cardinality + DOM order + containment only** — never on text (it is redacted to `█`) and never on the `comp-…` hash.

1. **`sectionRoot`** = the outermost `<section class="… comp-XXXX">`. Selector = `.comp-XXXX`. Do not require the `container` class.
2. **Find the repeated group first**, before deciding the stage: scan the section's descendants for the **largest set of ≥3 sibling elements sharing the same component type**, in priority order `root image` → `g-item` → `root video` → identical repeated `comp-*` roots with matching inner structure. These become `item1..N` in DOM order.
   - Items with their own unique `comp-…` class → one class selector each.
   - Items sharing a class with no per-item hash (`g-item`, repeater children) → positional selectors under their container: `.<container-comp> .g-item:nth-child(k)`.
3. **`stage`** = the **tightest single element that contains all of `item1..N`**. If the section uses the container/content shape, this is normally the `.content comp-XXXX__content` child; if the section is a bare grid `<section>` with no inner wrapper, `stage` = `sectionRoot`. Resolve by containment, not by class name. Ignore `.backgroundLayer`.
4. **`media{n}`** = the **first direct child element** of `item{n}`. Accept an anonymous `<div>`, a `.ph-box`, or a raw `<img>` — whichever is actually there. Do **not** hard-code `.ph-box`, and do **not** write a broad `.g-image` / `img` rule; emit one scoped rule per mapped media role.
5. **If `media{n}` is absent** (the item has no element child — text node or empty): fall back to animating `item{n}` itself, and accept that the hover source and animated element coincide. Use `triggerType: 'alternate'` (already required) to keep pointer-out reversal correct.
6. **`staticSibling`** = everything else inside `stage` (`rich-text`, `root button`, lone nested `container`). Do not target, do not restyle, do not move.
7. **Reject** if step 2 yields fewer than 3 items, or if the only repeated candidates are raw `img` descendants with no stable component root, or if each item is a content-stack whose description text is non-trivial (see §1 rejects).

Emit `sectionRoot`, `stage`, and every `item{n}` / `media{n}` into the `elements` map as `{ key → { selector } }`. `staticSibling` is **not** emitted. Keys carry a trailing index so they group as `item{n}` / `media{n}`.

## 5. Structure & CSS Overrides

Structural / motion styling only — never emit color, font, typography, or background overrides.

### 5a. Neutralize (emit these as real properties in the style rules, not as prose)

- **`item{n}`** — Wix places each item with `grid-row` / `grid-column`, `margin-*: %`, and sometimes a decorative `transform: rotate(…)`. Every item style entry **must literally carry** `grid-area: auto; margin: 0; transform: none; float: none;` or the items stay rotated/offset and the overlap row never forms. This reset is mandatory in the emitted `styles`, not an instruction.
- **`media{n}`** — Wix media wrappers sometimes ship a broken inline `aspect-ratio: 0` and intrinsic sizing. Reset with `aspect-ratio: auto !important; width: 100%; height: 100%; display: block;` and set the nested picture to cover.
- **`stage`** — usually `display: grid` with fixed `grid-template-rows`. **Keep the grid** (the static siblings depend on it); the items leave it by going absolute, so no grid changes are needed. Only add `position: relative` and a `min-height`.
- **`sectionRoot`** — `height: auto` is correct here; there is **no runway**. Do not set a tall height.

### 5b. Apply

```css
/* sectionRoot — contain the loop travel and the hover scale */
{ overflow: clip; }                     /* clip, never hidden — hidden creates a scroll container */

/* stage — positioning ancestor + vertical breathing room */
{ position: relative; min-height: <stageMinHeight>; }   /* §7 */

/* item{n} — out of flow, placed into the centered overlap row */
{
  grid-area: auto; margin: 0; transform: none; float: none;  /* 5a resets, mandatory */
  position: absolute;
  top: 50%;
  left: calc(50% + <offsetN>vw);        /* §7 — symmetric around center */
  translate: -50% -50%;                 /* centering lives on `translate`, NOT on `transform` */
  width: <itemWidth>vw;
  aspect-ratio: <sourceRatio>;          /* from the item's own rendered ratio; default 3 / 4 */
  z-index: <n>;                         /* DOM order paints later items above earlier ones */
  pointer-events: auto;
  cursor: pointer;
}

/* media{n} — the only animated element */
{
  aspect-ratio: auto !important;
  width: 100%; height: 100%;
  display: block;
  object-fit: cover;
  transform-origin: center center;
  will-change: transform;
}

/* nested picture, scoped per mapped media role — never a bare `img` / `.g-image` rule */
<media{n}> img, <media{n}> .ph-box {
  width: 100%; height: 100%; object-fit: cover; display: block;
}

/* optional: keep the hovered image above its neighbours */
<item{n}>:hover { z-index: <N + 1>; }
```

- Centering is on the CSS `translate` property and the animation owns `transform`, so the keyframes can never clobber the centering.
- `<offsetN>` is baked into `left`, not into the animated transform — the loop and hover scale then read as pure motion.

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

Replace `<…>` with real selectors from §4; expand `item{n}` / `media{n}` to the real count.

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "sectionRoot": { "selector": "<section .comp-…>" },
    "stage":       { "selector": "<.comp-…__content or section>" },
    "item1":  { "selector": "<.comp-…>" },
    "media1": { "selector": "<.comp-… > :first-child>" },
    "item2":  { "selector": "<.comp-…>" },
    "media2": { "selector": "<.comp-… > :first-child>" },
    "item3":  { "selector": "<.comp-…>" },
    "media3": { "selector": "<.comp-… > :first-child>" }
    // … itemN / mediaN
  },
  "styles": [
    { "selector": "<sectionRoot>", "properties": { "overflow": "clip" } },
    { "selector": "<stage>",       "properties": { "position": "relative", "min-height": "<stageMinHeight>" } },

    { "selector": "<item1>", "properties": {
        "grid-area": "auto", "margin": "0", "transform": "none", "float": "none",
        "position": "absolute", "top": "50%", "left": "calc(50% + <offset1>vw)",
        "translate": "-50% -50%", "width": "<itemWidth>vw",
        "aspect-ratio": "<sourceRatio>", "z-index": "1",
        "pointer-events": "auto", "cursor": "pointer" } },
    { "selector": "<media1>", "properties": {
        "aspect-ratio": "auto !important", "width": "100%", "height": "100%",
        "display": "block", "object-fit": "cover",
        "transform-origin": "center center", "will-change": "transform" } },
    { "selector": "<media1> img, <media1> .ph-box", "properties": {
        "width": "100%", "height": "100%", "object-fit": "cover", "display": "block" } }
    // … one item / media / media-child triple per mapped item (offsets and z-index differ)
  ],
  "interact": {
    "effects": {
      "breathe-vertical": { /* §6b */ },
      "scale-up-image":   { /* §6b */ }
    },
    "conditions": { /* optional: reduced-motion */ },
    "interactions": [
      { "key": "stage", "trigger": "viewEnter", "params": { "threshold": 0 },
        "sequences": [ /* §6b: one staggered step per media{n} */ ] },
      { "key": "item1", "trigger": "hover", "effects": [ /* §6b: scale media1 */ ] },
      { "key": "item2", "trigger": "hover", "effects": [ /* … */ ] }
      // … one hover interaction per item
    ]
  },
  "controls": [ /* §8: image-size, overlap, hover-scale */ ]
}
```

### 6b. Interact effects (template)

Illustrative values — recompute everything marked in §7. Keyed to the element keys from §4.

```ts
// N          = mapped item count (§4)
// A          = breathe half-amplitude in px (§7)
// PACE       = loop duration ms (§7, ~2000)
// STAGGER    = ms of phase offset per DOM index (§7)
// LEAD       = initial offset before the loop starts (~150 ms, from the demo)
// HOVER_SCALE = hover end scale (control, §8)

const effects = {
  'breathe-vertical': {
    keyframeEffect: {
      name: 'breathe',
      keyframes: [
        { transform: `translateY(${-A}px)` },
        { transform: `translateY(${A}px)` },
      ],
    },
    duration: PACE,
    easing: 'ease-in-out',
    iterations: Infinity,
    alternate: true,
  },
  'scale-up-image': {
    keyframeEffect: {
      name: 'scale-up',
      keyframes: [
        { transform: 'scale(1)' },
        { transform: `scale(${HOVER_SCALE})` },
      ],
    },
    duration: 300,
    easing: 'ease-out',
    fill: 'both',
  },
};

// Trigger A — one viewEnter, N staggered sequence steps (the stagger IS the manta-ray wave).
// Sequence offsets accumulate: first step carries the lead-in, the rest carry the stagger.
const loopInteraction = {
  key: 'stage',
  trigger: 'viewEnter',
  params: { threshold: 0 },
  sequences: Array.from({ length: N }, (_, i) => ({
    offset: i === 0 ? LEAD : STAGGER,
    triggerType: 'once' as const,
    effects: [
      { key: `media${i + 1}`, effectId: 'breathe-vertical', composite: 'add' as const },
    ],
  })),
};

// Trigger B — one hover interaction per item; source = item root, target = media child.
const hoverInteractions = Array.from({ length: N }, (_, i) => ({
  key: `item${i + 1}`,
  trigger: 'hover',
  effects: [
    {
      key: `media${i + 1}`,
      effectId: 'scale-up-image',
      triggerType: 'alternate' as const,
      composite: 'add' as const,   // MUST be add — it layers over the running loop
    },
  ],
}));
```

Optional reduced-motion variant: declare a `reduced-motion` media condition and gate `loopInteraction` on its **negation**, leaving the hover interactions ungated.

## 7. Adaptive Parameters

Recompute from the real section; never copy demo literals.

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped `item{n}`s | 3–8 (reject < 3) |
| `overlap` | fraction of an item hidden by its right neighbour; control default `0.67` | 0.3–0.8 |
| `itemWidth` (vw) | control default `12`, then hard-cap so the row fits the stage: `itemWidth ≤ 80 / (1 + (N - 1) * (1 - overlap))` | 6–24 |
| `step` (vw) | `itemWidth * (1 - overlap)` | — |
| `offset{i}` (vw, i = 0…N-1) | `(i - (N - 1) / 2) * step` → symmetric around center, leftmost negative | — |
| `sourceRatio` | the item's own rendered `width / height`; if unknowable use `3 / 4` | — |
| `itemHeight` (px, for sizing math) | `itemWidth vw ÷ sourceRatio`, evaluated at a 1440px reference width | — |
| `A` (px) | `clamp(30, 0.35 * itemHeight, 120)` — half of the vertical travel | 30–120 |
| `PACE` (ms) | `2000`; scale with amplitude: `clamp(1400, 2000 * (A / 60), 4000)` | 1400–4000 |
| `STAGGER` (ms) | `clamp(80, PACE / (N * 2), 300)` — a full wave crosses the row in ~half a cycle | 80–300 |
| `LEAD` (ms) | `150` | 100–400 |
| `stageMinHeight` | `max(60vh, calc(<itemHeight>px + <2A>px + 8vh))` — the loop must never clip the item against the stage | ≥ 50vh |
| `HOVER_SCALE` | control default `2.5`, capped so a centered hovered item stays inside the stage: `HOVER_SCALE ≤ 90 / itemWidth` | 1.2–3 |

If the computed row (`itemWidth + (N-1)*step`) exceeds 80vw, reduce `itemWidth` before increasing `overlap`.

## 8. Suggested Controls

### `image-size`
- **Label:** Image Size · **Group:** Layout · **Type:** range
- **Default:** 12 · **Constraints:** min 6, max 24, step 0.5, unit vw
- **Description:** width of each image in the overlapping row.
- **Suggested variable:** `--manta-ray-item-width`

### `overlap`
- **Label:** Overlap · **Group:** Layout · **Type:** range
- **Default:** 0.67 · **Constraints:** min 0.3, max 0.8, step 0.01
- **Description:** how much of each image is covered by its right-hand neighbour.
- **Suggested variable:** `--manta-ray-overlap`

### `hover-scale`
- **Label:** Hover Scale · **Group:** Motion · **Type:** range
- **Default:** 2.5 · **Constraints:** min 1.2, max 3, step 0.05
- **Description:** how large an image grows while the pointer is over it.
- **Suggested variable:** `--manta-ray-hover-scale`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] Trigger truth: exactly **one** `viewEnter` interaction and **N** `hover` interactions. No `viewProgress`, no sticky stage, no runway height anywhere.
- [ ] Every mapped item has **exactly one** breathe sequence step and **exactly one** hover interaction (step count == hover count == N). No item silently dropped.
- [ ] Both the breathe effect and the scale effect use `composite: 'add'`; the hover effect also uses `triggerType: 'alternate'`. Without both, hover cancels the loop or never reverses.
- [ ] The breathe effect has `iterations: Infinity` and `alternate: true` — it must never settle.
- [ ] Hover **source** key is `item{n}`; hover **target** key is `media{n}`. They are different elements (unless the §4 step 5 fallback applied, and that fallback is the only reason they coincide).
- [ ] Each `item{n}` style entry literally contains `grid-area: auto`, `margin: 0`, and `transform: none` — not just prose. Otherwise decoratively rotated/offset Wix items never align into the row.
- [ ] Centering is `translate: -50% -50%`; no keyframe writes `translate`, and no style writes an animated-looking `transform` on `media{n}`.
- [ ] `left` offsets are symmetric around `50%` and in DOM order (leftmost most-negative), and `z-index` ascends with DOM order.
- [ ] `stage` has `position: relative` **and** a `min-height` ≥ the §7 formula; `sectionRoot` has `overflow: clip` (not `hidden`), and neither has a tall runway height.
- [ ] No broad `img`, `.g-image`, or `.ph-box` rule exists — every media/fill rule is scoped under a mapped `media{n}` selector, and the count of such rules == N.
- [ ] Each animated selector resolves to exactly one element in the target section; the item selector set resolves to exactly N.
- [ ] No effect targets a key absent from `elements`; no `staticSibling` is animated, moved, or restyled.
- [ ] No color, font, typography, or background property appears in any style rule.