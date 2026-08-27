# Task

Apply **Window Scroll** to this section: six full-viewport panels held in a pinned frame, each one tipping in from above, holding square-on, then tipping away below as the next arrives — one panel per equal slice of a long scroll runway.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The demo's 3D is not on screen — do not preserve it as 3D.** Measured over
   9 scroll stops, painted/layout width was **1.00× on every panel at every
   stop**. The source's `perspective(1000px)` sits *inside* each keyframe's own
   `transform`, before `rotateX`/`translateZ`, and produces no measurable
   foreshortening; the `perspective: 1000px` + `preserve-3d` on the sticky
   container are inert because nothing paints wider than its box. What the
   viewer actually gets is a vertical-axis squash plus a fade. Reproduce
   *that* — a tip-in/tip-out with opacity — and do not spend adaptation effort
   restoring a projection the original never showed.

2. **The four keyframes are a hold, not an ease.** `0 → 0.33` is the arrival,
   `0.33 → 0.66` is a dead-flat plateau at identity, `0.66 → 1` is the
   departure. Collapsing to two keyframes destroys the animation: the panel
   would never be still, so no panel is ever readable. Keep four, keep
   `easing: linear` — the shape lives in the offsets, not in a timing function.

3. **Adjacent panels cross-fade because their ranges abut, not overlap.** Panel
   *i* spans `contain` `(i−1)·100/N` → `i·100/N`. At the boundary the outgoing
   panel is at its offset-1 keyframe (`opacity: 0`) and the incoming one at its
   offset-0 keyframe (`opacity: 0`), so there is one instant with **nothing
   visible**. That is the intended beat; do not "fix" it by overlapping the
   ranges — overlapping puts two panels at partial opacity in the same stacking
   position and both become unreadable.

4. **`contain` is the whole pinned phase, and that is why the slices are even.**
   The runway is `1200vh` with a `100vh` sticky child, so `contain` spans
   exactly the 1100vh of travel during which the panel is pinned. Splitting that
   range into N equal percentage slices is what makes each panel's dwell equal;
   split any other range and the first and last panels get shorter turns.

5. **Panels stack by claiming the same box, not by z-index.** Every panel is
   `position: absolute; inset: 0`, so all six occupy the pinned frame
   identically and only opacity decides which is seen. On a Wix section the
   equivalent is the same grid area (house rules, Geometry) — but note the
   panels here have no z-index at all: DOM order is the tiebreak, and since only
   one panel is ever above `opacity: 0`, that never matters.

6. **Rest state must be `opacity: 0`, and `fill: both` is what makes that hold.**
   Every panel rests hidden; with `fill: both` each effect back-fills its
   offset-0 pose from timeline creation, so panels 2–6 sit at `opacity: 0`
   before their turn instead of flashing in. Panel 1's offset-0 pose *is* the
   rest pose, so the first paint is stable.

7. **The runway is a function of N** — `N · 200vh` at the demo's ratio
   (6 → 1200vh). Change the panel count and the runway must change with it, or
   each panel's dwell shrinks and the plateau in (2) stops being long enough to
   read.

## Check before committing numbers

- Each panel's readable plateau is `(runway − 100vh) · (0.66 − 0.33) / N`. At
  N = 6 and 1200vh that is ~60vh of scroll standing still — keep it above
  ~40vh or the hold reads as a pause-free crossfade.
- `runway` must exceed the pinned child's height, or `contain` has zero length
  and nothing animates (house rules, Scroll timing).
- The tip angle is a squash, not a rotation in depth: at 45° the panel's painted
  height is what changes, so a panel whose content is a tall copy block will
  compress its lines. Size the copy against the squashed height, not the flat
  one.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Scroll Length | 1200 vh | wrapper `height` |
| Frame Height | 100 vh | sticky container `height` |
| Tip Angle | 45 deg | `rotateX` magnitude — re-templates the keyframes |
| Depth Travel | 500 px | `translateZ` magnitude — re-templates the keyframes |
| Hold Fraction | 0.33 | the inner two keyframe `offset`s (`h`, `1 − h`) |

