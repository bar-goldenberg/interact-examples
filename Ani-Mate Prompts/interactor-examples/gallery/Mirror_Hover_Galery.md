# Task

Apply the **Mirror Hover Gallery** to this section: a grid of cards where the
hovered card lifts above its neighbours — it scales up slightly, darkens under a
tinted overlay, and its title and subtitle rise into view.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The hover host and the scaled element must be different elements.** The
   `interact-element` is the hover target and carries `overflow: clip`; the
   `.card-inner` inside it is what scales. If you scale the hover host itself,
   the growing box re-enters/leaves its own hover region at the edges and the
   `alternate` effect chatters. Every effect here therefore fires off the card
   key with a `selector` — nothing animates the keyed element itself except the
   `z-index` transition.

2. **`z-index: 10` is a 0ms transition, not a keyframe, and it is the only
   effect with no `selector`.** It writes to the keyed element because that is
   the grid item — a `z-index` on `.card-inner` would be scoped to a stacking
   context that does not include the siblings it must beat. 0ms means it applies
   the instant hover starts and reverts the instant it ends, so the raised card
   is never fighting the 300ms scale for paint order. The overlap it protects is
   real: `scale(1.05)` on a 180px-tall card grows it 9px past its own row.

3. **Four effects, one trigger, three of them `triggerType: 'alternate'`** —
   alternate is what plays the same keyframe list backwards on hover-out, so
   there is no second "leave" effect and no explicit rest keyframe.

4. **Rest pose lives in CSS, keyframes hold only the hovered end.** Each
   keyframe list is a *single* frame (`scale(1.05)`, `opacity: 1 / translateY(0)`)
   with `fill: 'both'`, so the browser fills keyframe 0 from the computed style.
   That is why `.card-content` must declare `opacity: 0; transform: translateY(10px)`
   in CSS and `.card-overlay` must declare a transparent `background` — an
   overlay with no authored `background` has nothing for the transition to
   interpolate from and it snaps.

5. **The overlay is a separate box, not a `filter` on the card.** A `filter` on
   the card creates a containing block and dims the copy along with the photo;
   here the copy sits at `z-index: 2` *above* the `z-index: 1` overlay, so it
   gets brighter as the image gets darker. Keep that ordering or the reveal
   fights the dim.

6. **Nothing about this is scroll-driven, and it is invisible to a scroll probe.**
   Measured over 9 scroll stops in a real browser, all six cards read STATIC,
   0px travel. That is correct behaviour, not a broken demo — the only trigger is
   `hover`. Verify it with a synthetic pointer, never a scroll sweep.

7. **Painted width equals layout width everywhere (1×) — there is no 3D here.**
   Do not add `perspective`, `preserve-3d`, or `will-change`; the motion is a
   flat 2D scale and a translate, and `will-change` would pin the raster of a
   box that is about to be magnified 1.05× (blurry copy for nothing).

8. **The demo's grid is deliberately wider than its item span.** 8 columns with
   6 cards leaves the last two columns empty, which is what makes it a *layout*
   the target replaces rather than copies — take the column count from the
   section (ladder rung 6), not from here.

## Check before committing numbers

- The scaled card must not collide with its neighbour:
  `gap > cardHeight·(scale − 1)` and `gap > cardWidth·(scale − 1)`. At
  180px × 1.05 the vertical overhang is 9px, comfortably inside the 40px gap; a
  gapless Wix grid needs the scale dropped or it will overlap regardless of
  `z-index`.
- The card must be able to raise itself: the keyed element needs to be a
  positioned grid item (`position: relative`) for `z-index: 10` to mean
  anything. If the section wraps cards in something that already establishes a
  stacking context, the raise stops at that wrapper.
- Overlay opacity and text contrast must hold at the *midpoint* of the 300ms,
  not just the ends — the copy is fading in over an overlay that is only half
  dark.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Hover Scale | 1.05 | `.card-inner` keyframe `transform` |
| Overlay Darkness | 0.45 | the transition's `background` alpha |
| Text Rise | 10 px | `.card-content` rest `transform: translateY()` |
| Duration | 300 ms | every effect's `duration` (the 0ms z-index one excluded) |
| Grid Gap | 40 px | container `gap` |

Expose the **geometric inputs**, never values derived from them: no control for
the `z-index` value (it only has to beat 1 — a slider invites a number that
loses to a Wix layer), no control for the text's end pose (it is always
`opacity: 1 / translateY(0)`, i.e. the rest state minus Text Rise), no separate
control for the leave duration (`alternate` reuses the enter duration), and no
easing control per effect (all four share `ease-out`).

**Hover Scale is baked into the keyframes** — it lives inside
`transform: scale(...)`, so that control must re-template the `.card-inner`
keyframe, not set a variable. **Text Rise is the mirror case**: its value lives
in the CSS *rest* pose, and because keyframe 0 is filled from the computed
style, changing it re-aims the animation without touching a keyframe at all.

## Reference defaults (N = 6) — inputs, not constants

