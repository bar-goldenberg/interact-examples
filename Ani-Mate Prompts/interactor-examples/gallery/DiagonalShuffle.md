# Task

Apply **Diagonal Shuffle** to this section: a stack of image cards at the centre of a pinned viewport, each one flung in from an alternating bottom corner as you scroll, rotating and scaling down into a fanned deck.

The demo below runs. Read it for the mechanism, map it onto this section's elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The motion is 2D — the demo's `perspective: 1200px` and `transform-style: preserve-3d` do nothing.** Every animated transform is `translate` / `rotate(z)` / `scale`; none of them has a Z component, so the projection has nothing to project. Measured over 9 scroll stops in a browser: painted width / layout width was **1.00× on all five cards at every stop**. Drop both properties and the tag "3d" — carrying them forward invites an agent to "fix" a 3D that was never there.

2. **Card `i` launches from a corner whose side alternates, and lands at a tilt that decays to zero.** With 1-based `i` and `dir = i odd ? −1 : +1`: launch at `translate(dir·80vw, +50vh) rotate(dir·45deg) scale(0.7)`, rest at `rotate(dir·FAN·(N−i))` — −4°, +3°, −2°, +1°, 0° for N = 5. Y is `+50vh` for **every** card: they all come up from below, only X and the spin alternate. The decay is not decoration — cards paint in DOM order, so the **last** card is the top of the deck and must land square; the ones underneath peek out at progressively larger angles.

3. **Split the single `transform` into `translate` / `rotate` / `scale`, which is geometrically identical here and frees two controls.** The demo writes one string, `translate(-50%,-50%) translate(X,Y) rotate(θ) scale(s)`. CSS composes the individual properties in exactly that order (translate → rotate → scale, translate outermost), and the centring offset folds in as `translate: calc(-50% + X) calc(-50% + Y)` — element-percentage and viewport units add cleanly in one `calc`. Same matrix, three separately-templatable properties instead of one baked string.

4. **The demo's `.card { opacity: 0 }` never takes effect.** With `fill: both`, each effect back-fills keyframe 0 from the moment the timeline exists, and keyframe 0 is `opacity: 1`. The rest pose that actually paints before a card's range is its *launch* pose. Set the resting inline style to the launch pose (as the demo below does) and delete the `opacity: 0` — otherwise the authored rest state and the painted rest state disagree and nobody can reason about the first frame.

5. **The stagger is one arithmetic ladder, not five hand-written ranges.** `startᵢ = 5 + 15(i−1)`, `endᵢ = startᵢ + 20`, all on `cover`. The 20% duration against a 15% step means each card is still arriving 5% into the next one's launch — that overlap is the "shuffle"; a step ≥ duration turns it into five separate reveals.

6. **The last card must land while the section is still pinned.** Ending at 85% of `cover` leaves 15% of the runway for the finished deck to sit still before the pin releases — the deliberate resting state, not a stack still settling as it scrolls off.

7. **Cards launch outside the viewport, so clipping is structural.** `80vw` of X travel puts the card well past the edge; the pinned wrapper takes `overflow: clip` and the page takes `overflow-x: clip`. On a Wix section the clip belongs on the section, not on the pinned stage.

## Check before committing numbers

- Cards must start fully offstage: `DX·vw ≥ 50·vw + cardWidth/2`. At `DX = 80vw` and a 400px cap this needs a viewport ≥ ~667px; narrower, and the first frame shows the card already half on screen.
- The whole ladder must fit the timeline: `START + STEP·(N−1) + DUR ≤ 100`. At 5/15/20 that is 85 for N = 5, and it breaks at N = 7 — for more cards compress the step to `(85 − DUR)/(N−1)` rather than pushing the end past 100%.
- Runway must exceed the pin: section height (450vh) has to leave real scroll after the 100vh sticky wrapper, or the ladder compresses into nothing.

## Controls to expose

Ten, each writing a **different** property (launch and rest write `rotate`, but at opposite keyframes, which are templated separately):

| Control | Default | Writes |
| --- | --- | --- |
| Fly Distance X | 80 vw | keyframe-0 `translate` X term |
| Fly Distance Y | 50 vh | keyframe-0 `translate` Y term |
| Launch Angle | 45 deg | keyframe-0 `rotate` |
| Launch Scale | 0.7 | keyframe-0 `scale` |
| Rest Fan | 1 deg/card | keyframe-1 `rotate` |
| Card Width | min(90vw, 400px) | `.card` `width` |
| Card Aspect | 4 / 3 | `.card` `aspect-ratio` |
| Stagger Step | 15 % | per-card `rangeStart` |
| Fly Duration | 20 % | `rangeEnd` − `rangeStart` |
| Scroll Length | 450 vh | section `height` |

Expose the **geometric inputs**, never values derived from them: no control for a card's individual rest tilt (it follows Rest Fan and the index), no control for its launch side or spin sign (both follow index parity), no control for the last card's end offset (it follows Stagger Step, Fly Duration and N), and no perspective control (there is no 3D — see note 1).

