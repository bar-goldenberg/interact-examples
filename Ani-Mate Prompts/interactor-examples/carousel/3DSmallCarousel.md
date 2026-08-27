
# Task

Apply the **3D Small Carousel** to this section: a ring of cards turning on
scroll, depth blur on the receding cards, copy over the images, back cards
readable instead of flipping.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **No ring element needed.** `translateZ` composes in the card's
   *already-rotated* local frame, so animating `rotate` per card with a static
   `transform: translateZ(R)` is geometrically identical to spinning a
   container. Wix cards share their only parent with the heading, so use this.

2. **Counter-rotate the face** or the back half is unreadable. `rotateY(g)`
   *after* the `translateZ`, same `transform`, with `g = AMP·sin(θ) − θ`
   (AMP = 55°). Net angle to the viewer is `AMP·sin(θ)`: square-on at front
   **and** back, ≤AMP at the sides, no flip at 180°. Being inside `transform`
   bakes the radius into the keyframes.

3. **Card `i` starts at `θᵢ = i·360/N`**; every card advances by the same spin,
   so its sample `s` is `θ = θᵢ + spin(s)`.

4. **Brightness and blur are derived, not authored** — angular proximity to the
   front, which can't be two endpoints:
   `p = (cos θ + 1)/2`, `filter: brightness(0.3 + 0.8p) blur(MAX_BLUR·(1−p))`.
   Front `p=1` → `brightness(1.10) blur(0)`; back `p=0` → `0.30` / MAX_BLUR.
   Sample every **30°** — 37 keyframes over 3 turns, `easing: linear`, curve in
   the values.

5. **`filter` on the CARD, not the image** — a soft photo under razor-sharp text
   reads as broken.

6. **No `will-change`, no `backface-visibility`.** Both pin the layer raster at
   creation scale, and the front card is magnified ~1.45×, so copy renders
   resampled. Easiest thing to get wrong; with (2) in place
   `backface-visibility` was doing nothing anyway.

7. **Content-stack → media-cover** (ladder rung 4): card content becomes a
   column flex, `justify-content: flex-end`, `height: 100%`; image
   `position: absolute; inset: 0`; `::after` scrim
   `linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent)`
   at 62% height; title and paragraph white at `z-index: 2`.

8. **The stage is PINNED — `position: sticky; top: 0; height: 100vh` is the
   mechanism, not scaffolding.** Without it the ring spins while the section
   scrolls past in one viewport and the rest of the runway is blank. Add
   `perspective` + `preserve-3d` on the stage and `overflow: clip` on the
   section. Cards must be *direct* children of the stage.

9. **The runway goes on the sticky stage's CONTAINING BLOCK, and the safe
   stage is `__content`.** Sticky is clamped by its containing block: pin
   `__content` and its containing block is the section, so a tall section is
   the travel. Pin an inner element instead — e.g. the cards' own grid — and a
   480vh *section* leaves that grid's parent at natural height: measured, the
   pin died at 5% of the scrub and the remaining 95% scrolled blank. If you
   must pin an inner grid item, grow the grid (`__content` height) or span the
   item to the trailing row — never just the section.

## Check before committing numbers

- Faces must not overlap: `2R·sin(180/N°)` > card width.
- Front card paints magnified by `perspective/(perspective − R)` — 1.45× at
  1600/500, so a 320×300 card draws 465×436 and the stage must fit that.

## Controls to expose

Seven, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Ring Depth | 500 px | radius — re-templates the keyframes' `translateZ` |
| Depth Blur | 15 px | `MAX_BLUR` in the filter template |
| Card Width | 320 px | card `width` |
| Card Height | 300 px | card `height` |
| Stage Height | 100 vh | stage `height` |
| Perspective | 1600 px | stage `perspective` |
| Scroll Length | 360 vh | runway `height` — the pinned stage's containing block: the section when pinning `__content`, the grid when pinning an item inside it (see 9) |

Expose the **geometric inputs**, never values derived from them: no control for
the counter-rotation angle (it follows the radius), the brightness curve (it
follows blur), or the magnification (it follows perspective and radius).

Ring Depth is the awkward one — the radius is baked into every keyframe's
`transform`, because the counter-rotation has to compose after `rotate` (2). So
that control must re-template all 37 keyframes, not just set a variable.

## Reference defaults (N = 5) — inputs, not constants

Ring depth (R) 500px · depth blur 15px · card 320×300 · stage 100vh ·
perspective 1600px · runway 360vh on the stage's containing block (see 9) ·
stage `position: sticky; top: 0` · spin 3 turns (1080°) on `viewProgress`,
`cover` 0→100%, `fill: both`, `easing: linear`.

Cards `position: absolute` at `left: 50%; top: 58%`, `translate: -50% -50%`,
`perspective-origin: 50% 58%` — leaving the heading its band across the top.
Each also needs `grid-area: auto`, `margin: 0`, `max-width`/`max-height: none`
(all `!important` — structural) to escape the Wix grid.


# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>3D Small Carousel</title>
<style>
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  /* Runway. Clip lives here, not the stage: overflow != visible forces flat. */
  .scroll-section { position: relative; height: 360vh; overflow: clip; }

  /* Pinned stage. perspective reaches DIRECT children only; interact-element
     is display: contents so the cards are direct children. */
  .sticky-stage {
    position: sticky; top: 0; height: 100vh;
    perspective: 1600px; perspective-origin: 50% 58%;
    transform-style: preserve-3d;
  }
  .stage-heading { position: absolute; top: 8vh; width: 100%; text-align: center; z-index: 3; }

  /* All cards sit at the same point; the ring is each card's own rotate +
     translateZ. Note the absent will-change / backface-visibility — see (6). */
  .card {
    position: absolute; left: 50%; top: 58%;
    width: 320px; height: 300px;
    translate: -50% -50%; transform-origin: 50% 50%;
    border-radius: 18px; overflow: hidden;
    display: flex; flex-direction: column; justify-content: flex-end;
    box-shadow: 0 18px 50px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.07);
  }
  /* Media-cover, not content-stack: photo fills the card, copy sits over it. */
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content { position: relative; z-index: 2; padding: 1.35rem 1.25rem; }
  .card-content h3 { margin: 0 0 .4rem; font-size: 1.3rem; }
  .card-content p  { margin: 0; font-size: .7rem; color: rgba(255,255,255,.72); }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key="scroll-section">
  <div class="scroll-section">
    <div class="sticky-stage">
      <div class="stage-heading"><h2>Why choose us</h2></div>
      <!-- cards injected here -->
    </div>
  </div>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different item count or card size.
const N = 5, RADIUS = 500, PERSPECTIVE = 1600, CARD_W = 320;
const FACE_AMP = 55;    // deg, max lean of a face at the sides
const MAX_BLUR = 15;    // px, blur at the very back
const SPIN = 3 * 360;   // total rotation across the runway
const STEP = 30;        // keyframe sampling interval, deg
const STEPS = SPIN / STEP + 1;

// Faces must not overlap; front card paints magnified — stage must fit that.
console.assert(2 * RADIUS * Math.sin(Math.PI / N) > CARD_W, 'radius too small');
console.log('front card magnified', (PERSPECTIVE / (PERSPECTIVE - RADIUS)).toFixed(2) + '×');

const CARDS = [
  ['Craft first',    'Every detail measured, nothing left to chance.', 'photo-1506744038136-46273834b3fb'],
  ['Built to last',  'Materials chosen for the decade, not the season.', 'photo-1469474968028-56623f02e42e'],
  ['Always on hand', 'A real person, in your timezone, on the first ring.', 'photo-1501785888041-af3ef285b470'],
  ['Quietly precise','The work speaks before we do.', 'photo-1470071459604-3b5ec3a7fe05'],
  ['No surprises',   'One price, agreed up front, held to the end.', 'photo-1519681393784-d120267933ba'],
];

const rad = d => d * Math.PI / 180;

// One card's pose at ring angle theta. See mechanism note (1), (2), (4).
const pose = theta => ({
  rotate: `0 1 0 ${theta.toFixed(2)}deg`,
  transform: `translateZ(${RADIUS}px) rotateY(${(FACE_AMP * Math.sin(rad(theta)) - theta).toFixed(2)}deg)`,
  filter: (p => `brightness(${(0.3 + 0.8 * p).toFixed(2)}) blur(${(MAX_BLUR * (1 - p)).toFixed(2)}px)`)
          ((Math.cos(rad(theta)) + 1) / 2),
});

const stage = document.querySelector('.sticky-stage');
CARDS.forEach(([title, copy, photo], i) => {
  const p = pose(i * 360 / N);   // rest pose === keyframe 0, or the first paint flashes
  stage.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i}">
      <div class="card" style="rotate:${p.rotate};transform:${p.transform};filter:${p.filter}">
        <img src="https://images.unsplash.com/${photo}?w=640&h=600&fit=crop" alt="">
        <div class="card-content"><h3>${title}</h3><p>${copy}</p></div>
      </div>
    </interact-element>`);
});

const range = {
  rangeStart: { name: 'cover', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'cover', offset: { value: 100, unit: 'percentage' } },
};

const effects = CARDS.map((_, i) => ({
  key: `card-${i}`,
  keyframeEffect: {
    name: `card-${i}-orbit`,
    keyframes: Array.from({ length: STEPS }, (_, s) => ({
      offset: s / (STEPS - 1),
      ...pose(i * 360 / N + s * STEP),
    })),
  },
  ...range, fill: 'both', easing: 'linear',
}));

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: 'scroll-section', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>

```
