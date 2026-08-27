# Task

Apply **Accordion Scroll Horizontal** to this section: a row of image panels where hovering one expands it and its title/subtitle fade up from the bottom.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The hit area is a separate, non-animating box from the panel that grows.** `.feature-hit-area` keeps the flex slot at the default width; `.feature-column` is `position: absolute; inset: 0` inside it and is the thing whose `width` animates. Without that split the flex line reflows on every hover — neighbours shift, the pointer leaves the element mid-animation, and the `alternate` hover effect ping-pongs. The expanded panel overflows its slot and covers the neighbour instead (`z-index: 10` in keyframe 1, `z-index: 1` at rest).

2. **The expansion animates a layout property, not a transform.** Measured travel is **133px** on every panel and **painted/layout width ratio 1× at every scroll stop** — the box is genuinely resized, so `object-fit: cover` re-crops the photo rather than stretching it. Do not substitute `scaleX`: it distorts the image and the copy.

3. **Two interactions per panel, one per breakpoint, differing only in axis.** Mobile grows `max-height` (25vh → 75vh) on a column flex; desktop grows `width` (default → open) on a row flex. Same trigger, same easing, same duration, same `reveal` on the text — only the property changes. Pick the axis from the target's flex direction; do not ship both unless the target really is responsive.

4. **The hover fires on the panel, the reveal fires on the text — one trigger, two keys.** A single `hover` interaction keyed to `col-i` lists effects on `col-i` (with `selector: '.feature-column'`) *and* on `txt-i`. The text needs its own key because it must animate independently and, importantly, must not inherit the panel's clip.

5. **`triggerType: 'alternate'` is what makes hover-out reverse.** Both effects use it, so pointer-out plays the same keyframes backwards at the same duration — no separate leave effect, and no jump if the pointer leaves mid-expansion.

6. **The reveal's 150ms delay is deliberate sequencing, not polish.** The panel is 600ms and the copy is 400ms starting at 150ms, so the copy lands ~150ms before the panel finishes — the title arrives into an already-widening frame instead of racing it. The title is `white-space: nowrap`, so at the default width it is clipped by the panel's `overflow: clip` and only becomes fully readable as the panel opens.

7. **The panel's rest pose must match keyframe 0 on both axes.** `.feature-column` carries the default `width` and `max-height` in CSS, and `.feature-text-group` carries `opacity: 0; transform: translateY(20px)` — the same values as each effect's first keyframe.

8. **Keyboard reach comes free from `tabindex="0"` on the panel** — the hover trigger also responds to focus, so the accordion is operable without a pointer. Nothing else in the demo provides this.

## Check before committing numbers

- The row must not scroll horizontally at rest: `N · defaultWidth + (N−1) · gap ≤` the section's content width. At N = 6, 220px, 1rem gap that is `6·220 + 5·16 = 1400px`.
- One panel opens while the others hold, so peak painted width is `openWidth + (N−1)·defaultWidth + (N−1)·gap`. The overflow lands on the neighbour, so the section needs `overflow: clip` (never `hidden`) or the page gains a scrollbar on hover.
- `openWidth > defaultWidth` by enough to reveal the `nowrap` title: measure the title's intrinsic width and require `openWidth ≥ titleWidth + 2 · 1.5rem` of inset padding.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Panel Width | 220 px | `.feature-hit-area` width + keyframe 0 `width` |
| Open Width | 600 px | keyframe 1 `width` |
| Panel Height | 80 vh | `.feature-container` height |
| Panel Speed | 600 ms | expand effect `duration` |
| Reveal Travel | 20 px | reveal keyframe 0 `translateY` + text rest pose |

Expose the **geometric inputs**, never values derived from them: no control for
the reveal duration or its delay (both follow Panel Speed — `400/speed`,
`150/speed`), no control for the mobile `max-height` pair (it is the vertical
form of Panel Width / Open Width), and no control for `z-index` (it follows the
expand keyframes).

Panel Width is the awkward one: it appears both as CSS on the hit area and as
keyframe 0 of `h-expand`, so that control must re-template the keyframes as well
as set the width — a variable alone leaves the animation starting from the old
value. Reveal Travel has the same shape: it is inside `transform`, so it is baked
into the reveal keyframes.

## Reference defaults (N = 6) — inputs, not constants

Panel 220px → 600px open · container 80vh tall · gap 1rem · expand 600ms
`cubic-bezier(0.22, 1, 0.36, 1)` `fill: both` · reveal 400ms delay 150ms
`ease-out` `fill: both` · `translateY(20px) → 0`, `opacity: 0 → 1` ·
`triggerType: 'alternate'` on both · mobile axis `max-height: 25vh → 75vh`.