Every one of the first five is **baked into the keyframes**, so those controls must re-template all `2N` keyframes, not set a variable. Only Card Width, Card Aspect and Scroll Length are plain style writes.

## Reference defaults (N = 5) — inputs, not constants

Launch `±80vw / +50vh`, `±45deg`, `scale 0.7` · rest `0,0`, `fan 1deg × (N−i)`, `scale 1` · ranges `cover` `5 + 15(i−1)` → `+20`%, `easing: 'ease-out'`, `fill: 'both'` · sticky stage 100vh, runway 450vh · card `min(90vw, 400px)` at `4/3`.

Cards are `position: absolute; top: 50%; left: 50%` with the centring folded into `translate`. To escape the Wix grid each card also needs `grid-area: auto`, `margin: 0`, `max-width: none`, `max-height: none` (all `!important` — structural), then size via `width` + `aspect-ratio`. The clip goes on the section; the stage keeps `overflow: visible`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Diagonal Shuffle</title>
<style>
  body { margin: 0; overflow-x: clip; background: #0d0e12; color: #eee;
         font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  /* Runway. Clip here so the offstage launch poses never widen the page. */
  #scroll-section { position: relative; height: 450vh; }

  /* Pinned stage. No perspective, no preserve-3d: every transform is 2D (1). */
  .sticky-wrapper {
    position: sticky; top: 0; height: 100vh; width: 100%; overflow: clip;
  }

  /* Centring lives inside `translate` so keyframes can write one property (3). */
  .card {
    position: absolute; top: 50%; left: 50%;
    width: min(90vw, 400px); aspect-ratio: 4 / 3;
    border-radius: 14px; overflow: clip;
    box-shadow: 0 20px 50px rgba(0,0,0,.55), 0 0 0 1px rgba(255,255,255,.06);
  }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; padding: 1.25rem; }
  .card-content h2 { margin: 0; font-size: 1.25rem; }
  .card-content p  { margin: .25rem 0 0; font-size: .75rem; color: rgba(255,255,255,.72); }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key="scroll-section">
  <div id="scroll-section">
    <div class="sticky-wrapper"><!-- cards injected here --></div>
  </div>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different card count or size.
const N = 5;
const DX = 80, DY = 50;        // vw / vh, launch offset
const LAUNCH_ROT = 45;         // deg
const LAUNCH_SCALE = 0.7;
const FAN = 1;                 // deg per card of resting tilt
const START = 5, STEP = 15, DUR = 20;   // % of `cover`

// Ladder must fit the timeline; cards must start fully offstage.
console.assert(START + STEP * (N - 1) + DUR <= 100, 'stagger overruns the timeline');
const cardW = Math.min(0.9 * innerWidth, 400);
console.assert(DX / 100 * innerWidth >= innerWidth / 2 + cardW / 2, 'card visible at launch');

const CARDS = [
  ['Misty Mountains',  'A journey through ethereal landscapes.', 'photo-1506744038136-46273834b3fb'],
  ['Forest Canopy',    'Overhead view of a dense, green forest.', 'photo-1469474968028-56623f02e42e'],
  ['Alpine Lake',      'Crystal clear water reflecting the peaks.', 'photo-1470071459604-3b5ec3a7fe05'],
  ['Hidden Waterfall', "Nature's raw and untamed power.", 'photo-1501785888041-af3ef285b470'],
  ['Rolling Hills',    'Endless green fields under a summer sky.', 'photo-1519681393784-d120267933ba'],
];

const dir = i => (i % 2 ? -1 : 1);           // 1-based: odd from the left

// Launch and rest poses. Split across translate / rotate / scale (3).
const launch = i => ({
  translate: `calc(-50% + ${dir(i) * DX}vw) calc(-50% + ${DY}vh)`,
  rotate: `${dir(i) * LAUNCH_ROT}deg`,
  scale: `${LAUNCH_SCALE}`,
});
const rest = i => ({
  translate: '-50% -50%',
  rotate: `${dir(i) * FAN * (N - i)}deg`,    // decays to 0 on the topmost card (2)
  scale: '1',
});

const stage = document.querySelector('.sticky-wrapper');
CARDS.forEach(([title, copy, photo], idx) => {
  const i = idx + 1;
  const p = launch(i);   // rest pose === keyframe 0 (4)
  stage.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i}">
      <div class="card" style="translate:${p.translate};rotate:${p.rotate};scale:${p.scale}">
        <img src="https://images.unsplash.com/${photo}?w=800&h=600&fit=crop" alt="">
        <div class="card-content"><h2>${title}</h2><p>${copy}</p></div>
      </div>
    </interact-element>`);
});

const effects = CARDS.map((_, idx) => {
  const i = idx + 1;
  const s = START + STEP * idx;              // one arithmetic ladder (5)
  return {
    key: `card-${i}`,
    keyframeEffect: { name: `card-${i}-fly-in`, keyframes: [launch(i), rest(i)] },
    rangeStart: { name: 'cover', offset: { value: s,       unit: 'percentage' } },
    rangeEnd:   { name: 'cover', offset: { value: s + DUR, unit: 'percentage' } },
    easing: 'ease-out',
    fill: 'both',
  };
});

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