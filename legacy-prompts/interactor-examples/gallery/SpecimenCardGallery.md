# Specimen Card Gallery

Repeated cards begin stacked at the center of a pinned viewport — blurred, shrunken, Y-rotated and transparent — and fan out into a flat, evenly-spaced horizontal row as the section scrolls, each card resolving on its own staggered slice.

## 1. Identity

- **id:** `specimen-card-gallery`
- **mechanism:** `scroll-pin-converge-row` — a tall runway drives one `viewProgress` interaction; an inner wrapper is pinned (`sticky`, `100vh`, `overflow: clip`); repeated cards start absolutely stacked at stage center in a blurred/rotated/scaled-down state and translate outward to their final row slots over staggered `contain` sub-ranges, un-blurring and flattening as they land.
- **fits sections with:** one uniform group of **3–7 repeated card/media components** (image cards, gallery items, repeater rows) that can be re-stacked at center. Cards may carry their own title/meta text — the whole card is the animated unit. Static section-level siblings (heading, paragraph, button) are allowed and left in place.
- **rejects:** fewer than 3 repeated items; a repeated group that cannot be isolated by component type; or a group whose only candidates are raw `img` descendants with no stable component root.
- **⚠ adaptation crux:** the demo owns three page-level boxes the Wix world does not give you — a separate hero `<section>`, a dedicated `#scroll-wrapper` runway `<div>` (600vh), and a `.cards-row` flex track inside the sticky container. **Substitution:** collapse them into the single section. The section root *is* the runway (its height becomes the 600vh-equivalent); its direct content wrapper *is* the pinned stage; and the missing `.cards-row` flex track is replaced by **absolute per-item placement** — each card is centered on the stage (`top/left: 50%` + `translate: -50% -50%`) and its **final row slot is expressed as the end value of the animated `transform`** (`translateX(rowX_i)`), not as flow layout. The demo's flow-relative keyframes (start `−rowX_i` → end `0`) therefore become stage-absolute keyframes (start `0` → end `rowX_i`); the two are visually identical because in the demo all five cards also begin exactly overlapping at screen center.

## 2. Motion Spec (invariant intent)

This is the fidelity target. Preserve it exactly; only the numbers in §7 adapt.

