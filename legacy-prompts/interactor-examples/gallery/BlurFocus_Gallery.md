# Blur Focus Gallery

Hovering one card in a gallery grid scales its media inside a clipped frame, dims it slightly, lifts it above its neighbours, and slides its caption up into view.

## 1. Identity

- **id:** `blur-focus-gallery`
- **mechanism:** `hover-card-focus` — a per-item `hover` trigger drives three CSS transitions on that item's own subtree: media `scale(1 → S)` inside an `overflow: clip` frame, a dim/scrim pass on the media, and a caption reveal (`opacity 0 → 1`, `translateY(offset → 0)`), plus an instant `z-index` raise on the item root so the growing card overlaps its siblings.
- **fits sections with:** one uniform group of **3–12 repeated media items** (gallery items, image components, or repeater cards) laid out as a grid/row, each containing an image and (optionally) a title/description. The section's own heading, paragraph and buttons stay completely static.
- **rejects:** fewer than 3 repeated items; repeated candidates that are raw `img` descendants with no per-item component root (nothing to clip or raise); or items whose media cannot be resolved to a node *inside* the item root (nothing to scale independently of the frame).
- No adaptation crux: the mechanism is entirely local to each item, needs no runway, no pin, and no re-flow — it is buildable in any single Wix section that has a repeated group.

## 2. Motion Spec (invariant intent)

This is the fidelity target. Only §7 numbers adapt.

- **Trigger:** one `hover` interaction **per repeated item**, keyed to that item's root. There is no scroll trigger, no `viewProgress`, no `viewEnter` — do not invent one. Hover-out plays the reverse (transitions are symmetric by construction).
- **Rest state (all items, always):**
  - item root: in its normal grid placement, `overflow: clip`, `position: relative`, `z-index: 1`.
  - media inside the item: fills the item box exactly (`100%`/`100%`, `object-fit: cover`), untransformed.
  - caption (title/description block, when present): `opacity: 0`, `transform: translateY(<offset>)`, anchored to the bottom of the item, above the media in stacking order.
- **Hovered state (that item only):**
  1. **media scales up** to `S` (≈`1.05`) over `D` ms, `easing: ease`, `fill: both`. Because the item root clips, the media grows *into* the frame edges rather than overflowing — this is the whole read of the effect. `transform-origin: center center`.
  2. **media dims** slightly (a scrim so the caption is legible over it) over the same `D`/easing.
  3. **caption rises and fades in**: `opacity → 1`, `transform → translateY(0)`, same `D`/easing.
  4. **item root raises**: `z-index → 999` with `duration: 0` (instant, no interpolation), so the scaled card sits above every sibling from the first frame.
- **Ordering / stagger:** none. Each item is independent; there is no sequence and no cross-item stagger. Hovering item *k* must not move, dim, or blur item *j ≠ k*.
- **Non-hovered siblings and section text:** untouched.
- **Reduced motion (optional):** under a `reduced-motion` condition, keep the caption reveal (opacity only) and the `z-index` raise, and drop the media scale.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never by class hash or text (Wix classes are opaque `comp-*`; text is redacted to `█`).

| Role | Signature | Owns |
| --- | --- | --- |
| `sectionRoot` | The outermost `<section>` / outermost container element. Exactly one. | Nothing animated. Only a `overflow: clip`-safety note (§5) so a scaled card can't create horizontal scroll. |
| `itemFrame{n}` | Each member of the largest uniform group of ≥3 sibling media components inside the section. | The hover trigger source, the clip frame (`overflow: clip`), `position: relative`, and the instant `z-index` raise. **Never scaled itself.** |
| `itemMedia{n}` | The image-bearing descendant *inside* `itemFrame{n}` (its media wrapper, or the `img`/`.ph-box` when no wrapper exists). Exactly one per frame. | The animated `transform: scale()` and the dim/scrim pass. |
| `itemMediaChild{n}` | *Optional.* A direct wrapper or `img` **below** `itemMedia{n}` that carries the real dimensions. | Fill-to-parent sizing only (`100%`/`100%`/`object-fit: cover`). Never animated. |
| `itemCaption{n}` | *Optional.* The text-bearing descendant inside `itemFrame{n}` (title and/or description block; if title and description are separate siblings, their common parent, else the title node). | The reveal (`opacity`, `translateY`). |
| `staticSibling` | Every non-repeated element in the section: heading, paragraph, buttons, decorative containers, `.backgroundLayer`. | Nothing — explicitly left untouched. |

