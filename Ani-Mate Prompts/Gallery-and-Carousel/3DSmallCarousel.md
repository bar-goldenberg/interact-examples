# Task

Apply the **3D Small Carousel** to this section: a ring of eight photo cards
turning two full revolutions on scroll, each card dimming as it recedes to the
back and brightening as it swings to the front, copy over the images.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The ring wrapper's perspective is live here — measured, not assumed.**
   Peak painted/layout width was 1.464×, which is `1200/(1200 − 380)` =
   `perspective/(perspective − R)` to three digits, so the projection reaches
   the cards through the `preserve-3d` carousel. On a Wix section with no spare
   wrapper, use the ladder rung 3 equivalence instead of demanding one —
   spinning the ring and rotating each card are the same geometry.

2. **Two effects, two properties, two kinds of key, one clock.** The spin
   writes `transform` on the ring; the dim writes `filter` on each card. Both
   sit on the same `cover` 0→100% range, so they can never drift out of phase:
   card `i`'s brightness curve is the one shared curve phase-shifted by
   `i·360/N`.

3. **Brightness is derived from angular proximity, not authored per card.**
   `p = (cos θ + 1)/2`, `brightness(0.3 + 0.8p)` — 1.10 square-on at the
   front, 0.30 at the back — sampled every **15°** across the 720° spin →
   49 keyframes, `easing: linear`, curve baked into the values. At these
   defaults one sample lands every ~8.3vh of scroll (400vh / 48 segments).

4. **The faces are raw — mirrored past 90° — and that is deliberate.** The
   backs are dimmed to 0.30 and the source hid the copy until hover, so the
   mirroring never reads. If the target's copy must stay legible at the back,
   add the counter-rotation from the house rules — which bakes the radius into
   the keyframes and changes what the Ring Depth control has to re-template
   (see Controls).

5. **Because nothing composes after the ring's `rotateY`, the radius is NOT
   baked into keyframes.** `translateZ(380px)` lives only in each card's
   static rest `transform`; the animated keyframes contain a bare rotation
   (ring) and a bare `filter` (cards). This is the cheap-controls property the
   counter-rotated variant loses.

## Check before committing numbers

- Faces must not overlap: `2R·sin(180/N°)` > card width — here
  `2·380·sin(22.5°) = 290.9 > 280`, a 11px margin only; shrink R or N with care.
- The front card paints magnified by `perspective/(perspective − R)` = 1.46×
  at 1200/380 (measured 1.464×), so a 280×420 card draws ~410×615 and the
  100vh stage must fit that plus any heading band.

## Controls to expose

Seven, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Ring Depth | 380 px | `translateZ` in each card's static rest `transform` |
| Card Width | 280 px | carousel `width` (cards are `inset: 0`) |
| Card Height | 420 px | carousel `height` |
| Perspective | 1200 px | viewport `perspective` |
| Spin | 720 deg | spin keyframe end — re-templates the dim keyframes too |
| Dim Floor | 0.30 | the filter template's floor — re-templates the dim keyframes |
| Scroll Length | 400 vh | section `height` |

Expose the **geometric inputs**, never values derived from them: no control
for keyframe count (it follows Spin at the fixed 15° step), per-card start
angle (it follows N), front magnification (it follows Perspective and Ring
Depth), or the brightness peak (fixed 0.8 span above the floor).

Spin and Dim Floor are baked into the 49 dim keyframes, so both must
re-template every keyframe, not merely set a variable. Ring Depth is **not**
baked (note 5) — it only rewrites the static rest transforms — unless a
counter-rotation is added per note 4, at which point it too must re-template.

## Reference defaults (N = 8) — inputs, not constants

Ring depth (R) 380px · card 280×420 · perspective 1200px, origin 50% 45% ·
spin 720° (2 turns; one turn per 200vh) · runway 400vh · stage 100vh sticky ·
dim `brightness(0.3 + 0.8p)` sampled at 15° → 49 keyframes · `viewProgress`,
`cover` 0→100%, `fill: both`, `easing: linear`.