Hover scale 1.05 · overlay `rgba(0,0,0,0.45)` · text rise 10px → 0 with
opacity 0 → 1 · duration 300ms `ease-out` on all three animated effects ·
`z-index: 10` at 0ms · trigger `hover`, `triggerType: 'alternate'`,
`fill: 'both'` · grid 8 columns × 180px rows, gap 40px (4 columns ≤1200px,
2 columns ≤800px).

Each card's keyed element needs `position: relative` and `overflow: clip`
(never `hidden`) so the 1.05× inner is cropped to the card. On a Wix section the
cards will already be grid items: keep their `grid-area`, add
`position: relative !important` and `overflow: clip !important` (structural, so
`!important` is allowed) and put the scale on an inner wrapper the card already
has — a `.richTextContainer`, a media wrapper, anything (ladder rung 2/3). Never
`!important` the animated `transform`, `opacity` or `background`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mirror Hover Gallery</title>
<style>
  body { margin: 0; padding: 40px; overflow-x: hidden;
         background: #0f0f14; color: #eee; font-family: system-ui, sans-serif; }

  .grid-container {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    grid-auto-rows: 180px;
    gap: 40px;                 /* must exceed 180 * (scale - 1) = 9px */
  }
  @media (max-width: 1200px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width:  800px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }

  /* The keyed element is the hover host AND the grid item: it must be
     positioned for z-index: 10 to mean anything, and it clips the 1.05x
     inner. clip, never hidden. It is never itself scaled — see note (1). */
  interact-element {
    display: block; position: relative; overflow: clip;
    width: 100%; height: 100%;
  }

  .card-inner { width: 100%; height: 100%; position: relative; }

  .card-bg { position: absolute; inset: 0; background-size: cover; background-position: center; }

  /* Separate box, not a filter on the card: the copy sits ABOVE it. Needs an
     authored transparent background or the transition has nothing to
     interpolate from. */
  .card-overlay { position: absolute; inset: 0; z-index: 1; background: rgba(0,0,0,0); }

  /* Rest pose = keyframe 0, filled from the computed style — note (4). */
  .card-content {
    position: absolute; bottom: 12px; left: 12px; right: 12px;
    opacity: 0; transform: translateY(10px);
    z-index: 2; pointer-events: none;
  }
  .card-content h3 { margin: 0 0 3px; font-size: 1.05rem; }
  .card-content p  { margin: 0; font-size: .75rem; color: rgba(255,255,255,.8); }
</style>
</head>
<body>

<section class="grid-container"><!-- cards injected here --></section>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants.
const HOVER_SCALE = 1.05;
const OVERLAY     = 'rgba(0,0,0,0.45)';
const TEXT_RISE   = 10;    // px, declared in CSS as the rest pose
const DURATION    = 300;   // ms
const GAP         = 40;    // px
const ROW_H       = 180;   // px

// The scaled card must stay inside the gap, or z-index only hides a collision.
console.assert(GAP > ROW_H * (HOVER_SCALE - 1), 'gap too small for hover scale');

const CARDS = [
  ['Title 1', 'Subtitle for card 1', 'photo-1506744038136-46273834b3fb'],
  ['Title 2', 'Subtitle for card 2', 'photo-1469474968028-56623f02e42e'],
  ['Title 3', 'Subtitle for card 3', 'photo-1501785888041-af3ef285b470'],
  ['Title 4', 'Subtitle for card 4', 'photo-1470071459604-3b5ec3a7fe05'],
  ['Title 5', 'Subtitle for card 5', 'photo-1519681393784-d120267933ba'],
  ['Title 6', 'Subtitle for card 6', 'photo-1441974231531-c6227db76b6e'],
];

const grid = document.querySelector('.grid-container');
CARDS.forEach(([title, sub, photo], i) => {
  grid.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i + 1}">
      <div class="card-inner">
        <div class="card-bg" style="background-image:url(https://images.unsplash.com/${photo}?w=480&h=360&fit=crop)"></div>
        <div class="card-overlay"></div>
        <div class="card-content"><h3>${title}</h3><p>${sub}</p></div>
      </div>
    </interact-element>`);
});

// One trigger per card, four effects. Only the z-index one is unselectored:
// it must land on the grid item itself — see note (2).
const interactions = CARDS.map((_, idx) => {
  const i = idx + 1;
  return {
    key: `card-${i}`,
    trigger: 'hover',
    effects: [
      {
        selector: '.card-inner',
        keyframeEffect: {
          name: `card-zoom-${i}`,
          keyframes: [{ transform: `scale(${HOVER_SCALE})` }],
        },
        duration: DURATION, easing: 'ease-out', fill: 'both',
        triggerType: 'alternate',
      },
      {
        selector: '.card-overlay',
        transition: {
          duration: DURATION, easing: 'ease-out',
          styleProperties: [{ name: 'background', value: OVERLAY }],
        },
      },
      {
        selector: '.card-content',
        keyframeEffect: {
          name: `text-reveal-${i}`,
          keyframes: [{ opacity: 1, transform: 'translateY(0)' }],
        },
        duration: DURATION, easing: 'ease-out', fill: 'both',
        triggerType: 'alternate',
      },
      {
        // No selector: raises the grid item above its siblings, instantly.
        transition: { duration: 0, styleProperties: [{ name: 'zIndex', value: '10' }] },
      },
    ],
  };
});

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```