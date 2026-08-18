# Small Carousel

Repeated media cards are arranged in a 3D depth fan (rotateY + translateZ offsets); hovering any card scales its image and fades in its overlaid text.

## 1. Identity

- **id:** `small-carousel-3d`
- **mechanism:** `hover-3d-fan` — a perspective container holds repeated cards absolutely stacked at center; each card carries a static per-position 3D transform (`translateX` + `translateZ` + `rotateY` + `scale`) so the group reads as a curved depth fan. On **hover** of any card, its image scales up and its overlaid text fades from 0→1. No scroll, no pin.
- **fits sections with:** one uniform group of **3–8 repeated cards**, each an image-dominant component that also contains a short text block (title/keywords) as a child. Section-level headings/buttons are allowed and stay static.
- **rejects:** fewer than 3 repeated cards, or a repeated group whose items have no isolable media child to scale.
- **⚠ adaptation crux:** the demo's fan depends on a purpose-built `perspective` container + `preserve-3d` carousel + six hand-placed position classes (`.active`/`.left-1`/`.right-2`/…). A Wix section provides none of that — cards are flat, grid/margin-placed siblings. **Substitution:** promote the cards' shared wrapper to the 3D **stage** (`perspective` + `transform-style: preserve-3d` + positioning context), neutralize each card's Wix grid/margin/rotate placement, absolutely re-stack all cards at stage center, and assign each card a **computed** symmetric depth transform (from §7) instead of the demo's fixed position classes. The hover interaction transfers unchanged.

## 2. Motion Spec (invariant intent)

This is the fidelity target. Only §7 numbers adapt.

- **Trigger:** **`hover`**, one interaction *per card* (keyed to that card). There is **no** `viewProgress`, sticky stage, or scroll runway — do not invent one.
- **Resting state (static layout, not an effect):** all cards overlap-stacked at the center of a perspective stage, each pushed into depth by its own `translateX/translateZ/rotateY/scale`, forming a symmetric fan (center card upright at scale 1 and highest `z-index`; outer cards rotated toward center, pushed back, and scaled down). Each card's text is at `opacity: 0`.
- **On hover (per card), two concurrent effects:**
  1. **Image scale** — the card's media child animates `transform: scale(1) → scale(1.08)`, `duration ≈ 600ms`, `easing: ease-out`, `fill: both`, `triggerType: alternate` (reverses on hover-out).
  2. **Text fade** — the card's text child animates `opacity: 0 → 1`, `duration ≈ 350ms`, `easing: ease-out`, `fill: both`, `triggerType: alternate`.
- **Ordering / composition:** the card's static 3D transform stays untouched by hover (the scale animates the *image child*, not the card). Centering lives on the CSS `translate` property; the depth position on `transform`; the hover scale on the *image's* `transform` — three separate owners that never clobber each other.

## 3. Role Model

Roles are defined by **element signature** — type, cardinality, containment — never class names or text (Wix classes are opaque `comp-*`; text is redacted `█`).