Viewport carries `perspective`; the ring carries `transform-style:
preserve-3d`; `overflow: clip` stays on the sticky wrapper, never on the ring.
On a Wix section, cards additionally need `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` (all `!important` — structural) to escape the
grid, and the per-card form of rung 3 makes them direct children of the
perspective host.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>3D Small Carousel</title>
<style>
  body { margin: 0; background: #08080c; color: #eeeef2; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  .scroll-section { height: 400vh; position: relative; }

  /* Pin. Clip lives here — overflow != visible on the ring would force flat. */
  .sticky-wrapper {
    position: sticky; top: 0; height: 100vh;
    display: flex; justify-content: center; align-items: center;
    overflow: clip;
  }

  .carousel-viewport { perspective: 1200px; perspective-origin: 50% 45%; }

  /* The ring. Its rotateY is the only animated transform — see note (5). */
  .carousel {
    position: relative; width: 280px; height: 420px;
    transform-style: preserve-3d;
  }

  .card {
    position: absolute; inset: 0;
    border-radius: 20px; overflow: hidden;
    box-shadow: 0 8px 40px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06);
  }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content { position: absolute; bottom: 0; left: 0; right: 0; z-index: 2; padding: 1.5rem 1.25rem; }
  .card-content h3 { margin: 0 0 .35rem; font-size: 1.25rem; }
  .card-content p  { margin: 0; font-size: .65rem; letter-spacing: .12em;
                     text-transform: uppercase; color: rgba(255,255,255,.55); }
</style>
</head>
<body>

<interact-element data-interact-key="scroll-section">
  <div class="scroll-section">
    <div class="sticky-wrapper">
      <div class="carousel-viewport">
        <interact-element data-interact-key="carousel">
          <div class="carousel"><!-- cards injected here --></div>
        </interact-element>
      </div>
    </div>
  </div>
</interact-element>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different item count or card size.
const N = 8, RADIUS = 380, PERSPECTIVE = 1200, CARD_W = 280;
const SPIN = 720, STEP = 15, STEPS = SPIN / STEP + 1;   // 49 samples
const DIM_FLOOR = 0.3, DIM_SPAN = 0.8;                  // brightness 0.30 … 1.10

// Faces must not overlap; the front card paints magnified — stage must fit it.
console.assert(2 * RADIUS * Math.sin(Math.PI / N) > CARD_W, 'radius too small: faces overlap');
console.log('front card magnified', (PERSPECTIVE / (PERSPECTIVE - RADIUS)).toFixed(3) + '×');

const CARDS = [
  ['Yosemite Valley', 'California · Dawn · Granite',      'photo-1506744038136-46273834b3fb'],
  ['Alpine Sunrise',  'Mountains · Light · Silence',      'photo-1469474968028-56623f02e42e'],
  ['Mirror Lake',     'Reflection · Sunset · Stillness',  'photo-1501785888041-af3ef285b470'],
  ['Forest Mist',     'Fog · Evergreen · Mystery',        'photo-1470071459604-3b5ec3a7fe05'],
  ['Starry Peaks',    'Night Sky · Snow · Wonder',        'photo-1519681393784-d120267933ba'],
  ['Hidden Falls',    'Water · Moss · Tranquility',       'photo-1433086966358-54859d0ed716'],
  ['Golden Hour',     'Fields · Warmth · Horizon',        'photo-1472214103451-9374bd1c798e'],
  ['Coastal Dusk',    'Ocean · Sand · Serenity',          'photo-1507525428034-b723cf961d3e'],
];

// Brightness from angular proximity to the front (world angle 0). Note (3).
const dim = deg => {
  const p = (Math.cos(deg * Math.PI / 180) + 1) / 2;
  return `brightness(${(DIM_FLOOR + DIM_SPAN * p).toFixed(2)})`;
};

const ring = document.querySelector('.carousel');
CARDS.forEach(([title, sub, photo], i) => {
  const angle = i * 360 / N;
  // rest pose === keyframe 0: static ring pose + starting brightness
  ring.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i}">
      <div class="card" style="transform: rotateY(${angle}deg) translateZ(${RADIUS}px); filter: ${dim(angle)}">
        <img src="https://images.unsplash.com/${photo}?w=600&h=900&fit=crop" alt="">
        <div class="card-content"><h3>${title}</h3><p>${sub}</p></div>
      </div>
    </interact-element>`);
});

const range = {
  rangeStart: { name: 'cover', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'cover', offset: { value: 100, unit: 'percentage' } },
};

const effects = [
  { key: 'carousel',
    keyframeEffect: { name: 'carousel-spin',
      keyframes: [{ transform: 'rotateY(0deg)' }, { transform: `rotateY(${SPIN}deg)` }] },
    ...range, fill: 'both', easing: 'linear' },
  ...CARDS.map((_, i) => ({
    key: `card-${i}`,
    keyframeEffect: {
      name: `card-${i}-dim`,
      keyframes: Array.from({ length: STEPS }, (_, s) => ({
        offset: s / (STEPS - 1),
        filter: dim(i * 360 / N + s * STEP),
      })),
    },
    ...range, fill: 'both', easing: 'linear',
  })),
];

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