Hit area `flex-shrink: 0`; panel `position: absolute; inset: 0; overflow: clip;
z-index: 1`; text group `position: absolute; bottom/left/right: 1.5rem;
z-index: 10; pointer-events: none`; image `pointer-events: none` so the pointer
never leaves the panel over its own photo. On a Wix section each panel also needs
`grid-area: auto`, `margin: 0`, `max-width: none` (all `!important` —
structural) to escape the grid, and `overflow: clip` belongs on the section, not
on the container.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Accordion Scroll Horizontal</title>
<style>
  html, body { margin: 0; padding: 0; overflow-x: hidden; }
  body {
    background: #0b0b10; color: #eee; font-family: system-ui, sans-serif;
    height: 100vh; display: flex; align-items: center; overflow: clip;
  }
  interact-element[data-interact-key^='col-'] { display: contents; }

  .feature-container {
    display: flex; flex-direction: row; height: 80vh; width: auto;
    margin: 0 auto; padding: 1rem 5vw; gap: 1rem; box-sizing: border-box;
  }

  /* The slot never animates — it holds the flex line still. See note (1). */
  .feature-hit-area { width: 220px; height: 100%; flex-shrink: 0; position: relative; }

  /* The box that grows. Rest pose == keyframe 0 of h-expand. */
  .feature-column {
    position: absolute; inset: 0;
    width: 220px; height: 100%;
    overflow: clip; z-index: 1;
  }

  /* Layout resize, not scaleX — cover re-crops instead of stretching. */
  .feature-image { width: 100%; height: 100%; object-fit: cover; pointer-events: none; }

  /* Rest pose == keyframe 0 of reveal. */
  .feature-text-group {
    position: absolute; bottom: 1.5rem; left: 1.5rem; right: 1.5rem;
    opacity: 0; transform: translateY(20px);
    z-index: 10; pointer-events: none;
  }
  .feature-bottom-subtitle { margin: 0 0 .25rem; font-size: .75rem; color: rgba(255,255,255,.75); }
  .feature-bottom-title { margin: 0; font-size: 1.25rem; white-space: nowrap; }
</style>
</head>
<body>

<main class="feature-container"><!-- panels injected here --></main>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different panel count or width.
const PANEL_W = 220, OPEN_W = 600, GAP = 16;
const SPEED = 1;                       // 1 = reference timing
const EXPAND_MS = Math.round(600 / SPEED);
const REVEAL_MS = Math.round(400 / SPEED), REVEAL_DELAY = Math.round(150 / SPEED);
const TRAVEL = 20;                     // px the copy rises
const MOBILE_H = ['25vh', '75vh'];     // vertical form of PANEL_W / OPEN_W

const PANELS = [
  ['Italian Alps',      'Serene Lakes',      'photo-1506744038136-46273834b3fb'],
  ['Arid Climate',      'Vast Deserts',      'photo-1469474968028-56623f02e42e'],
  ['Tropical Paradise', 'Lush Rainforests',  'photo-1501785888041-af3ef285b470'],
  ['Coastal Views',     'Ocean Cliffs',     'photo-1470071459604-3b5ec3a7fe05'],
  ['Metropolitan Area', 'Urban Landscapes', 'photo-1519681393784-d120267933ba'],
  ['Night Sky',         'The Aurora',       'photo-1444703686981-a3abbc4d4fe3'],
];
const N = PANELS.length;

// The row must not scroll at rest; one open panel overflows onto its neighbour.
console.assert(N * PANEL_W + (N - 1) * GAP <= document.documentElement.clientWidth,
  'row wider than the viewport at rest');
console.log('peak painted width', OPEN_W + (N - 1) * PANEL_W + (N - 1) * GAP);

const container = document.querySelector('.feature-container');
PANELS.forEach(([sub, title, photo], i) => {
  const n = i + 1;
  container.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="col-${n}">
      <div class="feature-hit-area">
        <div class="feature-column" tabindex="0">
          <interact-element data-interact-key="txt-${n}">
            <div class="feature-text-group">
              <p class="feature-bottom-subtitle">${sub}</p>
              <h2 class="feature-bottom-title">${title}</h2>
            </div>
          </interact-element>
          <img class="feature-image" src="https://images.unsplash.com/${photo}?w=900&h=1200&fit=crop" alt="">
        </div>
      </div>
    </interact-element>`);
});

const config = {
  effects: {
    // Mobile axis: same mechanism, max-height instead of width.
    'v-expand': {
      keyframeEffect: { name: 'v-exp', keyframes: [
        { maxHeight: MOBILE_H[0] },
        { maxHeight: MOBILE_H[1], zIndex: 10 },
      ]},
      duration: EXPAND_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both',
    },
    'h-expand': {
      keyframeEffect: { name: 'h-exp', keyframes: [
        { width: `${PANEL_W}px` },
        { width: `${OPEN_W}px`, zIndex: 10 },
      ]},
      duration: EXPAND_MS, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'both',
    },
    // Lands ~150ms before the panel settles — see mechanism note (6).
    reveal: {
      keyframeEffect: { name: 't-rev', keyframes: [
        { opacity: 0, transform: `translateY(${TRAVEL}px)` },
        { opacity: 1, transform: 'translateY(0)' },
      ]},
      duration: REVEAL_MS, delay: REVEAL_DELAY, easing: 'ease-out', fill: 'both',
    },
  },
  conditions: {
    mobile:  { type: 'media', predicate: '(max-width: 768px)' },
    desktop: { type: 'media', predicate: '(min-width: 769px)' },
  },
  interactions: PANELS.flatMap((_, i) => {
    const n = i + 1, colKey = `col-${n}`, txtKey = `txt-${n}`;
    // One trigger on the panel, two keys in its effect list — note (4).
    const effects = id => [
      { key: colKey, selector: '.feature-column', effectId: id, triggerType: 'alternate' },
      { key: txtKey, effectId: 'reveal', triggerType: 'alternate' },
    ];
    return [
      { key: colKey, trigger: 'hover', conditions: ['mobile'],  effects: effects('v-expand') },
      { key: colKey, trigger: 'hover', conditions: ['desktop'], effects: effects('h-expand') },
    ];
  }),
};

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);
Interact.create(config);
</script>

</body>
</html>
```