**Ownership is strict:** clip + z-index → `itemFrame`; scale + dim → `itemMedia`; reveal → `itemCaption`. Never put the scale on the frame (it would clip nothing and would move the caption with it), and never put the clip on the media.

## 4. Mapping Procedure (Wix sanitized HTML)

Run in order. Match on **element type + cardinality + DOM order + containment only** — never on text (it is `█`) and never on the `comp-…` hash.

1. **`sectionRoot`** = the outermost `<section class="… comp-XXXX">` (with or without `container`). Selector = `.comp-XXXX`. Do not require a `.content`/`__content`/`.backgroundLayer` child to exist — section formats vary.
2. **Find the item host** = the tightest single element that contains the whole repeated group. Try, in order: the section's `.content comp-…__content` child, else a lone nested `.container comp-…`, else a gallery/repeater wrapper, else `sectionRoot` itself. This role is only used as a search scope and as a selector prefix for shared-class items; it is never animated.
3. **Resolve the repeated group** — inside the item host, take the **largest set of ≥3 siblings sharing the same component type**, in priority order:
   1. `<div class="g-item">` repeated siblings (gallery/repeater items),
   2. `<div class="root image comp-…">` siblings,
   3. `<div class="root video comp-…">` siblings,
   4. repeated `.container comp-…` / card siblings with identical inner structure.
   In DOM order these become `itemFrame1..N`.
   **Selectors:** if the item has its own unique `comp-…` class, use `.comp-…` (one selector per item). If the items **share** a class and have no per-item hash (`g-item`, most repeater children), select positionally under the host: `.<host-comp> .g-item:nth-child(k)` — one selector per `k`, never a bare `.g-item`.
4. **`itemMedia{n}`** — inside each `itemFrame{n}`, resolve exactly one media node, in order: a media/image wrapper child (`.g-image`, `root image comp-…`, `.ph-box`) → else the frame's first element child that contains an `img` → else the `img` itself. Selector = the **item's own selector + a descendant step** (e.g. `<itemFrame{n}-selector> .g-image`), so it matches exactly one node. **Never emit a bare `.g-image` / `.ph-box` / `img` rule** — that would restyle unmapped gallery internals and typically leaves only the first image visible.
   - If the media node is *identical to* the frame (a bare image component with no inner wrapper and no caption), then and only then collapse: the frame is both clip and scale owner — put `overflow: clip` on it and scale it, accepting that it grows past its grid cell; prefer promoting an available wrapper first.
5. **`itemMediaChild{n}`** — if `itemMedia{n}` has a direct anonymous wrapper, `.ph-box`, or `img` that carries the dimensions, map it (`<itemMedia{n}-selector> > *`, plus a nested `img` rule scoped the same way) and fill it (§5b). Do not assume `.ph-box`; real sections often use an anonymous wrapper with a raw `img`.
6. **`itemCaption{n}`** — inside each `itemFrame{n}`, if a text-bearing descendant exists (`.g-title`, `.g-desc`, `rich-text wrichtext comp-…`), map the **common parent** of title+description when both exist and are siblings, else the single text node. Selector = item selector + descendant step. If **no** item-level text exists, drop the caption role entirely for every item (all-or-nothing — never caption some items and not others) and keep effects 1, 2 and 4.
7. **`staticSibling`** — everything else in the section (`rich-text`, `root button`, `.presetWrapper`, `.backgroundLayer`, decorative containers). Never targeted, never styled.
8. **Absent-role rule:** `itemCaption` and `itemMediaChild` are optional → omit their roles and their effects/styles. `itemMedia` cannot be synthesized (the DOM cannot be restructured) → if step 4 yields nothing inside an item, **reject**.
9. **Reject** if step 3 yields fewer than 3 items, or if the items are raw `img` descendants with no component root to clip and raise.