- **Trigger:** exactly one `viewProgress` interaction whose source key is the section runway (`scrollSource`). No hover, click, or entrance trigger exists in the source; do not add one.
- **Start state (progress 0):** every card sits **exactly overlapping at the center** of the pinned stage — `opacity: 0`, `filter: blur(12px)`, `scale(0.7)`, pushed **down** by ~60px (`translateY(60px)`), and Y-rotated in perspective away from its eventual side (leftmost card rotated **positive**, rightmost **negative**, center card `0deg`).
- **Mid state (offset 0.45 of each card's own slice):** the card is already **fully opaque and fully un-blurred**, sitting at **half** its final horizontal offset, `translateY(0)`, `scale(0.88)`, rotation at ~30% of its start angle. This is the legibility hold — opacity and blur resolve early and stay resolved for the whole back half.
- **End state (progress 1):** cards form a **flat, evenly-spaced horizontal row**, symmetric about center — `opacity: 1`, `blur(0px)`, `rotateY(0deg)`, `scale(1)`, `translateX(rowX_i)` where `rowX_i` is the card's DOM-order slot in the row (leftmost most-negative → rightmost most-positive).
- **Ordering / stagger:** slices are **center-out**. The middle card starts at progress 0 and finishes earliest; each step outward starts later and finishes later, so the row assembles from the middle outward. All slices overlap heavily — several cards are always mid-motion together, and the outermost pair finishes last.
- **Ranges:** per-card `contain <startPct>% → <endPct>%` (see §7 formulas). Never `exit` — the stage is pinned and has no per-item exit window.
- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` (fast out, long settle) on every card effect.
- **Fill:** `both` on every effect — cards must hold the blurred center-stack state before the range and the flat row after it.
- **Perspective:** the 3D tilt is per-card (`perspective(1200px)` inside the card's own `transform`), never a `perspective` property on an ancestor of the `viewProgress` target.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never by class names or text (Wix classes are opaque `comp-*`; text is redacted to `█`).

| Role | Signature | Owns |
| --- | --- | --- |
| `scrollSource` | The outermost `<section>` / outermost container element. Exactly one. | The scroll runway (tall height). Drives the single `viewProgress` interaction. |
| `stickyStage` | The tightest single wrapper that contains the whole repeated group — the section's direct content child if one exists, else the section itself. Exactly one. | Pinning (`sticky`, `top: 0`, `height: 100vh`), clipping (`overflow: clip`), `container-type: inline-size`, and the **positioning context** for the stacked cards. |
| `repeatedItem{n}` | The largest uniform group of ≥3 sibling components of the same type (image / gallery item / repeater card), in DOM order. | Its own center placement (via `translate`) **and** its converge transform + blur + opacity (via animated `transform`/`filter`/`opacity`). |
| `mediaChild{n}` | *Optional.* The direct media wrapper (or `img`) inside `repeatedItem{n}` that actually carries the dimensions. | Filling its card box (`width/height: 100%`, `object-fit: cover`), and neutralizing broken inline ratios. Never animated itself. |
| `staticSibling` | Any non-repeated sibling of the group (heading, paragraph, button, decorative container, `.backgroundLayer`). | Nothing — explicitly left untouched and left in flow. |

**Ownership is strict:** runway → `scrollSource`; pin + clip + positioning context → `stickyStage`; per-card transform/filter/opacity → `repeatedItem{n}`. Never put the runway height on the pinned element, never put the converge transform on a descendant `img`, and never animate `stickyStage` (it also holds `staticSibling`s).

## 4. Mapping Procedure (Wix sanitized HTML)

Match on **element type + cardinality + DOM order + containment only**. Never on text (it is redacted) and never on the `comp-…` hash. Run in order:

1. **`scrollSource`** = the outermost `<section class="container comp-XXXX">`, or, if the section carries no `container` class, the outermost `<section class="comp-XXXX">`. Selector = `.comp-XXXX`. Exactly one.
2. **Find the repeated group first** (it determines the stage). Walk the subtree and take the **largest set of ≥3 sibling elements sharing the same component type**, in this priority order:
   1. siblings each matching `root image comp-…`
   2. siblings each matching `g-item` (gallery/repeater children — these share one class)
   3. siblings each matching `root video comp-…`
   4. sibling `container comp-…` / card-like elements with **identical inner structure** (same child type sequence)
   Ties (two equal-size groups): prefer the group whose members contain an image descendant; then the group appearing first in DOM order. These become `repeatedItem1..N` in DOM order.
3. **Selectors for the items:**
   - Each item has its own unique `comp-…` class → one class selector per item (`.comp-…`).
   - Items **share** a class (`g-item`, most repeater children) → select positionally under their parent: `.<parent-comp> .g-item:nth-child(k)`, one selector per `k`. Never emit a bare `.g-item` selector for layout, clipping, or hiding.
4. **`stickyStage`** = the **tightest single element that contains all of `repeatedItem1..N`**, resolved structurally:
   - If the section has a direct `.content comp-XXXX__content` child that contains the group → that element.
   - Else the nearest common ancestor of the group that is a **descendant of `scrollSource`**.
   - Else (the group's direct parent *is* `scrollSource`, i.e. a bare grid `<section>`) → **promote**: `stickyStage` resolves to `scrollSource`. In that case you must **still keep two separate boxes** — you cannot pin and run a runway on one element. Resolution: if no inner wrapper exists at all, **reject** rather than collapse, because `scrollSource` and `stickyStage` must move independently.
   - Never require the class names `content` / `__content` / `backgroundLayer` to exist. Always ignore `.backgroundLayer comp-…__bg`.
5. **`mediaChild{n}`** (optional but preferred): inside each `repeatedItem{n}`, if the image role has a **direct child** carrying the dimensions — an anonymous wrapper, a `.ph-box`, or a raw `img` — map it as `mediaChild{n}` with a selector scoped to that item (`<item-selector> > *` is not allowed; use `<item-selector> .ph-box`, `<item-selector> img`, or `<item-selector> .root.image`, whichever exists). Emit one rule **per mapped item**, never a global `.ph-box`/`img`/`.g-image` rule.
6. **`staticSibling`** = everything else inside `stickyStage` (`rich-text wrichtext comp-…`, `root button comp-…` / `.presetWrapper`, lone decorative `container comp-…`). Do **not** map it into `elements`, do not style it, do not animate it. Because the cards leave normal flow (§5b), static siblings keep their grid placement automatically.
7. **If a role is absent:**
   - `mediaChild` absent → skip it; the item root carries the sizing.
   - `stickyStage` absent (step 4's last branch) → **reject**.
   - fewer than 3 items in step 2 → **reject**.
8. **Emit into `elements`:** `scrollSource`, `stickyStage`, `repeatedItem1..N`, and `mediaChild1..N` if mapped — each as `{ key → { selector } }`. Keys carry the trailing index so they group as `repeatedItem{n}`. No `staticSibling` key is emitted.

## 5. Structure & CSS Overrides

Structural / motion only. **Never** emit color, font, typography, or background — the Wix theme owns those.

### 5a. Neutralize (on the mapped Wix elements)

- **`scrollSource`** — Wix ships `height: auto; min-height: 0`. Override with the runway height from §7. Without this there is no scroll range and nothing animates.
- **`stickyStage`** — frequently `display: grid` with fixed `grid-template-rows`. **Keep the grid** (static siblings still need it) but add `position: relative` so it becomes the positioning ancestor, plus the pin/clip below. It must be the *same* element that pins and that positions the cards — otherwise `top: 50%` resolves against one box while the clip belongs to another and cards get cut.
- **`repeatedItem{n}`** — Wix places each card via `grid-row` / `grid-column`, per-item `margin-*: %`, and sometimes a decorative `transform: rotate(…)` (arc/scatter layouts). **These resets must appear in the emitted `styles` entry for every item**, not merely in prose: `grid-area: auto; margin: 0; transform: none; rotate: none; inset: auto;`. Skip them and the "stacked at center" start state is wrong and the row never aligns.
- **`mediaChild{n}`** — Wix media wrappers sometimes carry `aspect-ratio: 0` or an intrinsic ratio that collapses inside a resized card. Neutralize with `aspect-ratio: auto !important` and fill the box.

### 5b. Apply

```css
/* scrollSource — runway (the demo's #scroll-wrapper, 600vh) */
{ height: calc(var(--scg-runway) * 1vh); }              /* §7 */

/* stickyStage — pin + clip + positioning context + container query base */
{
  position: sticky; top: 0;
  height: 100vh;
  overflow: clip;                    /* clip, never hidden — hidden breaks ViewTimeline */
  position: relative;                /* positioning ancestor for the stack */
  container-type: inline-size;       /* row width measured against the CLIP box, not the viewport */
}

/* repeatedItem{n} — center-stack, then be transformable */
{
  grid-area: auto; margin: 0; transform: none; rotate: none; inset: auto;  /* 5a resets */
  position: absolute;
  top: 50%; left: 50%;
  translate: -50% -50%;              /* centering lives on `translate`, animation owns `transform` */
  width: var(--scg-card-width);      /* §7, in cqw */
  max-height: 82cqh;                 /* fit the stage — content-stack cards are tall */
  max-width: 90cqw;
  transform-origin: center center;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: transform, filter, opacity;
  z-index: 1;                        /* above the (static) background layer */
}

/* mediaChild{n} — fill the resized card box (per-item selectors only) */
{ width: 100%; height: 100%; object-fit: cover; display: block; aspect-ratio: auto !important; }
```

- **Card fill strategy** — classify each item from its subtree:
  - **media-cover** (image dominates, at most a short title): the image fills the card face; `mediaChild` gets `height: 100%`.
  - **content-stack** (image + meta/title/description, like the source cards): give the **media child a fraction** — `height: 58%` (range 55–65%) — and let the text take the remainder inside a card that is `height: 100%` of a band shorter than the stage (`max-height: 82cqh`). Do **not** use `height: auto` or vertically center the stack; both leave dead space and desync the row baseline.
- Keep the centering on the `translate` **property** and the motion on `transform` — they compose, so keyframes never clobber the centering.
- `perspective(1200px)` belongs **inside each card's own animated `transform`**, never as a `perspective` property on `stickyStage` (a transform-ish property on an ancestor of a `viewProgress` target freezes ViewTimeline sampling).
- Do not emit any rule that matches media broadly (`.g-image`, `.ph-box`, `img` unscoped). Every layout/fill rule is scoped to a mapped `repeatedItem`/`mediaChild` selector.

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

Replace `<…>` with real selectors resolved in §4; expand `repeatedItem{n}` / `mediaChild{n}` to the real count.

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "scrollSource":  { "selector": "<section .comp-…>" },
    "stickyStage":   { "selector": "<inner wrapper .comp-…>" },
    "repeatedItem1": { "selector": "<.comp-… | .comp-parent .g-item:nth-child(1)>" },
    "repeatedItem2": { "selector": "<…>" },
    "repeatedItem3": { "selector": "<…>" },
    // … repeatedItemN
    "mediaChild1":   { "selector": "<repeatedItem1 media child>" },
    "mediaChild2":   { "selector": "<…>" },
    "mediaChild3":   { "selector": "<…>" }
    // … mediaChildN  (omit the whole family if no dimension-carrying child exists)
  },
  "styles": [
    { "selector": "<scrollSource>", "properties": {
        "height": "calc(var(--scg-runway) * 1vh)" } },

    { "selector": "<stickyStage>", "properties": {
        "position": "sticky", "top": "0", "height": "100vh",
        "overflow": "clip", "container-type": "inline-size" } },

    // one entry PER item — the resets must be present in every one of them
    { "selector": "<repeatedItem1>", "properties": {
        "grid-area": "auto", "margin": "0", "transform": "none", "rotate": "none", "inset": "auto",
        "position": "absolute", "top": "50%", "left": "50%", "translate": "-50% -50%",
        "width": "var(--scg-card-width)", "max-height": "82cqh", "max-width": "90cqw",
        "transform-origin": "center center", "transform-style": "preserve-3d",
        "backface-visibility": "hidden", "will-change": "transform, filter, opacity", "z-index": "1" } },
    // … one identical block per repeatedItemN (selectors differ)

    // one entry PER media child — content-stack uses a height fraction, media-cover uses 100%
    { "selector": "<mediaChild1>", "properties": {
        "width": "100%", "height": "58%", "object-fit": "cover",
        "display": "block", "aspect-ratio": "auto !important" } }
    // … one per mediaChildN
  ],
  "interact": {
    "effects": {},
    "interactions": [
      { "key": "scrollSource", "trigger": "viewProgress",
        "effects": [ /* §6b — exactly one converge effect per repeatedItem */ ] }
    ]
  },
  "controls": [ /* §8 */ ]
}
```

### 6b. Interact effects (template)

Keyed to the element keys from §4. Values below are **illustrative** — recompute every number from §7 against the real section.

```ts
// N        = mapped repeated-item count (§4)
// slot     = cardWidth + gap, in cqw (§7) — the horizontal pitch of the final row
// maxRot   = start Y-rotation of the outermost cards, deg (control, §8)
// lift     = start translateY, px (§7)
// startS   = start scale, midS = mid scale (§7)
// blurPx   = start blur (control, §8)

// Signed, symmetric slot index in DOM order: i is 1-based
const norm = (i: number, N: number) => (i - (N + 1) / 2) / ((N - 1) / 2); // -1 … 0 … +1
const rowX = (i: number, N: number, slot: number) =>
  +((i - (N + 1) / 2) * slot).toFixed(2);            // final row offset, cqw

// Center-out stagger: middle card starts at 0% and ends earliest; outer cards start
// later and end later. Slices overlap heavily — several cards move at once.
const sliceOf = (i: number, N: number) => {
  const a = Math.abs(norm(i, N));                     // 0 (center) … 1 (outermost)
  return {
    start: +(15 * a).toFixed(1),                      // 0 … 15
    end:   +(58 + 27 * a).toFixed(1),                 // 58 … 85
  };
};

const convergeEffect = (i: number, N: number, o: {
  slot: number; maxRot: number; lift: number; startS: number; midS: number; blurPx: number;
}) => {
  const n = norm(i, N);
  const x = rowX(i, N, o.slot);
  const rot = +(-o.maxRot * n).toFixed(2);            // leftmost positive, rightmost negative
  const { start, end } = sliceOf(i, N);
  return {
    key: `repeatedItem${i}`,
    keyframeEffect: {
      name: `specimen-card-${i}-converge`,
      keyframes: [
        { opacity: 0, filter: `blur(${o.blurPx}px)`,
          transform: `translateX(0cqw) translateY(${o.lift}px) perspective(1200px) rotateY(${rot}deg) scale(${o.startS})` },
        { opacity: 1, filter: 'blur(0px)',            // legible from 45% onward — held, never linear-faded
          transform: `translateX(${(x / 2).toFixed(2)}cqw) translateY(0px) perspective(1200px) rotateY(${(rot * 0.3).toFixed(2)}deg) scale(${o.midS})`,
          offset: 0.45 },
        { opacity: 1, filter: 'blur(0px)',
          transform: `translateX(${x}cqw) translateY(0px) perspective(1200px) rotateY(0deg) scale(1)` },
      ],
    },
    rangeStart: { name: 'contain', offset: { unit: 'percentage', value: start } },
    rangeEnd:   { name: 'contain', offset: { unit: 'percentage', value: end } },
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both' as const,
  };
};

const interaction = {
  key: 'scrollSource',
  trigger: 'viewProgress',
  effects: Array.from({ length: N }, (_, k) => convergeEffect(k + 1, N, opts)),
};
```

Notes on recomputation: `slot` and therefore every `translateX` are expressed in **`cqw` against the pinned stage** (`container-type: inline-size`), never in `px` from the demo and never in `vw` — Wix sections frequently constrain content width, so `vw` over-translates and strands the outer cards outside the clip.

## 7. Adaptive Parameters

Recompute from the real section. Never copy the demo's `px` literals.

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped `repeatedItem`s | 3–7 (else reject) |
| `gap` (cqw) | `2` — inter-card gutter in the final row | 1–4 |
| `--scg-card-width` (cqw) | `min(24, (92 - (N - 1) * gap) / N)` — the whole row must fit the clip box at every width | 10–24 |
| `slot` (cqw) | `cardWidth + gap` — row pitch | derived |
| row half-span | `(N - 1) / 2 * slot + cardWidth / 2` must be `≤ 48` cqw; if not, shrink `cardWidth` first, then `gap` | ≤ 48 |
| card `max-height` | `82cqh` (stage-relative; content-stack cards are tall) | 70–85 cqh |
| media fraction (content-stack) | `58%` of card height; remainder is the card's own text | 55–65% |
| `--scg-runway` (vh) | `clamp(400, N * 120, 700)` — the demo used 600vh for N=5; the stagger tail needs room to read | 400–700 |
| `maxRot` (deg) | `15` at N=5; scale mildly with count: `clamp(8, 3 * N, 18)` | 8–18 |
| `lift` (px) | `60` — start `translateY`; scale with card height if cards are unusually short: `min(60, cardHeightPx * 0.15)` | 30–80 |
| `blurPx` | `12` | 4–20 |
| `startS` / `midS` | `0.7` / `0.88` | 0.6–0.8 / 0.85–0.95 |
| slice start % | `15 * |norm(i)|` | 0–20 |
| slice end % | `58 + 27 * |norm(i)|` | 50–90, and always `> start + 35` |

Guards before returning: if the computed row half-span exceeds the clip box, shrink `cardWidth` — do **not** shrink `slot` alone (that re-overlaps the cards). If any slice would be shorter than 35 percentage points, widen the end spread rather than the start.

## 8. Suggested Controls

### `card-size`
- **Label:** Image Size · **Group:** Layout · **Type:** range
- **Default:** derived (see §7) · **Constraints:** min 10, max 24, step 0.5, unit cqw
- **Description:** width of each card in the final row; smaller values spread the row wider apart.
- **Suggested variable:** `--scg-card-width`

### `tilt`
- **Label:** Tilt · **Group:** Motion · **Type:** range
- **Default:** 15 · **Constraints:** min 0, max 18, step 1, unit deg
- **Description:** how far the outer cards are Y-rotated at the start of the converge.
- **Suggested variable:** `--scg-tilt`

### `blur`
- **Label:** Entry Blur · **Group:** Motion · **Type:** range
- **Default:** 12 · **Constraints:** min 0, max 20, step 1, unit px
- **Description:** softness of the cards at the start of their slice; resolves to 0 by 45%.
- **Suggested variable:** `--scg-blur`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] **Exactly one** interaction, `trigger: viewProgress`, `key: scrollSource`. No hover/click/entrance trigger was invented.
- [ ] Effect count == `N`. **Every** mapped `repeatedItem` has exactly one converge effect; none silently dropped.
- [ ] `scrollSource` and `stickyStage` are **different elements**. If they resolved to the same element, the output is a reject, not a collapse.
- [ ] `stickyStage` carries all four of `position: sticky`, `height: 100vh`, `overflow: clip`, `container-type: inline-size` — and is the same element the cards are positioned against.
- [ ] `scrollSource` height ≥ `clamp(400, N*120, 700)vh`, or the stagger never completes.
- [ ] **Each** item's style entry literally contains `grid-area: auto`, `margin: 0`, `transform: none`, `rotate: none` — checked per entry, not assumed from prose.
- [ ] Centering is on the `translate` property; the animated keyframes touch only `transform` / `filter` / `opacity`. No keyframe re-states `-50% -50%`.
- [ ] Every `translateX` is in `cqw` (stage-relative). No `px` distances from the demo, no `vw`, no width arithmetic from assumed card sizes.
- [ ] First keyframe of **every** card has `translateX(0…)` — all cards genuinely overlap at center at progress 0.
- [ ] End offsets are symmetric about 0 in DOM order (leftmost most-negative → rightmost most-positive), and the outermost card's row slot + half its width fits inside the clip box.
- [ ] Rotation signs mirror the row: leftmost positive, rightmost negative, exact center `0deg`.
- [ ] The 0.45 keyframe has `opacity: 1` and `blur(0px)` — no card is left semi-transparent or soft through the back half of its slice.
- [ ] Every effect has `fill: 'both'` and easing `cubic-bezier(0.22, 1, 0.36, 1)`.
- [ ] Ranges are `contain` on both ends. No `exit` range anywhere.
- [ ] Slices are center-out: the center card's start is the smallest and its end the earliest; every slice spans ≥ 35 percentage points; adjacent slices overlap.
- [ ] `perspective(1200px)` appears only inside per-card `transform` values — no `perspective`, `filter`, `will-change`, or `opacity < 1` was applied to `stickyStage` or any other ancestor of an animated target.
- [ ] No emitted selector is a bare `.g-image`, `.ph-box`, `img`, or `.g-item`; every media/layout rule is scoped to a mapped role, and each animated selector matches exactly one intended element.
- [ ] No effect targets a key absent from `elements`; no `staticSibling` (heading, paragraph, button, `.backgroundLayer`) is styled or animated.
- [ ] No color, font, typography, or background property appears anywhere in `styles`.