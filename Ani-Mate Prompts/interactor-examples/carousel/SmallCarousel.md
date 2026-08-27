# Task

Apply the **Small Carousel** to this section: a fan of cards laid out in depth — one facing front, the rest angled away to the left and right — where hovering a card pushes in on its image and fades its caption up.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The fan is static; only hover animates.** Every card's depth pose
   (`translateX`/`translateZ`/`rotateY`/`scale`) is a resting CSS rule that
   never moves — measured across a 9-stop scroll sweep, all six cards were
   static, 0px travel. Nothing here is scroll-driven, so do not look for a
   timeline: the only motion is two per-card hover effects, on the *image* and
   on the *caption*, and neither touches the card's own transform.

2. **The pose formula, not six magic rules.** The demo hand-writes six
   positional classes; they are one function of a signed slot `s`
   (…−2, −1, 0, +1, +2, +3):
   `translateX(s·|s|·5% + s·55%)`-ish is fitted noise — the honest reading is
   `depth = −200px·|s|`, `angle = −sign(s)·(35 + 10·(|s|−1))deg` capped at 55,
   `scale = 1 − 0.1·|s|`, `x` from the table below, `z-index = 10 − 3·|s|`.
   Re-derive for the section's real item count instead of copying six rules;
   with N items the slots are the integers centred on 0, and the fan is only
   symmetric when N is odd (the demo's N = 6 is deliberately lopsided: three
   right, two left).

3. **DOM order ≠ slot order.** Cards 0–3 hold slots 0, +1, +2, +3 and cards 4–5
   hold −2, −1. Slot assignment is a property of the *pose class*, not the
   markup, so on a Wix section the slots can be assigned in plain DOM order —
   the visual result is a rotation of the fan, not a different animation.

4. **Two effects, two properties, no clobber.** The image animates `transform:
   scale(1 → 1.08)` and the caption animates `opacity: 0 → 1`. They are on
   *different descendants*, which is why the image's scale can't fight the
   card's own static `transform` — the card transform stays untouched and the
   fan geometry survives the hover.

5. **`triggerType: 'alternate'` is what makes hover-out work.** The effects have
   no reverse keyframes; `alternate` plays the same 2-keyframe effect backwards
   on pointer-leave. With `fill: 'both'` and no `alternate` the caption would
   latch visible after the first hover and never fade back.

6. **The caption's rest state is `opacity: 0`, and it must stay in the CSS.**
   Keyframe 0 is also `opacity: 0`, so the two agree and the first paint does
   not flash — but the CSS declaration is what covers the window before the
   controller upgrades.

7. **The declared `perspective: 1500px` is not measurably reaching anything.**
   Painted/layout width was exactly 1× on all six cards at every stop. The fan
   still *reads* as depth because the pose bakes `scale` and `translateX` in by
   hand; treat the projection as unverified and size the cards from the
   authored `scale` values, not from a magnification factor.

8. **Content-stack → media-cover** (ladder rung 4): the image is
   `position: absolute; inset: 0; object-fit: cover` behind a
   `justify-content: flex-end` column, so the caption sits over the photo. Copy
   over a photo needs a scrim — see design-guidelines.

## Check before committing numbers

- Adjacent cards must not fully occlude: with card width `W`, the painted gap
  between slot `s` and `s+1` is `W·(Δx_fraction − 0.1·Δ|s|)`; keep it positive
  or the fan collapses into one edge-on stack.
- `|angle|` must stay under 90° at the outermost slot, or that card shows its
  back — at 55° the demo has 35° of headroom, so a section with more items must
  stop widening the angle rather than extrapolate `35 + 10·(|s|−1)`.
- The outermost card at `scale 0.7` and `translateX(150%)` extends to roughly
  `±2.05·W` from centre; the stage must be that wide or the fan is cropped.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Card Width | 300 px | card + carousel `width` |
| Card Height | 500 px | card + carousel `height` |
| Depth Step | 200 px | `translateZ` term of the pose rule |
| Image Zoom | 1.08 | the image hover keyframe's `transform: scale()` |
| Caption Fade | 350 ms | caption effect `duration` |
| Zoom Duration | 600 ms | image effect `duration` |

Expose the **geometric inputs**, never values derived from them: no control for
per-card `rotateY` (it follows the slot and the angle cap), no control for
per-card `scale` (it follows `1 − 0.1·|s|`), no control for `z-index` (it
follows `|s|`), and no control for the carousel box separately from the card —
they are the same two numbers.

Depth Step is the awkward one: it is baked into each card's static
`transform` string, so that control must re-template every pose rule, not set a
variable. Image Zoom is likewise inside a keyframe `transform`, so it
re-templates the image keyframes.

## Reference defaults (N = 6) — inputs, not constants

Card 300×500 · perspective 1500px (declared, unverified) · depth step 200px ·
scale step 0.1 per slot · angles 0/35/45/55deg · x offsets
0/±60%/±110%/+150% · z-index 10/5/2/1. Hover: image
`scale(1 → 1.08)` 600ms `ease-out`, caption `opacity(0 → 1)` 350ms `ease-out`,
both `fill: 'both'`, `triggerType: 'alternate'`.