| Role | Signature | Owns |
| --- | --- | --- |
| `carouselStage` | The single wrapper whose direct children are the repeated card group (fall back to the section's content wrapper, or the section itself). Exactly one. | `perspective`, `transform-style: preserve-3d`, and the positioning context for the stacked cards. |
| `repeatedItem{n}` | The largest uniform group of ≥3 sibling components sharing one type, each containing a media child and (ideally) a text child. In DOM order. | Its centering (`translate`), its static per-position 3D `transform`, and being the **hover** trigger target. |
| `itemMedia{n}` | The image/media element inside `repeatedItem{n}` (addressed as a relative sub-selector of the card). | The hover **scale** animation. |
| `itemText{n}` | The text block inside `repeatedItem{n}` (relative sub-selector). *Optional.* | The hover **opacity** fade. If absent → drop the fade effect for that card; keep the scale. |
| `staticSibling` | Any non-repeated sibling (section heading, paragraph, button, decoration). | Nothing — left untouched. |

**Ownership is strict:** perspective → `carouselStage`; depth position → `repeatedItem`; hover scale → `itemMedia`; hover fade → `itemText`. Never put the scale on the card root (it would fight the depth transform).

## 4. Mapping Procedure (Wix sanitized HTML)

Run in order against the sanitized markup. Match on **type + count + order + containment only** — never text, never the `comp-…` hash.

1. **Find the repeated group:** among the descendants of the section, take the **largest set of ≥3 sibling components sharing the same type**, priority order: `g-item` → `root image comp-…` → generic repeated `comp-…` with identical inner structure. These become `repeatedItem1..N` in DOM order.
2. **`carouselStage`** = the tightest single element whose direct children are exactly (or primarily) that repeated group. If no such wrapper exists, use the section's `.content comp-…__content`; if the section is bare, use the `<section class="comp-…">` itself. Ignore `.backgroundLayer`.
3. **`itemMedia{n}`** = inside each card, the media element: the direct anonymous media wrapper, `.ph-box`, `root image comp-…`, or raw `img`. Address it as a **relative sub-selector of the card** (e.g. the card key + `.ph-box`/`img`), never as a broad global `img`/`.g-image` rule.
4. **`itemText{n}`** = inside each card, the `rich-text wrichtext comp-…` (or caption) child, as a relative sub-selector. If a card has no text child → mark `itemText` absent for it and drop its fade effect.
5. **`staticSibling`** = every non-repeated sibling (`rich-text`, `root button`, lone decorative `container`). Do not target.
6. **Reject** if step 1 yields fewer than 3 items, or if cards have no isolable media child to scale.

**Into `elements`:** emit one entry per card — `repeatedItem{n} → { selector: ".comp-…" }` (or `.<stage-comp> .g-item:nth-child(k)` for class-sharing items). `itemMedia`/`itemText` are **not** separate element keys — they are relative `selector`s inside each card's hover effect. Also emit `carouselStage → { selector }`.

## 5. Structure & CSS Overrides

Structural only — never color, font, or background. The demo assumes a blank perspective canvas; the Wix section does not.

### 5a. Neutralize (emit these in the actual style entries — prose alone gets dropped)

- **`carouselStage`** — Wix content wrappers are usually `display: grid` with fixed `grid-template-rows`. The cards must leave that grid (done below), so the grid may remain for `staticSibling`s.
- **`repeatedItem{n}`** — Wix places each card via `grid-row`/`grid-column`, `margin-*: %`, and sometimes `transform: rotate(…)`. **Every card's style entry must carry** `grid-area: auto; margin: 0; transform: none;` before the depth transform is applied — otherwise cards stay decoratively offset/rotated and never fan.
- **Section root** — if used as stage, its `height: auto` is fine (no runway needed).

### 5b. Apply

```css
/* carouselStage — 3D context + positioning context */
{
  position: relative;
  perspective: var(--carousel-perspective, 1500px);   /* §7/§8 */
  transform-style: preserve-3d;
  min-height: var(--carousel-stage-h, 70vh);           /* room for the fan */
  overflow: clip;                                      /* clip, not hidden */
}

/* repeatedItem{n} — reset placement, center, then take a static depth transform */
{
  grid-area: auto; margin: 0;                          /* 5a neutralize */
  position: absolute;
  top: 50%; left: 50%;
  translate: -50% -50%;                                /* centering — SEPARATE from transform */
  width: var(--card-w, min(300px, 70vw));
  height: var(--card-h, min(500px, 66vh));
  transform-origin: center center;
  transform: <per-position 3D transform from §7>;      /* e.g. translateX(60%) translateZ(-200px) rotateY(35deg) scale(0.9) */
  z-index: <higher toward center>;
  will-change: transform;
}

/* itemMedia{n} — fill the card so scale reads (per-card sub-selector) */
{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; display: block; }
/* neutralize broken inline ratios if present: */
{ aspect-ratio: auto !important; }

/* itemText{n} — overlaid, starts hidden (per-card sub-selector) */
{ position: relative; z-index: 2; opacity: 0; }
```

- Keep `translate` (centering) and `transform` (depth) as separate CSS properties so neither clobbers the other; the hover scale lives on `itemMedia`'s own `transform`.
- If media has a direct anonymous wrapper / `img` / `.ph-box` below it, fill that child too (`width:100%; height:100%; object-fit:cover; display:block`) so the scale covers the whole card face.

## 6. Output shape

### 6a. Abstracted skeleton (role keys, placeholder selectors)

Replace `<…>` with real `.comp-…` selectors from §4; expand `repeatedItem{n}` to the real count.

```jsonc
{
  "$schema": "interact-experience/1.0",
  "id": "…", "name": "…",
  "elements": {
    "carouselStage": { "selector": "<.comp-…__content or .comp-…>" },
    "repeatedItem1": { "selector": "<.comp-…>" },
    "repeatedItem2": { "selector": "<.comp-…>" },
    "repeatedItem3": { "selector": "<.comp-…>" }
    // … repeatedItemN
  },
  "styles": [
    { "selector": "<carouselStage>", "properties": {
        "position": "relative", "perspective": "1500px", "transform-style": "preserve-3d",
        "min-height": "70vh", "overflow": "clip" } },
    { "selector": "<repeatedItem1>", "properties": {
        "grid-area": "auto", "margin": "0", "position": "absolute",
        "top": "50%", "left": "50%", "translate": "-50% -50%",
        "width": "min(300px,70vw)", "height": "min(500px,66vh)",
        "transform-origin": "center center",
        "transform": "translateX(-110%) translateZ(-400px) rotateY(45deg) scale(0.8)",
        "z-index": "2", "will-change": "transform" } }
    // one style rule per card: identical resets, DIFFERENT transform + z-index (from §7)
    // itemMedia/itemText initial styles emitted per-card via their relative selectors
  ],
  "interact": {
    "effects": {},
    "interactions": [ /* §6b: one hover interaction per card */ ]
  },
  "controls": [ /* §8: image size, perspective depth, spread */ ]
}
```

### 6b. Interact effects (template)

Keyed to each card; `selector` addresses the media/text child relative to that card.

```ts
// N = number of mapped cards. imgScale, mediaSel, textSel from §4/§8.
const cardHover = (key: string, mediaSel: string, textSel: string | null, imgScale: number) => ({
  trigger: 'hover',
  key,
  effects: [
    {
      key, selector: mediaSel,
      keyframeEffect: { name: `${key}-img`, keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${imgScale})` }] },
      duration: 600, easing: 'ease-out', fill: 'both', triggerType: 'alternate',
    },
    ...(textSel ? [{
      key, selector: textSel,
      keyframeEffect: { name: `${key}-text`, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
      duration: 350, easing: 'ease-out', fill: 'both', triggerType: 'alternate',
    }] : []),
  ],
});

