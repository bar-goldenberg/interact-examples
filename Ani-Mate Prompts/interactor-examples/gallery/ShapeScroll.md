# Task

Apply **Shape Scroll** to this section: a stack of full-viewport image panels where each successive panel opens over the one below it through a circular hole that grows from nothing to full-bleed as you scroll.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The reveal is one panel clipping open over the previous one — not a crossfade or a slide.** Every panel is `position: sticky` at the same offset and `z-index: i`, so all N occupy the same pinned rectangle; only `clip-path: circle(r at center)` decides which is visible. Panel `i`'s circle growing to 80% erases panel `i−1` completely, so the stack never needs to hide anything: the topmost fully-opened panel *is* the visible one.

2. **Each reveal is driven by a separate zero-height trigger element, not by the panel's own range.** A `.trigger-area` is an absolutely-positioned invisible strip inside the runway; its `cover` 0→100% is the window during which panel `i` opens. This is what makes the stagger *absolute* rather than rate-dependent — every panel uses the identical `cover` 0→100% range, and the schedule lives entirely in where its trigger sits in the runway. A sticky panel's own `cover` range would be useless here (it is pinned, so it never traverses the viewport at a rate you can key off).

3. **`clip-path` radius interpolates only between the same shape function.** `circle(0% at center)` → `circle(80% at center)` interpolates; `circle(...)` → `inset(...)` or `circle(0%)` → `circle(80% at 30% 70%)` does not (the position must also match, or it snaps). Keep the shape and the `at` position byte-identical in both keyframes and vary only the radius.

4. **`circle(80% at center)` is full-bleed, not 80% of the box.** For `circle()` a percentage radius resolves against `sqrt(w² + h²)/sqrt(2)`, so on a 100vw × 100vh panel the radius reaching every corner is ~70.7%. 80% is a deliberate ~13% overshoot so the last few percent of scroll has no visible edge creeping in. If the target panel is much wider than tall, recompute: the corner radius is `sqrt(w² + h²)/2 / (sqrt(w² + h²)/sqrt(2)) = 70.7%` regardless of aspect — the overshoot is what buys the margin, so keep ≥ 75%.

5. **N panels need only N−1 triggers.** Panel 1 is the rest state — it is never clipped and carries no effect. Wiring a trigger to it would leave the section blank before its range starts.

6. **The runway length and the trigger positions are one input, not two.** Triggers sit at `top: 25% + (i−2)·12.5%` of an 800vh runway with `height: 6.25%` — i.e. each reveal consumes 50vh of scroll and the gaps between reveals are 100vh. Restating them as separate controls lets a panel's reveal start before the previous one finished. Derive both from `runway` and `N`.

7. **The motion is purely 2D.** Measured over 9 scroll stops, painted/layout width was exactly 1× on every trigger and every panel — there is no perspective, no scale, nothing foreshortened. Do not add `perspective`, `preserve-3d`, or `transform-style` when adapting; there is nothing to project.

8. **`overflow: clip` on the panel, not on the section** (ladder rung 2 re-hosting): the panel is both the clip host and the sticky element, and its content must not spill while the circle is small. The runway itself must stay unclipped so the ViewTimeline survives.

## Check before committing numbers

- Reveal windows must not overlap: `triggerHeight% + gap%` per step, i.e. `(N−1)·stepPercent ≤ 100% − firstTop%`. At N = 6: `5 × 12.5% = 62.5%`, first top `25%` → last trigger ends at `81.25%` of the runway, leaving 18.75% (150vh) of settled tail. Keep a tail.
- Every trigger's `cover` window is `triggerHeight + 100vh` of scroll, because `cover` spans from the strip entering the viewport to leaving it. At `6.25%` of 800vh that is `50vh + 100vh = 150vh` per reveal — so a reveal is 3× longer than its strip suggests. Size the runway against `N × 150vh`, not `N × 50vh`.
- The last panel must finish opening while the section is still on screen: `firstTop% + (N−2)·step% + triggerHeight%` must leave ≥ 100vh of runway after it.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Runway Length | 800 vh | section `height` |
| Panel Width | 100 (vw) | `--pw` → panel `width` |
| Panel Height | 100 (vh) | `--ph` → panel `height` |
| Reveal Radius | 80 % | both keyframes' `clipPath` radius (end value) |
| Reveal Window | 6.25 % | each `.trigger-area` `height` |

