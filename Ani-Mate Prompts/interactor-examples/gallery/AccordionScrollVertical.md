# Task

Apply the **Accordion Scroll Vertical** to this section: a stack of full-width image panels, each clipped to a short band; hovering one grows its band and slides a title/subtitle label up into it, and the panel below is pulled up so the stack stays flush.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The negative `margin-bottom` is what keeps the stack from jumping, and it is fully derived.** The panel grows by `OPEN − CLOSED` (50vh − 20vh = 30vh) and the keyframe pulls exactly that much back plus the flex `gap`: `margin-bottom: calc(-30vh - 1.5rem)`. Effect: the panel expands *over* its successor instead of pushing the whole column down. Change either height or the gap and this number is wrong — recompute it, never copy it.

2. **`max-height`, not `height`, is the animated property.** The panel's height comes from its image; `max-height` clips it. Animating `max-height` means an image taller than `OPEN` reveals more of itself and one shorter than `CLOSED` never animates at all — the panel must be tall enough (see checks). `height` would instead stretch the box away from the image.

3. **The label's `transform: translateY(20px)` → `translateY(0)` is a lift into a region that did not exist a moment ago.** The label is `position: absolute; bottom: 1.25rem`, inside `overflow: clip`; at the closed height it is already inside the visible band, so the fade is the reveal and the 20px is only polish. `delay: 200` on a 500ms expand is what makes it read as *revealed by* the growth rather than simultaneous with it — it is a sequencing choice, not a taste one.

4. **Two effects, two elements, one hover — the trigger is on the panel, not the label.** The label has `pointer-events: none`, so it can never be the hover source; the panel's `hover` interaction fans out to both keys. Keep that shape: a label that hovers itself flickers at its own edge.

