# Task

Apply **Manta Ray** to this section: a row of overlapping images that slide into a slow vertical breathing loop the first time the section enters view, and swell to 2.5× under the pointer.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The overlap *is* the layout, and it is a function of one control.** Each
   item is `--base-size` vw wide and every item after the first carries
   `margin-left: -(base-size × overlap-ratio)vw`. At the reference values
   (12vw, 0.67) each image shows only its leftmost ~33% — 4 items occupy
   `12 + 3·12·0.33 = 23.9vw`, not 48vw. Change the item count and the strip
   width changes; change the ratio and the visible sliver does. Nothing in the
   config knows about either — it is pure CSS.

2. **Both animations write `transform`, and they only coexist because of
   `composite: 'add'`.** The breathe loop (`translateY`) and the hover swell
   (`scale`) are separate effects on the *same* element and the same property;
   each is declared additive so it contributes relative to the underlying value
   instead of replacing it. Drop `composite: 'add'` on either and hovering
   freezes the breathing, or the breathing cancels the swell.

3. **Both effects target the `img`, never the wrapper.** The wrapper is the
   `<interact-element>` that owns the flex width and the negative margin; a
   `translateY`/`scale` there would still animate, but the hover target region
   would grow with the swell and re-trigger. Animating the inner `img` keeps the
   hit area fixed at the un-scaled wrapper box, so a 2.5× swell cannot capture
   the pointer from its neighbour.

4. **The breathe loop is started by the gallery, not by each item.** One
   `viewEnter` interaction on the container, `triggerType: 'once'`,
   `threshold: 0`, with `selector: 'interact-element > img'` — the descendant
   selector is what fans the single interaction out to all N images. Adding
   items needs no config change; only the hover interactions are per-key.

5. **`offset: 150` is a sequence delay in milliseconds, not a stagger.** It is
   one number on one sequence step, so all images begin the loop together 150ms
   after the section crosses the threshold. If a staggered entrance is wanted,
   it has to be N sequence steps with increasing offsets — the demo's tag list
   says "stagger" but the config does not stagger.

6. **The loop is asymmetric about rest.** Keyframes are `translateY(-62px)` →
   `translateY(262px)`: 324px of travel whose midpoint sits 100px *below* the
   laid-out position, and `alternate` + `iterations: Infinity` means the strip
   never returns to its authored `y`. The resting design must be checked against
   the loop's midpoint, not its keyframe 0 (design-guidelines 4). Because the
   effect is additive, both numbers are offsets from wherever layout put the
   image.

7. **The `perspective: 1000px` on the wrapper does nothing here.** Measured
   across 9 scroll stops, every element's painted width equalled its layout
   width (1×) — no 3D is in play, because nothing in either effect rotates.
   Keep it only if the target adds a rotation; otherwise it is inert.

## Check before committing numbers

- Strip must fit: `base-size × (1 + (N−1)·(1 − overlap-ratio)) ≤ 100` (vw).
  At N = 4, 12vw, 0.67 → 23.9vw. Re-derive for the target's item count.
- Swell must not overflow the section: a `base-size`-wide image at
  `scale(2.5)` paints `2.5 × base-size` vw wide and `2.5 ×` its height about
  its own centre. At 12vw that is 30vw — the section needs that much room
  vertically too, or the hovered image is cut off.
- Vertical travel must stay inside the section: the loop moves the image
  `|−62|` up and `262` down from rest. `travel-down + image-height/2` must be
  under the section's half-height, or the strip drifts out of its own band.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Item Width | 12 vw | `--base-size` (wrapper `width`) |
| Overlap | 0.67 | `--overlap-ratio` (wrapper `margin-left`) |
| Hover Scale | 2.5 | the swell keyframe's `scale()` |
| Breathe Travel | 324 px | the loop keyframes' `translateY` span |
| Breathe Duration | 2000 ms | loop effect `duration` |

Expose the **geometric inputs**, never values derived from them: no control for
the strip's total width (it follows item width, overlap and N), no control for
the negative margin (it follows item width × overlap), and no separate control
for the two `translateY` endpoints — they follow the travel span and its
midpoint bias.

Hover Scale and Breathe Travel are both baked into keyframes: they compose
inside `transform`, so each must re-template its effect's keyframes, not merely
set a CSS variable. (`var()` in WAAPI keyframes is unreliable in Safari.)

## Reference defaults (N = 4) — inputs, not constants

Item width 12vw · overlap ratio 0.67 (margin-left −8.04vw) · hover scale 2.5,
300ms, `ease-out`, `fill: both`, `triggerType: 'alternate'` · breathe
−62px → 262px, 2000ms, `ease-in-out`, `alternate`, `iterations: Infinity` ·
gallery `viewEnter`, `threshold: 0`, sequence `offset: 150`, `triggerType: 'once'` ·
both effects `composite: 'add'`.

