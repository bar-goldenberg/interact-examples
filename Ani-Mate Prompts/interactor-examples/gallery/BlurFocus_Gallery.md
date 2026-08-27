# Task

Apply the **Blur Focus Gallery** to this section: a grid of cards where hovering
one lifts it slightly, darkens its image under a scrim, and slides its caption up
into view — the un-hovered cards stay exactly as the section designed them.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **This is a hover interaction, so a scroll sweep measures nothing.** All six
   cards measured STATIC across 9 scroll stops, painted/layout width exactly 1×
   at every stop — that is the correct reading for a `hover`-triggered
   `transition` with no pointer present, not a broken animation. Nothing here is
   scroll-driven and nothing is 3D; do not add a `perspective` to "fix" it.

2. **Four effects on one key, distinguished only by `selector`.** The `hover`
   interaction targets `card-i` once and fans out to `.card-inner` (lift),
   `.card-overlay` (scrim), `.card-content` (caption), and the keyed element
   itself (z-index). The keyed element is the *mask* — `overflow: clip` lives on
   it, so the scaled `.card-inner` is cropped to the original card box and the
   grid never reflows.

3. **The z-index effect must have `duration: 0` and no `selector`.** It writes
   `zIndex: 999` on the keyed element, and it is what stops a neighbour from
   painting over the lifted card. Interpolating a z-index would swap stacking
   order mid-travel; zero duration makes it a discrete flip on hover-in and
   hover-out. It is the one effect with no visible motion of its own and the
   easiest to drop as "redundant".

4. **The caption's rest pose is `opacity: 0; transform: translateY(10px)`, and
   both must be in the CSS**, because a `transition` effect only supplies the
   hovered endpoint — there is no keyframe 0 here. If the section's caption is
   already opaque at rest, the reveal silently does nothing.

5. **The lift is `transform: scale()` on `.card-inner`, not on the keyed
   element.** Scaling the keyed element would scale its own clip box too, so
   nothing would be cropped and the caption would ride outward with it. Keep the
   mask/content split: mask is keyed and clipped, content scales inside it.

6. **The scrim animates `background`, so its rest value must be an explicit
   transparent colour** of the same form (`rgba(0,0,0,0)`), not `none` or unset —
   a keyword-to-colour transition is not interpolable and the scrim would snap.

7. **Content-stack → media-cover** (ladder rung 4) if the section's cards stack
   an image above copy: the image becomes the `.card-bg` layer at
   `position: absolute; inset: 0`, and heading + paragraph become `.card-content`
   pinned to the bottom over the scrim. Copy over media needs the scrim from the
   design guidelines anyway, which this animation already supplies as its middle
   layer.

## Check before committing numbers

- The scale-up must stay inside the mask: with `scale(S)` on a card of width `W`,
  each edge grows by `W·(S−1)/2` — 8px per side at `S = 1.05`, `W = 320`. That is
  clipped, so it reads as a *push toward the viewer*, not a growth. If the
  section's clip is absent, `S` visibly reflows nothing but overlaps neighbours
  by that amount, which is what the z-index effect exists to make deliberate.
- The caption's 10px rise must be smaller than the caption's own bottom inset
  (12px here), or its rest pose starts below the mask edge and the first frame of
  the reveal appears from outside the card.
- Gap must exceed the lift so the overlap is a deliberate lift, not a collision:
  `gap > W·(S−1)/2`. At 40px gap and 8px growth this holds comfortably.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Hover Scale | 1.05 | `.card-inner` `transform` (hovered endpoint) |
| Scrim Opacity | 0.35 | `.card-overlay` `background` alpha (hovered endpoint) |
| Caption Rise | 10 px | `.card-content` rest `transform: translateY()` |
| Transition Duration | 300 ms | every effect's `duration` (not the z-index effect) |
| Row Height | 180 px | `.grid-container` `grid-auto-rows` |
| Grid Gap | 40 px | `.grid-container` `gap` |