**Into `elements`:** one entry per mapped role, `key → { selector }`, with trailing indices — `itemFrame1..N`, `itemMedia1..N`, and (when present) `itemMediaChild1..N`, `itemCaption1..N`. Every key referenced by an interaction or effect must exist here.

## 5. Structure & CSS Overrides

Structural / motion styling only. **No color, font, typography, or background declarations** — the Wix theme owns those. The dim in §2 is done with `filter: brightness(...)` on the mapped media (a compositing pass on that one node), never with a background or color value.

Items are **not re-flowed** by this mechanism: they stay in their grid cells. Therefore do **not** reset `grid-area` / `margin` on the frames — that would destroy the section's intended layout. The one placement hazard is a per-item `transform: rotate(θ)`, handled below.

### 5a. Neutralize (on the mapped Wix elements)

- **`itemFrame{n}`** — Wix items are often `overflow: visible` and have no stacking context. Add `position: relative; overflow: clip; z-index: 1` so the scaled media is clipped and the hover raise has something to raise. Use `clip`, **not** `hidden`/`auto`. Leave `grid-*` and `margin` alone.
- **`itemMedia{n}`** — must be a full-bleed layer inside the frame and must own `transform` alone:
  - if the media is not already filling the frame, set `position: absolute; inset: 0; width: 100%; height: 100%`;
  - `transform: none` **only when** the node carries no meaningful rotation. **If the mapped media (or the frame) carries `transform: rotate(θ)`, keep it**: leave the base `transform` as-is and write the keyframes as `rotate(θ) scale(1) → rotate(θ) scale(S)` so the decorative angle survives (§6b).
  - neutralize broken inline ratios: `aspect-ratio: auto !important` where a wrapper ships `aspect-ratio: 0`.
- **`itemMediaChild{n}`** — dimensions frequently live one level below the media role; force it and any nested `img`/`.ph-box` to `width: 100%; height: 100%; object-fit: cover; display: block`, scoped per item (§4 step 5). Never a global `img` rule.
- **`itemCaption{n}`** — Wix text sits in flow inside the item. Pull it to the bottom as an overlay so the reveal reads and the media scale doesn't push it: `position: absolute; left: 0; right: 0; bottom: <inset>; z-index: 2; pointer-events: none`, plus the initial hidden state below. Reset any `margin` that would fight the absolute inset (`margin: 0`).
- **`sectionRoot`** — a scaled card near the section edge can create horizontal overflow; ensure the section (or the item host) does not gain a scrollbar. Do **not** set a runway height and do **not** make it sticky — there is no scroll mechanism here.

### 5b. Apply

```css
/* itemFrame{n} — clip frame + stacking base + hover source */
{ position: relative; overflow: clip; z-index: 1; }

/* itemMedia{n} — full-bleed animated layer (one rule per mapped item) */
{
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  object-fit: cover;
  transform-origin: center center;
  will-change: transform, filter;
  aspect-ratio: auto;              /* kill inherited aspect-ratio: 0 */
}

/* itemMediaChild{n} (+ nested img/.ph-box), scoped per item */
{ width: 100%; height: 100%; object-fit: cover; display: block; }

/* itemCaption{n} — bottom overlay, hidden at rest */
{
  position: absolute;
  left: var(--bfg-caption-inset); right: var(--bfg-caption-inset);
  bottom: var(--bfg-caption-inset);
  margin: 0;
  z-index: 2;
  pointer-events: none;
  opacity: 0;
  transform: translateY(var(--bfg-caption-offset));
  will-change: opacity, transform;
}
```

- `will-change` is on the **item's own** media/caption, never on an ancestor of anything scroll-driven (there is nothing scroll-driven here, so it is safe).
- Keep the caption's rest `transform` a pure `translateY` so the hover transition targets the same property cleanly.
- Do not set `overflow: clip` on any shared/global media class; emit it only on the mapped `itemFrame{n}` selectors.

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