The wrappers need `flex-shrink: 0` (otherwise flex collapses the overlap into
nothing) and `position: relative; z-index: 1` so a swollen image lifts over its
neighbours. On a Wix target the row container needs `display: flex;
flex-wrap: nowrap; overflow: clip` and each item `grid-area: auto; margin: 0;
max-width: none` (all `!important` — structural) to escape the Wix grid; the
negative `margin-left` must then be applied *after* that reset, on
`item + item`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Manta Ray</title>
<style>
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; }
  .spacer { height: 100vh; }

  /* Inputs. Item width and overlap ratio are the two geometric controls. */
  :root { --base-size: 12; --overlap-ratio: 0.67; }

  /* Room for the 2.5x swell in both axes, and for the loop's 324px of travel. */
  .gallery-section {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    overflow: clip;              /* never hidden -- kills ViewTimeline */
  }

  interact-element[data-interact-key="gallery"] { display: contents; }

  .gallery-row { display: flex; flex-wrap: nowrap; justify-content: center; align-items: center; }

  /* The wrapper owns layout; the img owns motion. See mechanism note (3). */
  .item {
    position: relative; z-index: 1;   /* a swollen image lifts over its neighbours */
    width: calc(var(--base-size) * 1vw);
    flex-shrink: 0;                   /* without this flex eats the overlap */
  }
  /* The overlap. -(width * ratio) on every item but the first. */
  .gallery-row > .item + .item {
    margin-left: calc(var(--base-size) * var(--overlap-ratio) * -1vw);
  }
  .item img { display: block; width: 100%; height: auto; border-radius: 2px; }
</style>
</head>
<body>

<div class="spacer"></div>

<section class="gallery-section">
  <interact-element data-interact-key="gallery">
    <div class="gallery-row"><!-- items injected here --></div>
  </interact-element>
</section>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants -- re-derive for a different item count or width.
const BASE_SIZE = 12;        // vw, each item's width
const OVERLAP   = 0.67;      // fraction of an item hidden by its neighbour
const HOVER_SCALE = 2.5;
const BREATHE_FROM = -62, BREATHE_TO = 262;   // px, additive offsets from rest
const BREATHE_MS = 2000;

const PHOTOS = [
  'photo-1506744038136-46273834b3fb',
  'photo-1469474968028-56623f02e42e',
  'photo-1501785888041-af3ef285b470',
  'photo-1470071459604-3b5ec3a7fe05',
];
const N = PHOTOS.length;

// The strip must fit across the viewport, and the swell must fit inside it.
console.assert(BASE_SIZE * (1 + (N - 1) * (1 - OVERLAP)) <= 100, 'strip wider than viewport');
console.log('strip width', (BASE_SIZE * (1 + (N - 1) * (1 - OVERLAP))).toFixed(1) + 'vw',
            '| swollen item', (BASE_SIZE * HOVER_SCALE).toFixed(1) + 'vw');

const row = document.querySelector('.gallery-row');
PHOTOS.forEach((photo, i) => {
  // Rest pose is plain layout: both effects are additive, so keyframe 0
  // contributes 0 to a transform that starts at none. No flash.
  row.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="img-wrapper-${i}" class="item">
      <img src="https://images.unsplash.com/${photo}?w=600&h=800&fit=crop" alt="">
    </interact-element>`);
});

const config = {
  effects: {
    'breathe-vertical': {
      keyframeEffect: {
        name: 'breathe',
        keyframes: [
          { transform: `translateY(${BREATHE_FROM}px)` },
          { transform: `translateY(${BREATHE_TO}px)` },
        ],
      },
      duration: BREATHE_MS,
      easing: 'ease-in-out',
      iterations: Infinity,
      alternate: true,
    },
    'scale-up-image': {
      keyframeEffect: {
        name: 'scale-up',
        keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${HOVER_SCALE})` }],
      },
      duration: 300,
      easing: 'ease-out',
      fill: 'both',
    },
  },
  interactions: [
    // One interaction starts the loop on ALL images -- the descendant
    // selector fans it out. See mechanism note (4).
    {
      key: 'gallery',
      trigger: 'viewEnter',
      params: { threshold: 0 },
      sequences: [{
        offset: 150,             // ms delay, not a stagger -- note (5)
        triggerType: 'once',
        effects: [{ selector: 'interact-element > img', effectId: 'breathe-vertical', composite: 'add' }],
      }],
    },
  ],
};

// Hover is per-item, so it is per-key. Both effects write `transform`;
// composite: 'add' is what lets them share it -- note (2).
PHOTOS.forEach((_, i) => {
  const key = `img-wrapper-${i}`;
  config.interactions.push({
    key,
    trigger: 'hover',
    effects: [{ key, selector: 'img', effectId: 'scale-up-image', triggerType: 'alternate', composite: 'add' }],
  });
});

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create(config);
</script>

</body>
</html>
```