Expose the **geometric inputs**, never values derived from them: no control for
the sticky `top` (it is `(100 − panelHeight)/2` vh, so a second control would let
the panel drift off-centre), no control for a trigger's `top` (it is
`firstTop + (i−2)·step`, derived from the reveal window and N), no control for
`z-index` (it is the panel's index), and no control for the reveal *duration* —
that is the trigger height read through `cover`, already the Reveal Window
control.

**Reveal Radius is baked into the keyframes**, not read from a variable:
`clipPath` is the animated property itself, so this control must re-template
keyframe 100% of every panel's effect. It cannot be a `var()` — see the house
rules on `var()` in WAAPI keyframes.

## Reference defaults (N = 6) — inputs, not constants

Runway 800vh · panel 100vw × 100vh · sticky `top: calc((100 − ph) · 0.5vh)` = 0
at ph = 100 · reveal `circle(0% at center)` → `circle(80% at center)` ·
`viewProgress`, `cover` 0→100%, `easing: linear`, `fill: both` · triggers at
`top: 25 / 37.5 / 50 / 62.5 / 75%`, all `height: 6.25%` · panels `z-index: 1…6`.
Measured travel per element: 352px across the sweep, painted/layout width 1×
everywhere.

Structural CSS the target will need to escape the Wix grid: each panel gets
`position: sticky !important`, `grid-area: 1 / 1 !important` (all panels claim
the same cell so they overlap without absolute positioning — house rules,
Geometry), `margin: 0 !important`, `max-width: none !important`,
`overflow: clip !important`. The trigger strips have no Wix analogue: re-host
them onto whatever zero-content elements the section already has, or — since no
DOM may be created — collapse to one `viewProgress` interaction on the section
with per-panel `rangeStart`/`rangeEnd` offsets standing in for the trigger tops
(`cover` `firstTop + (i−2)·step` → `+ step/2`), which reproduces the identical
schedule from the same two inputs.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Shape Scroll</title>
<style>
  body { margin: 0; background: #0b0b10; color: #fff; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  :root { --pw: 100; --ph: 100; }

  /* The runway. Its height is the ONLY source of scroll for every reveal.
     Deliberately NOT clipped — overflow != visible would kill the ViewTimeline. */
  .animation-section { position: relative; width: 100%; height: 800vh; }

  /* Invisible zero-content strips. Their position in the runway IS the stagger
     schedule -- see mechanism note (2), (6). */
  .trigger-area { position: absolute; left: 0; width: 100%; pointer-events: none; }

  /* Every panel pins at the same offset and claims the same space, so the stack
     overlaps with no absolute positioning. z-index picks the order. */
  .content-panel {
    position: sticky;
    top: calc((100 - var(--ph)) * 0.5vh);
    width: calc(var(--pw) * 1vw);
    height: calc(var(--ph) * 1vh);
    margin: 0 auto;
    display: flex; align-items: flex-end; justify-content: center;
    overflow: clip;               /* clip host == sticky element, note (8) */
  }
  .content-panel img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }

  /* Copy over media needs a scrim; it is the same photo for every panel. */
  .content-panel::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .panel-copy { position: relative; z-index: 2; text-align: center; padding: 0 1rem 12vh; }
  .panel-copy h2 { margin: 0 0 .4rem; font-size: 2.4rem; }
  .panel-copy p  { margin: 0; font-size: .9rem; color: rgba(255,255,255,.75); }
</style>
</head>
<body>

<div class="spacer"></div>

<main class="animation-section"><!-- triggers + panels injected here --></main>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants -- re-derive for a different panel count or runway.
const N          = 6;      // panels; only N-1 get a trigger (note 5)
const RADIUS     = 80;     // %, end radius. 70.7% just reaches the corners.
const WINDOW_PCT = 6.25;   // % of runway per trigger strip
const FIRST_TOP  = 25;     // % of runway where the first reveal begins
const STEP       = 12.5;   // % of runway between successive reveals

// Reveals must not overlap, and the last must land with runway left over.
const lastEnd = FIRST_TOP + (N - 2) * STEP + WINDOW_PCT;
console.assert(lastEnd <= 100, 'reveal schedule overruns the runway');
console.assert(STEP >= WINDOW_PCT, 'reveal windows overlap');
console.log('settled tail:', (100 - lastEnd).toFixed(2) + '% of runway');

const PANELS = [
  ['Ground level',   'This is the starting point.',  'photo-1506744038136-46273834b3fb'],
  ['First opening',  'Revealed by scrolling.',       'photo-1469474968028-56623f02e42e'],
  ['Deeper in',      'And another one.',             'photo-1501785888041-af3ef285b470'],
  ['Halfway',        'Keep scrolling...',            'photo-1470071459604-3b5ec3a7fe05'],
  ['Nearly through', 'Almost there.',                'photo-1519681393784-d120267933ba'],
  ['Daylight',       'The final reveal.',            'photo-1441974231531-c6227db76b6e'],
];

const clip = r => `circle(${r}% at center)`;
const main = document.querySelector('.animation-section');

// Triggers: one per revealed panel, i = 2..N.
for (let i = 2; i <= N; i++) {
  main.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="trigger-${i}">
      <div class="trigger-area"
           style="top:${FIRST_TOP + (i - 2) * STEP}%;height:${WINDOW_PCT}%"></div>
    </interact-element>`);
}

// Panels. Rest pose === keyframe 0: panel 1 open, the rest at circle(0%).
PANELS.forEach(([title, copy, photo], idx) => {
  const i = idx + 1;
  main.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="container-${i}">
      <div class="content-panel"
           style="z-index:${i};clip-path:${i === 1 ? clip(RADIUS) : clip(0)}">
        <img src="https://images.unsplash.com/${photo}?w=1600&h=1000&fit=crop" alt="">
        <div class="panel-copy"><h2>${title}</h2><p>${copy}</p></div>
      </div>
    </interact-element>`);
});

// Same range for every reveal -- the schedule is the trigger's position only.
const interactions = [];
for (let i = 2; i <= N; i++) {
  interactions.push({
    key: `trigger-${i}`,
    trigger: 'viewProgress',
    effects: [{
      key: `container-${i}`,
      keyframeEffect: {
        name: `reveal-circle-${i}`,
        keyframes: [{ clipPath: clip(0) }, { clipPath: clip(RADIUS) }],
      },
      rangeStart: { name: 'cover', offset: { unit: 'percentage', value: 0 } },
      rangeEnd:   { name: 'cover', offset: { unit: 'percentage', value: 100 } },
      easing: 'linear',
      fill: 'both',
    }],
  });
}

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```