Expose the **geometric inputs**, never values derived from them: no control for
the per-panel range slice (it follows N), no control for the panel count itself
(it is the section's item count, not a knob), and no separate control for the
departure angle — it is the negation of Tip Angle, and letting the two disagree
breaks the symmetry the plateau depends on.

Tip Angle and Depth Travel are both **baked into the keyframes** — they live
inside `transform`, so those controls must re-template all four keyframes rather
than set a variable. Hold Fraction rewrites keyframe *offsets*, which is the
same obligation.

## Reference defaults (N = 6) — inputs, not constants

Runway 1200vh · frame 100vh sticky at `top: 0` · tip 45deg · depth 500px ·
keyframe offsets 0 / 0.33 / 0.66 / 1 · opacity 0 → 1 → 1 → 0 ·
`viewProgress` on the wrapper, `contain` sliced into 6 spans of 16.67%
(0–16.67, 16.67–33.33, 33.33–50, 50–66.67, 66.67–83.33, 83.33–100),
`easing: linear`, `fill: both`.

`overflow: clip` on the sticky container (never `hidden`). Panels
`position: absolute; inset: 0; width: 100%; height: 100%` — on a Wix section
they instead claim one shared `grid-column`/`grid-row`, plus `margin: 0`,
`max-width`/`max-height: none` (all `!important` — structural) to escape the
grid, and the wrapper needs a trailing `1fr` row to absorb the runway growth.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Window Scroll</title>
<style>
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; display: grid; place-items: center; text-align: center; }

  /* Runway. Its height minus the pinned child's height IS the `contain` range. */
  #scroll-wrapper { height: 1200vh; position: relative; }

  /* Pinned frame. clip, never hidden — hidden kills ViewTimeline.
     perspective/preserve-3d are deliberately ABSENT: measured painted/layout
     width was 1.00x everywhere, so they were doing nothing. See note (1). */
  .sticky-container {
    position: sticky; top: 0; height: 100vh; width: 100%;
    overflow: clip;
  }

  /* All six panels claim the same box; only opacity picks the visible one.
     opacity: 0 is the rest pose and equals every panel's keyframe 0. */
  .panel {
    position: absolute; inset: 0; width: 100%; height: 100%;
    display: grid; place-items: center;
    opacity: 0;
    padding: 2rem; box-sizing: border-box; text-align: center;
    font-size: clamp(2rem, 6vw, 5rem);
  }
</style>
</head>
<body>

<section class="spacer"><h1>Scroll down to begin...</h1></section>

<interact-element data-interact-key="scroll-wrapper">
  <div id="scroll-wrapper">
    <div class="sticky-container">
      <!-- panels injected here -->
    </div>
  </div>
</interact-element>

<section class="spacer"><h1>You've reached the end.</h1></section>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different panel count.
const PANELS = ['Panel One', 'Panel Two', 'Panel Three', 'Panel Four', 'Panel Five', 'Panel Six'];
const N = PANELS.length;
const TIP = 45;        // deg, rotateX magnitude at arrival / departure
const DEPTH = 500;     // px, translateZ magnitude
const HOLD = 0.33;     // inner keyframe offsets: HOLD and 1 - HOLD
const RUNWAY = 1200;   // vh; ~N * 200 at this ratio
const FRAME = 100;     // vh, the pinned child

// The readable plateau must stay long enough to actually read.
const plateau = (RUNWAY - FRAME) * (1 - 2 * HOLD) / N;
console.assert(plateau > 40, 'hold too short: ' + plateau.toFixed(1) + 'vh');
console.assert(RUNWAY > FRAME, 'no contain range');

const stage = document.querySelector('.sticky-container');
PANELS.forEach((label, i) => {
  // Rest pose === keyframe 0 (opacity 0, tipped back) — no first-paint flash.
  stage.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="panel-${i}">
      <div class="panel" style="transform:rotateX(${TIP}deg) translateZ(${-DEPTH}px)">${label}</div>
    </interact-element>`);
});

// Four keyframes: arrive, hold flat, hold flat, depart. The plateau is the
// animation — collapsing to two keyframes removes it. See note (2).
const keyframes = [
  { offset: 0,        opacity: 0, transform: `rotateX(${TIP}deg) translateZ(${-DEPTH}px)` },
  { offset: HOLD,     opacity: 1, transform: 'rotateX(0deg) translateZ(0px)' },
  { offset: 1 - HOLD, opacity: 1, transform: 'rotateX(0deg) translateZ(0px)' },
  { offset: 1,        opacity: 0, transform: `rotateX(${-TIP}deg) translateZ(${DEPTH}px)` },
];

// Abutting, not overlapping, slices of `contain` — the whole pinned phase.
const slice = 100 / N;
const effects = PANELS.map((_, i) => ({
  key: `panel-${i}`,
  keyframeEffect: { name: `panel-${i}-window`, keyframes },
  rangeStart: { name: 'contain', offset: { unit: 'percentage', value: +(i * slice).toFixed(2) } },
  rangeEnd:   { name: 'contain', offset: { unit: 'percentage', value: +((i + 1) * slice).toFixed(2) } },
  easing: 'linear',
  fill: 'both',
}));

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: 'scroll-wrapper', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>
```