Expose the **geometric inputs**, never values derived from them: no control for
the clipped overflow per side (it follows Hover Scale and card width), no control
for the caption's rest `opacity` (it is 0 by definition of the reveal), no
control for the z-index value (999 is a stacking flag, not a dimension), and no
control for column count (it follows the section's own grid).

**Caption Rise is baked into the CSS rest pose *and* implied by the hovered
endpoint** — the effect writes `translateY(0)`, so the control must re-template
the resting rule, not just the effect. Hover Scale and Scrim Opacity are baked
into their effects' `styleProperties` values and must re-template those strings;
neither is a CSS variable the effect reads.

## Reference defaults (N = 6) — inputs, not constants

Hover scale 1.05 · scrim `rgba(0,0,0,0.35)` from `rgba(0,0,0,0)` · caption rise
10px → 0 with opacity 0 → 1 · duration 300ms `ease` on three effects, 0ms on the
z-index effect · z-index 1 → 999 · grid `repeat(8, 1fr)` at 180px rows, 40px gap,
falling to 4 columns ≤1200px and 2 columns ≤800px · caption inset 12px.

The keyed `<interact-element>` must be the mask, so it needs
`display: block; position: relative; overflow: clip; width: 100%; height: 100%;
z-index: 1` (all `!important` — structural) to act as a grid item and clip its
child inside the Wix grid, plus `grid-area: auto; margin: 0;
max-width/max-height: none` on the card to escape it.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Blur Focus Gallery</title>
<style>
  body { margin: 0; padding: 40px; overflow-x: hidden; background: #0b0b10;
         color: #eee; font-family: system-ui, sans-serif; }

  .grid-container {
    display: grid; grid-template-columns: repeat(8, 1fr);
    grid-auto-rows: 180px; gap: 40px; width: 100%;
  }
  @media (max-width: 1200px) { .grid-container { grid-template-columns: repeat(4, 1fr); } }
  @media (max-width:  800px) { .grid-container { grid-template-columns: repeat(2, 1fr); } }

  /* The keyed element IS the mask: clip crops the scaled inner back to the
     original card box, so the grid never reflows. See note (2), (5). */
  interact-element {
    display: block; position: relative; overflow: clip;
    width: 100%; height: 100%; z-index: 1;
  }

  .card-inner { width: 100%; height: 100%; position: relative; }

  /* Media-cover: image fills the card, copy sits over it. */
  .card-bg { position: absolute; inset: 0; }
  .card-bg img { width: 100%; height: 100%; object-fit: cover; display: block; }

  /* Rest value is an explicit transparent COLOUR, not `none` — note (6). */
  .card-overlay { position: absolute; inset: 0; z-index: 1; background: rgba(0,0,0,0); }

  /* Rest pose of the reveal lives here; a transition effect only supplies the
     hovered endpoint. Rise (10px) < bottom inset (12px). See note (4). */
  .card-content {
    position: absolute; bottom: 12px; left: 12px; right: 12px; z-index: 2;
    opacity: 0; transform: translateY(10px);
  }
  .card-content h3 { margin: 0 0 3px; font-size: 1.05rem; }
  .card-content p  { margin: 0; font-size: .72rem; color: rgba(255,255,255,.75); }
</style>
</head>
<body>

<section class="grid-container"><!-- cards injected here --></section>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for another card size or column count.
const HOVER_SCALE   = 1.05;
const SCRIM_ALPHA   = 0.35;
const CAPTION_RISE  = 10;   // px, must be < the caption's bottom inset (12)
const DURATION      = 300;  // ms
const EASING        = 'ease';
const ROW_H         = 180;  // px, grid-auto-rows
const GAP           = 40;   // px

const CARDS = [
  ['Craft first',     'Every detail measured.',        'photo-1506744038136-46273834b3fb'],
  ['Built to last',   'Materials for the decade.',     'photo-1469474968028-56623f02e42e'],
  ['Always on hand',  'A real person, first ring.',    'photo-1501785888041-af3ef285b470'],
  ['Quietly precise', 'The work speaks before we do.', 'photo-1470071459604-3b5ec3a7fe05'],
  ['No surprises',    'One price, held to the end.',   'photo-1519681393784-d120267933ba'],
  ['Open by default', 'You see what we see.',          'photo-1441974231531-c6227db76b6e'],
];
const N = CARDS.length;

// The lift is clipped, so it reads as depth. Gap must exceed the growth per
// side or the lift becomes a collision. Assumes ~320px cards at 8 columns.
const CARD_W = 320, GROW = CARD_W * (HOVER_SCALE - 1) / 2;
console.assert(GAP > GROW, 'gap smaller than the lift growth');
console.log('clipped growth per side', GROW.toFixed(1) + 'px');

const grid = document.querySelector('.grid-container');
grid.style.gridAutoRows = ROW_H + 'px';
grid.style.gap = GAP + 'px';

CARDS.forEach(([title, copy, photo], i) => {
  grid.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i + 1}">
      <div class="card-inner">
        <div class="card-bg">
          <img src="https://images.unsplash.com/${photo}?w=640&h=400&fit=crop" alt="">
        </div>
        <div class="card-overlay"></div>
        <div class="card-content" style="transform:translateY(${CAPTION_RISE}px)">
          <h3>${title}</h3><p>${copy}</p>
        </div>
      </div>
    </interact-element>`);
});

// Four effects per card on ONE key, separated only by `selector`. The keyless
// z-index effect is duration 0 on purpose — a discrete stacking flip. Note (3).
const interactions = Array.from({ length: N }, (_, n) => {
  const key = `card-${n + 1}`;
  return {
    key, trigger: 'hover',
    effects: [
      { key, selector: '.card-inner', transition: {
          duration: DURATION, easing: EASING,
          styleProperties: [{ name: 'transform', value: `scale(${HOVER_SCALE})` }] } },
      { key, selector: '.card-overlay', transition: {
          duration: DURATION, easing: EASING,
          styleProperties: [{ name: 'background', value: `rgba(0,0,0,${SCRIM_ALPHA})` }] } },
      { key, selector: '.card-content', transition: {
          duration: DURATION, easing: EASING,
          styleProperties: [
            { name: 'opacity',   value: '1' },
            { name: 'transform', value: 'translateY(0)' },
          ] } },
      { key, transition: {
          duration: 0,
          styleProperties: [{ name: 'zIndex', value: '999' }] } },
    ],
  };
});

// Init order: defineInteractElement() -> one frame -> create(). Fails silently
// both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```