On a Wix section the cards must escape the grid to overlap: `position: absolute`
on each card with `grid-area: auto`, `margin: 0`, `max-width`/`max-height: none`
(all `!important` — structural), the stage claiming one grid area with
`transform-style: preserve-3d`, and `overflow: clip` moved up to the section.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Small Carousel</title>
<style>
  body { margin: 0; background: #07070d; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  /* Stage. perspective is declared here as in the source, but it was NOT
     measurable on any card (painted/layout width 1x everywhere) - see note (7).
     The fan reads as depth because the poses bake scale and x in by hand. */
  .carousel-container {
    perspective: 1500px;
    width: 100%; height: 100vh;
    display: flex; justify-content: center; align-items: center;
  }
  /* Same box as one card: the cards are absolute against it. */
  .carousel {
    position: relative;
    width: 300px; height: 500px;
    transform-style: preserve-3d;
  }

  /* No card-level animation - the pose is a static inline transform (note 1). */
  .card {
    position: absolute; inset: 0;
    overflow: hidden; border-radius: 14px;
    display: flex; flex-direction: column; justify-content: flex-end;
  }
  /* Media-cover, not content-stack: photo fills the card, caption over it. */
  .card-image {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; z-index: 1;
    transform: scale(1);            /* rest pose === keyframe 0 */
  }
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content {
    position: relative; z-index: 2; width: 100%;
    padding: 2rem 1.25rem 1.5rem; box-sizing: border-box;
    opacity: 0;                     /* rest pose === keyframe 0 (note 6) */
  }
  .card-artist { font-size: 1.15rem; font-weight: 600; }
  .card-keywords { font-size: .7rem; color: rgba(255,255,255,.72); margin-top: .3rem; }
</style>
</head>
<body>

<div class="carousel-container">
  <div class="carousel"></div>
</div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants - re-derive for a different item count or card size.
const CARD_W = 300, DEPTH_STEP = 200, SCALE_STEP = 0.1;
const IMAGE_ZOOM = 1.08, ZOOM_MS = 600, FADE_MS = 350;

// slot: signed fan position. Six items => lopsided (3 right, 2 left) by design.
const CARDS = [
  { slot:  0, x:    0, name: 'Orion Nebula',     kw: 'Stellar Nursery • Cosmic Clouds • New Stars',   photo: 'photo-1462331940025-496dfbfc7564' },
  { slot:  1, x:   60, name: 'Carina Nebula',    kw: 'Cosmic Reef • Massive Stars • Destruction',      photo: 'photo-1444703686981-a3abbc4d4fe3' },
  { slot:  2, x:  110, name: 'Eagle Nebula',     kw: 'Creation • Destruction • Pillars of Gas',        photo: 'photo-1543722530-d2c3201371e7' },
  { slot:  3, x:  150, name: 'Veil Nebula',      kw: 'Supernova Remnant • Wisps • Ethereal',           photo: 'photo-1502134249126-9f3755a50d78' },
  { slot: -2, x: -110, name: 'Rosette Nebula',   kw: 'Stellar Cluster • Rose • Ionized Hydrogen',      photo: 'photo-1419242902214-272b3f66ee7a' },
  { slot: -1, x:  -60, name: 'Horsehead Nebula', kw: 'Dark Nebula • Cosmic Dust • Silhouette',         photo: 'photo-1534796636912-3b95b3ab5986' },
];

// One pose function replaces the demo's six hand-written classes (note 2).
// Angle is capped so an outer card never shows its back.
const pose = ({ slot, x }) => {
  const d = Math.abs(slot);
  const angle = d === 0 ? 0 : -Math.sign(slot) * Math.min(35 + 10 * (d - 1), 55);
  return {
    transform: `translateX(${x}%) translateZ(${-DEPTH_STEP * d}px) rotateY(${angle}deg) scale(${(1 - SCALE_STEP * d).toFixed(2)})`,
    zIndex: Math.max(10 - 3 * d, 1),
  };
};

// Adjacent faces must not fully occlude; outer card must fit the stage.
const outer = Math.max(...CARDS.map(c => Math.abs(c.x) / 100 + (1 - SCALE_STEP * Math.abs(c.slot)) / 2));
console.log('fan half-width', (outer * CARD_W).toFixed(0) + 'px', '=', outer.toFixed(2) + '× card width');

const carousel = document.querySelector('.carousel');
CARDS.forEach((card, i) => {
  const p = pose(card);
  carousel.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i}">
      <div class="card" id="card-${i}" style="transform:${p.transform};z-index:${p.zIndex}">
        <img class="card-image" src="https://images.unsplash.com/${card.photo}?w=600&h=1000&fit=crop" alt="" draggable="false">
        <div class="card-content">
          <div class="card-artist">${card.name}</div>
          <div class="card-keywords">${card.kw}</div>
        </div>
      </div>
    </interact-element>`);
});

// Two effects per card, on two different descendants, writing two different
// properties - so neither touches the card's own static pose (note 4).
// key + selector join with NO space, so selector must be a compound class.
const interactions = CARDS.map((_, i) => ({
  trigger: 'hover',
  key: `card-${i}`,
  effects: [
    {
      key: `card-${i}`, selector: '.card-image',
      keyframeEffect: {
        name: `card-${i}-image-hover`,
        keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${IMAGE_ZOOM})` }],
      },
      duration: ZOOM_MS, easing: 'ease-out', fill: 'both', triggerType: 'alternate',
    },
    {
      key: `card-${i}`, selector: '.card-content',
      keyframeEffect: {
        name: `card-${i}-content-hover`,
        keyframes: [{ opacity: 0 }, { opacity: 1 }],
      },
      duration: FADE_MS, easing: 'ease-out', fill: 'both', triggerType: 'alternate',
    },
  ],
}));

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```