const interactions = cardKeys.map((k, i) =>
  cardHover(k, MEDIA_SELECTOR, TEXT_SELECTOR_OR_NULL, imgScale));
```

The static 3D fan is pure CSS (§5b `styles`); the hover interaction never touches the card's own `transform`.

## 7. Adaptive Parameters

Recompute from the real section; never copy demo literals. The **per-position transform** is a symmetric fan around the center index.

| Param | Formula / rule | Bounds |
| --- | --- | --- |
| `N` | count of mapped cards | 3–8 |
| center index `c` | `(N-1)/2` (may be fractional) | — |
| depth `d` of card `i` | `abs(i - c)` (0 at center, grows outward) | — |
| `rotateY(i)` | `sign(c - i) * min(55, 30 + 10*(d-0.5))` deg (rotate toward center; 0 at center) | ±0–55° |
| `translateX(i)` | `sign(i - c) * (55% + 50%*(d-1))` (own-width %); 0 at center | ≤ ±160% |
| `translateZ(i)` | `-200px * d` | 0 to −700px |
| `scale(i)` | `max(0.65, 1 - 0.1*d)` | 0.65–1 |
| `z-index(i)` | `round(100 - d*10)` (center highest) | — |
| `--carousel-perspective` | `~1200–1800px`; larger = flatter fan | 900–2200px |
| card width / height | `min(300px, ~70vw)` / `min(500px, ~66vh)`; cap so outer cards stay inside the clipped stage | — |
| `--carousel-stage-h` | `≥ card-h + 8vh` headroom | 60–80vh |
| `imgScale` | hover image scale | 1.03–1.15 |

For even `N`, the two center-most cards share the smallest `d` (fan is still symmetric). If outer cards land mostly outside the clipped stage, reduce `translateX` growth or card width before returning.

## 8. Suggested Controls

### `image-scale`
- **Label:** Image Zoom · **Group:** Motion · **Type:** range
- **Default:** 1.08 · **Constraints:** min 1.03, max 1.15, step 0.01
- **Description:** how much a card's image grows on hover.
- **Suggested variable:** `--carousel-img-scale`

### `perspective`
- **Label:** Depth · **Group:** Layout · **Type:** range
- **Default:** 1500 · **Constraints:** min 900, max 2200, step 50, unit px
- **Description:** perspective distance — lower is a deeper, more dramatic fan.
- **Suggested variable:** `--carousel-perspective`

### `spread`
- **Label:** Fan Spread · **Group:** Layout · **Type:** range
- **Default:** derived (§7) · **Constraints:** min 40, max 80, step 5, unit % (base `translateX` at `d=1`)
- **Description:** how far outer cards splay from center.
- **Suggested variable:** `--carousel-spread`

## 9. Fidelity Checklist (self-check before returning — beyond schema validity)

- [ ] Trigger is **`hover`**, one interaction **per card** (count == N). No `viewProgress`/sticky/runway invented.
- [ ] Each card's hover has a scale effect on its **media child** (relative `selector`) and, when text exists, a fade effect on its **text child** — never the scale on the card root.
- [ ] `carouselStage` has `perspective` **and** `transform-style: preserve-3d` **and** `position: relative` (positioning context) **and** `overflow: clip`.
- [ ] Every card's style entry resets `grid-area`/`margin`/`transform` before its static depth `transform`; centering is on `translate`, depth on `transform` (they don't collide).
- [ ] Per-position transforms are **symmetric** around center, in DOM order; center card upright (`scale 1`, `rotateY 0`) with highest `z-index`.
- [ ] Media selectors are per-card relative sub-selectors (no broad `img`/`.g-image`/`.ph-box` global rule); each matches exactly one media node per card, so all N images animate — not just the first.
- [ ] No `staticSibling` is animated; no effect targets a key absent from `elements`.
- [ ] No color/font/background overrides emitted.