Replace `<…>` with real selectors from §4; expand `{n}` to the real count `N`.

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "itemFrame1":   { "selector": "<item 1 selector>" },
    "itemMedia1":   { "selector": "<item 1 selector> <media step>" },
    "itemCaption1": { "selector": "<item 1 selector> <caption step>" },
    "itemFrame2":   { "selector": "<item 2 selector>" },
    "itemMedia2":   { "selector": "<item 2 selector> <media step>" },
    "itemCaption2": { "selector": "<item 2 selector> <caption step>" },
    "itemFrame3":   { "selector": "<item 3 selector>" },
    "itemMedia3":   { "selector": "<item 3 selector> <media step>" },
    "itemCaption3": { "selector": "<item 3 selector> <caption step>" }
    // … itemFrameN / itemMediaN / itemCaptionN
    // optional: itemMediaChild{n} when dimensions live below the media role
  },
  "styles": [
    { "selector": "<itemFrame{n}>", "properties": {
        "position": "relative", "overflow": "clip", "z-index": "1" } },
    { "selector": "<itemMedia{n}>", "properties": {
        "position": "absolute", "inset": "0", "width": "100%", "height": "100%",
        "object-fit": "cover", "aspect-ratio": "auto",
        "transform-origin": "center center", "will-change": "transform, filter" } },
    { "selector": "<itemMediaChild{n}>", "properties": {
        "width": "100%", "height": "100%", "object-fit": "cover", "display": "block" } },
    { "selector": "<itemCaption{n}>", "properties": {
        "position": "absolute", "left": "12px", "right": "12px", "bottom": "12px",
        "margin": "0", "z-index": "2", "pointer-events": "none",
        "opacity": "0", "transform": "translateY(10px)",
        "will-change": "opacity, transform" } }
    // one rule per mapped item per role (selectors differ) — never a shared .g-image/.ph-box/img rule
  ],
  "interact": {
    "effects": {},
    "interactions": [
      { "key": "itemFrame1", "trigger": "hover", "effects": [ /* §6b: 4 effects */ ] },
      { "key": "itemFrame2", "trigger": "hover", "effects": [ /* … */ ] },
      { "key": "itemFrame3", "trigger": "hover", "effects": [ /* … */ ] }
      // … one hover interaction per mapped item, N total
    ]
  },
  "controls": [ /* §8: image-scale, caption-offset, pace */ ]
}
```

### 6b. Interact effects (template)

Values are illustrative — recompute per §7. Keyed to the element keys from §4; the trigger source is always the item's own frame key.

```ts
// N        = number of mapped repeated items (§4)
// S        = hover media scale        (control, §8)
// D        = transition duration ms   (control, §8)
// OFFSET   = caption rise distance px (control, §8)
// DIM      = media brightness on hover (§7; 1 = no dim)
// baseRot  = 'rotate(θ) ' when the mapped media/frame keeps a decorative angle, else ''
const EASING = 'ease';

const hoverItem = (i: number, hasCaption: boolean) => {
  const effects: any[] = [
    // 1. media scales inside the clipped frame (preserve any decorative rotation)
    { key: `itemMedia${i}`, transition: {
        duration: D, easing: EASING,
        styleProperties: [{ name: 'transform', value: `${baseRot}scale(${S})` }] } },

    // 2. scrim so the caption reads over the media — compositing pass, not a color/background
    { key: `itemMedia${i}`, transition: {
        duration: D, easing: EASING,
        styleProperties: [{ name: 'filter', value: `brightness(${DIM})` }] } },

    // 4. instant stacking raise so the grown card sits above its neighbours
    { key: `itemFrame${i}`, transition: {
        duration: 0,
        styleProperties: [{ name: 'zIndex', value: '999' }] } },
  ];

  // 3. caption reveal — omitted entirely when no item-level text exists
  if (hasCaption) effects.splice(2, 0, {
    key: `itemCaption${i}`, transition: {
      duration: D, easing: EASING,
      styleProperties: [
        { name: 'opacity', value: '1' },
        { name: 'transform', value: 'translateY(0)' },
      ] } });

  return { key: `itemFrame${i}`, trigger: 'hover', effects };
};