5. **`triggerType: 'alternate'` is what makes collapse-on-leave work**, and with `fill: 'both'` it is the entire mechanism — there is no second "collapse" effect. Reversal replays the same keyframes backwards at the same duration; an `easing` that is asymmetric therefore reads differently on the way out. `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (easeOutQuad) is deliberately mild for this reason.

6. **`z-index` is animated, and it has to be** — the expanding panel overlaps its neighbour via the negative margin, so it must paint on top. It is in the keyframes (`1 → 10`) alongside `max-height`; `z-index` interpolates as an integer, so it flips mid-scrub, which is invisible here because the overlap only exists once the panel has grown.

7. **The `.feature-column` rest style must already be the closed keyframe** — `max-height: 20vh`, no margin, `z-index: 1` — and the label's rest style must be `opacity: 0; translateY(20px)`. Both are in the demo's CSS. Note that `fill: 'both'` back-fills keyframe 0 from creation, so the CSS rest state is decoration in the steady state but not on the first paint.

8. **This is a hover accordion with no scroll component and no 3D.** Nothing here is scroll-driven despite the name, and there is no `perspective` anywhere — measured, painted/layout width is exactly 1× on all eight elements. Do not add a stage or a runway.

## Check before committing numbers

- The panel must be clippable: intrinsic image height (at the section's width) `>` `OPEN` height, or the expansion stops short of the keyframe and the label lifts into empty space. With `object-fit: cover` and `height: 100%` this holds as long as the box is the constraint.
- Collapse pull-up must be exact: `|marginBottom| = OPEN − CLOSED + gap`. At 4 panels the last one's negative margin hangs past the container, so either the container clips or the section needs `OPEN − CLOSED` of slack below it.
- Total closed height is `N·CLOSED + (N−1)·gap` = 4·20vh + 3·1.5rem ≈ 80vh + 4.5rem; one open panel adds nothing to that total by construction. Size the section against the *closed* stack, not the open one.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Closed Height | 20 vh | panel `max-height` (keyframe 0) |
| Open Height | 50 vh | keyframe 1 `maxHeight` |
| Panel Gap | 1.5 rem | container `gap` |
| Expand Duration | 500 ms | expand effect `duration` |
| Label Delay | 200 ms | label effect `delay` |

Expose the **geometric inputs**, never values derived from them: no control for the negative `margin-bottom` (it is `Open − Closed + Gap`, note 1), none for `z-index` (it follows the overlap), and none for the label's `translateY` or the label duration (both are polish on the delay, note 3).

**Closed Height, Open Height and Panel Gap are all baked into keyframes** — the closed value is keyframe 0's `maxHeight`, and all three appear inside keyframe 1's `marginBottom` calc. Each must re-template both keyframes of `expand-column`, not merely set a CSS variable.

## Reference defaults (N = 4) — inputs, not constants

Closed 20vh · open 50vh · gap 1.5rem · `marginBottom: calc(-30vh - 1.5rem)` · z-index 1→10 · expand 500ms `cubic-bezier(0.25, 0.46, 0.45, 0.94)` · label 400ms `ease-out` `delay: 200` · both `fill: 'both'`, `triggerType: 'alternate'` on `hover`.

Panels are a column flex with `gap`; each panel needs `overflow: clip` (never `hidden`), `position: relative`, and `z-index: 1` so the animated z-index has a stacking context to move within. On a Wix section the panels are grid items, so they need `grid-area: auto`, `margin: 0`, `max-width: none` (all `!important` — structural) plus `max-height` left animatable, and the container needs `display: flex !important; flex-direction: column !important` to become the stack. The source's `@media (max-width: 768px)` variant (25vh closed) is a re-derivation of Closed Height, not a second effect.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Accordion Scroll Vertical</title>
<style>
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif;
         display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  interact-element { display: contents; }

  /* The stack. gap is an input: it is part of the collapse-pull-up formula. */
  .feature-container {
    display: flex; flex-direction: column; gap: 1.5rem;
    width: 100%; max-width: 1100px; margin: 0 auto;
  }

  /* Rest pose === keyframe 0 of expand-column: 20vh, no margin, z-index 1.
     overflow: clip (never hidden) is what makes max-height read as a band. */
  .feature-column {
    position: relative; width: 100%;
    max-height: 20vh; overflow: clip; z-index: 1;
  }
  .feature-column .feature-image { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* Rest pose === keyframe 0 of show-text. pointer-events: none — the panel is
     the hover source, never the label (mechanism note 4). */
  .feature-text-group {
    position: absolute; bottom: 1.25rem; left: 1.25rem; z-index: 10;
    opacity: 0; transform: translateY(20px);
    user-select: none; pointer-events: none;
  }
  .feature-text-group p  { margin: 0 0 .25rem; font-size: .75rem; letter-spacing: .08em;
                           text-transform: uppercase; white-space: nowrap; }
  .feature-text-group h2 { margin: 0; font-size: 1.9rem; white-space: nowrap; }
</style>
</head>
<body>

<div class="feature-container" id="feature-container"><!-- panels injected --></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different panel count, height or gap.
const CLOSED = 20, OPEN = 50, GAP = 1.5;        // vh, vh, rem
const EXPAND_MS = 500, LABEL_MS = 400, LABEL_DELAY = 200;

// The pull-up is derived: grow by (OPEN - CLOSED), take exactly that back plus
// the flex gap, so the stack's total height never changes. Note (1).
const PULL = `calc(${-(OPEN - CLOSED)}vh - ${GAP}rem)`;

const PANELS = [
  ['Italian Alps',       'Serene Lakes',     'photo-1506905925346-21bda4d32df4'],
  ['Arid Climate',       'Vast Deserts',     'photo-1509316785289-025f5b846b35'],
  ['Tropical Paradise',  'Lush Rainforests', 'photo-1516026672322-bc52d61a55d5'],
  ['Coastal Views',      'Ocean Cliffs',     'photo-1505118380757-91f5f5632de0'],
];

const container = document.querySelector('#feature-container');
PANELS.forEach(([sub, title, photo], i) => {
  const n = i + 1;
  container.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="#column-${n}">
      <div id="column-${n}" class="feature-column">
        <interact-element data-interact-key="#text-${n}">
          <div id="text-${n}" class="feature-text-group">
            <p>${sub}</p><h2>${title}</h2>
          </div>
        </interact-element>
        <img class="feature-image" src="https://images.unsplash.com/${photo}?w=1400&h=900&fit=crop" alt="">
      </div>
    </interact-element>`);
});

const effects = {
  // z-index is animated on purpose: the negative margin makes this panel
  // overlap the next one, so it must paint above it. Note (6).
  'expand-column': {
    keyframeEffect: {
      name: 'expand-collapse',
      keyframes: [
        { maxHeight: `${CLOSED}vh`, marginBottom: '0rem', zIndex: 1 },
        { maxHeight: `${OPEN}vh`,   marginBottom: PULL,   zIndex: 10 },
      ],
    },
    duration: EXPAND_MS,
    easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',   // mild: it also plays in reverse
    fill: 'both',
  },
  'show-text': {
    keyframeEffect: {
      name: 'show-hide-text',
      keyframes: [
        { opacity: 0, transform: 'translateY(20px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
    },
    duration: LABEL_MS,
    delay: LABEL_DELAY,     // trails the expand so it reads as revealed by it
    easing: 'ease-out',
    fill: 'both',
  },
};

// One hover per panel, fanning out to the panel and its own label.
// triggerType: 'alternate' is the collapse — there is no second effect.
const interactions = PANELS.map((_, i) => {
  const n = i + 1;
  return {
    key: `#column-${n}`,
    trigger: 'hover',
    effects: [
      { key: `#column-${n}`, effectId: 'expand-column', triggerType: 'alternate' },
      { key: `#text-${n}`,   effectId: 'show-text',     triggerType: 'alternate' },
    ],
  };
});

// Init order: defineInteractElement() -> one frame -> create(). Fails silently
// both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ effects, interactions });
</script>

</body>
</html>
```