const interactions = Array.from({ length: N }, (_, k) => hoverItem(k + 1, HAS_CAPTION));
```

Optional reduced-motion variant: gate a second, `reduced-motion`-conditioned interaction per item that keeps only the caption `opacity → 1` and the `zIndex` raise (no scale, no filter).

## 7. Adaptive Parameters

Recompute from the real section; never copy demo literals.

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped `itemFrame`s | 3–12 |
| `S` (hover media scale) | `1 + min(0.08, 24 / min(itemWidthPx, itemHeightPx))` — smaller cards need a proportionally larger factor to read, but the growth must stay a subtle push into the frame edges | 1.02–1.12 |
| `DIM` (media brightness on hover) | `HAS_CAPTION ? 0.72 : 1` — only dim when a caption must be legible over the media | 0.6–1.0 |
| `OFFSET` (caption rise, px) | `clamp(6, round(itemHeightPx * 0.05), 16)` | 6–16 |
| caption inset | `clamp(8, round(min(itemWidthPx, itemHeightPx) * 0.06), 20)` px | 8–20 |
| `D` (ms) | `250–350`; scale up slightly for large cards: `round(clamp(220, itemHeightPx * 0.9, 400))` | 180–420 |
| hover z-index | fixed `999`, `duration: 0` | — |

There is **no runway, no pin, and no scroll range** to compute. If the section's items are already `overflow: clip` with a full-bleed image and no text, set `DIM = 1` and drop the caption role rather than inventing a text layer.

## 8. Suggested Controls

### `image-scale`
- **Label:** Image Size · **Group:** Motion · **Type:** range
- **Default:** derived (see §7, ≈1.05) · **Constraints:** min 1.02, max 1.12, step 0.01
- **Description:** how far the hovered card's image grows inside its frame.
- **Suggested variable:** `--bfg-hover-scale`

### `caption-offset`
- **Label:** Caption Rise · **Group:** Motion · **Type:** range
- **Default:** derived (see §7, ≈10) · **Constraints:** min 6, max 16, step 1, unit px
- **Description:** how far the caption slides up as it fades in.
- **Suggested variable:** `--bfg-caption-offset`

### `pace`
- **Label:** Pace · **Group:** Motion · **Type:** range
- **Default:** derived (see §7, ≈300) · **Constraints:** min 180, max 420, step 10, unit ms
- **Description:** duration of the hover transition (scale, dim, caption).
- **Suggested variable:** `--bfg-duration`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] Exactly `N` hover interactions, one per mapped item, each keyed to that item's **own** `itemFrame{n}` — no item silently dropped, no item wired to a neighbour's key.
- [ ] Each interaction's effects target only keys from the **same** index (`itemMedia{n}`, `itemCaption{n}`, `itemFrame{n}`). Hovering item *k* changes nothing on item *j ≠ k*.
- [ ] The scale is on `itemMedia{n}`, and `overflow: clip` is on `itemFrame{n}` — never the reverse, and never both on one element unless §4 step 4's collapse rule fired.
- [ ] `z-index` raise effect has `duration: 0` and the frame has a rest `z-index` to raise from.
- [ ] Every media/caption selector is **item-scoped** and matches exactly one node; count the matches. No bare `.g-image`, `.ph-box`, or `img` rule appears in `styles`.
- [ ] No caption effect exists unless a real item-level text node was mapped — and if one item has a caption, **all** do.
- [ ] Captions start at `opacity: 0` + `translateY(OFFSET)` in `styles`, so the hover transition has a from-state.
- [ ] Where the mapped media keeps a decorative `rotate(θ)`, the keyframe/transition value includes that rotation (the hover value is not a bare `scale()` that erases it).
- [ ] Item `grid-*` and `margin` are **not** reset (items stay in place); only the rotation-preservation and `aspect-ratio: auto` neutralizations are emitted.
- [ ] No `viewProgress` interaction, sticky stage, runway height, or scroll range anywhere — the demo's only trigger is `hover`.
- [ ] No color, background, font, or typography property in any style rule or effect; the dim uses `filter: brightness(...)` on a mapped media node only.
- [ ] No effect targets a key absent from `elements`; no `staticSibling` (heading, paragraph, button, `.backgroundLayer`) is styled or animated.