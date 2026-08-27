# Task

Apply the **Snake Animation** to this section: images laid out along a sinusoidal wave settle into place one after another as the section enters view, and clicking any of them opens a full-bleed lightbox — dimmed backdrop, enlarged image, copy beside it — which fades away when the backdrop is clicked.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **This is two animations sharing one element set, and only one of them is scroll-visible.** The entrance is `viewEnter` + `triggerType: 'once'`; everything else is `click`. A scroll sweep reports all four keys as moving by at most 14px and never wider than 1× — that is the entrance's own 40px `translateY` sampled after it has already completed, not a scrub. Do not add a runway or a `viewProgress` range: there is no scroll-driven motion here to lengthen.

2. **The wave is layout, not motion.** The snake shape lives entirely in each image's `left`/`top`; the animation is the same 40px rise on every item. Positions follow `top = MID − AMP·sin(2π·i/N)` with `left` advancing by roughly the item width — re-derive both from the target's own container size and item count (ladder rung 6). Nothing in the effect depends on the wave, so a section whose items are a plain row still gets the correct entrance; it just isn't a snake.

3. **The snake reads as a snake only because sizes vary.** The six demo images are 175–220px wide at a fixed 4:3, and the size jitter is what stops the arc looking like a stamped repeat. Keep a per-item width multiplier when mapping; it costs nothing and it is the whole visual identity.

4. **The stagger is a `sequences` offset, not per-item effects.** One effect on `selector: '.snake-image'` inside a sequence with `offset: 120` fires each matched element 120ms after the previous — six items, so the last starts at 600ms and the whole entrance takes 600 + 600 = 1200ms. Getting this wrong by writing six keyed effects gives you six schedules that can drift and six controls to keep in sync.

5. **The lightbox is toggled by two independent `click` interactions, not a state machine.** Open is keyed to the *items* (`key: '#image-snake', selector: '.snake-image'`), close is keyed to the *backdrop*. There is no "is open" flag anywhere — the backdrop only intercepts the closing click because `pointer-events` is animated from `none` to `auto` inside the fade-in keyframes and back inside the fade-out. That property in the keyframes is load-bearing; drop it and the lightbox can never be dismissed.

6. **Every click effect is `triggerType: 'repeat'`**, so a second click on a different image re-runs `image-cycle-in` from 0 — that scale-from-0.95 is how the lightbox swaps pictures while open, not just how it appears.

7. **`translate(-50%, -50%)` is inside the keyframes' `transform` and must stay there.** The centring is composed with the scale in every frame of both the open and the dismiss effect; move it to the `translate` property and the two stop agreeing, so the box jumps to a corner mid-dismiss. This also means a control over the lightbox size cannot touch `transform`.

8. **The lightbox needs no new DOM in a Wix section** — the backdrop role can be re-hosted on the section's own `__bg` layer or any existing full-bleed wrapper (ladder rung 2), and the copy role on an existing rich-text block. Only the enlarged image needs a host; if the section has none spare, reduce that role (rung 5) and open the backdrop + copy alone rather than dropping the click entirely.

## Check before committing numbers

- The stagger must finish before it looks stalled: `offset·(N − 1) + duration` — 1200ms at N = 6. Past ~2s an entrance reads as broken, so cap `offset ≤ 1400/(N − 1)` ms as N grows.
- Wave amplitude must fit: `MID + AMP + maxItemHeight/2 ≤ containerHeight`, and with `body { overflow: clip }` anything past that is silently cut, not scrolled to.
- Adjacent items must not collide: `left(i+1) − left(i) ≥ width(i) · 0.9` — the demo runs a deliberate slight overlap at that ratio; below it the arc turns into a pile.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Stagger Offset | 120 ms | the sequence's `offset` |
| Rise Distance | 40 px | `translateY` in `snake-image-in` keyframe 0 |
| Entrance Duration | 600 ms | `snake-image-in` `duration` |
| Wave Amplitude | 82 px | each item's `top` (layout, re-templated per item) |
| Lightbox Width | 60 % | `#main-image-container` `width` |
| Backdrop Opacity | 1 | `backdrop-fade-in` keyframe 1 `opacity` |

Expose the **geometric inputs**, never values derived from them: no control for
the per-item `left` (it follows item width and count), no control for total
entrance time (it follows offset, count and duration), no control for the
dismiss scale (it follows the open scale), and no separate fade-out duration
(the close is the open read backwards).

**Rise Distance is baked into keyframes** — it lives inside the keyframe's own
`transform: translateY(40px) scale(0.9)`, so that control must re-template
keyframe 0 of `snake-image-in`, not set a variable. Lightbox Width is the safe
one precisely because of note (7): it writes `width` on the container while
`transform` stays literal.

## Reference defaults (N = 6) — inputs, not constants

Entrance: `viewEnter`, `triggerType: 'once'`, sequence `offset: 120ms`,
`snake-image-in` 600ms `ease-out` `fill: both`, `opacity 0→1`,
`translateY(40px) scale(0.9) → translateY(0) scale(1)`.

Click-open: `image-cycle-in` 400ms `ease-in-out` (`scale .95→1`),
`backdrop-fade-in` 600ms `ease-out` (with `pointerEvents none→auto`),
`text-fade-in` 900ms `ease-out`. Click-close: `image-dismiss` 600ms `ease-out`
(`scale 1→0.8`), `backdrop-fade-out` 600ms, `text-fade-out` 400ms `ease-in-out`.
All click effects `triggerType: 'repeat'`, all `fill: both`.

Wave: container 1200×760; `MID = 296`, `AMP = 82`, `left` steps of ~190px,
widths 175–220px at 4:3, `top = MID − AMP·sin(2π·i/N)` rounded to the demo's
289/353/368/298/219/204.

Structural CSS the target will need: `#main-image-container` and `#backdrop`
are `position: absolute`/`fixed` with `z-index` 100/50 and `opacity: 0` at rest
(matching keyframe 0), and the items are `position: absolute` — in a Wix
section each animated item needs `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` (all `!important` — structural) to escape the
grid, and the section itself needs `position: relative` plus `overflow: clip`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Snake Animation</title>
<style>
  body { margin: 0; background: #0e0e12; color: #f2f2f2; font-family: system-ui, sans-serif; overflow: clip; }
  interact-element { display: contents; }

  /* Fixed stage: the wave is layout (left/top), not motion. */
  .stage { position: relative; width: 1200px; height: 760px; margin: 0 auto; }
  #image-snake { position: absolute; inset: 0; }

  .snake-image { position: absolute; object-fit: cover; border-radius: 10px; cursor: pointer; }

  /* Rest pose === keyframe 0 for both lightbox layers, or the first paint flashes. */
  #main-image-container {
    position: absolute; left: 50%; top: 50%; width: 60%; aspect-ratio: 4 / 3;
    opacity: 0; z-index: 100; transform: translate(-50%, -50%) scale(0.95);
    border-radius: 12px; overflow: clip;
  }
  #main-image-container img { width: 100%; height: 100%; object-fit: cover; }

  /* pointer-events is animated in the keyframes — see mechanism note (5). */
  #backdrop { position: fixed; inset: 0; opacity: 0; z-index: 50;
              pointer-events: none; background: rgba(0,0,0,.86); }

  #text-container { opacity: 0; height: 20rem; z-index: 110; max-width: 42rem;
                    padding: 0 2rem; display: flex; flex-direction: column; justify-content: center; }
  #text-container h1 { margin: 0 0 .5rem; font-size: 1.9rem; }
  #text-container h2 { margin: 0; font-size: 1.05rem; font-weight: 300; color: rgba(255,255,255,.75); }

  .overlay-copy { position: absolute; inset: 0; display: flex; align-items: center;
                  justify-content: flex-start; pointer-events: none; }
  #main-image-wrapper, #backdrop-wrapper { display: block; position: absolute; inset: 0; }
</style>
</head>
<body>

<div class="stage">
  <interact-element data-interact-key="#image-snake">
    <div id="image-snake"><!-- items injected --></div>
  </interact-element>

  <interact-element data-interact-key="#backdrop" id="backdrop-wrapper">
    <div id="backdrop"></div>
  </interact-element>

  <interact-element data-interact-key="#main-image-container" id="main-image-wrapper">
    <div id="main-image-container"><img src="" alt=""></div>
  </interact-element>

  <div class="overlay-copy">
    <interact-element data-interact-key="#text-container">
      <div id="text-container">
        <h1 id="main-title"></h1>
        <h2 id="main-subtitle"></h2>
      </div>
    </interact-element>
  </div>
</div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different container or item count.
const N = 6, MID = 296, AMP = 82, STEP = 190, BASE_W = 200, RATIO = 3 / 4;
const RISE = 40, STAGGER = 120, ENTER_MS = 600;

// left(i+1) - left(i) >= width(i) * 0.9, or the arc becomes a pile.
console.assert(STEP >= BASE_W * 0.9, 'items collide');
console.log('entrance total', STAGGER * (N - 1) + ENTER_MS, 'ms');

// Size jitter is the visual identity — see mechanism note (3).
const ITEMS = [
  [0.95, 'photo-1506744038136-46273834b3fb', 'Coastline',  'Where the light lands first.'],
  [1.05, 'photo-1469474968028-56623f02e42e', 'Understory', 'Slow growth, held in shade.'],
  [0.88, 'photo-1501785888041-af3ef285b470', 'Long water', 'A lake that keeps its own time.'],
  [1.00, 'photo-1470071459604-3b5ec3a7fe05', 'Ridge line', 'Fog before the treeline.'],
  [0.93, 'photo-1519681393784-d120267933ba', 'Cold night', 'Stars over a still valley.'],
  [1.10, 'photo-1441974231531-c6227db76b6e', 'Canopy',     'Sun read through leaves.'],
];

const snake = document.querySelector('#image-snake');
ITEMS.forEach(([k, photo, title, sub], i) => {
  const w = Math.round(BASE_W * k), h = Math.round(w * RATIO);
  const left = 8 + i * STEP;
  const top = Math.round(MID - AMP * Math.sin(2 * Math.PI * i / N));   // the wave
  snake.insertAdjacentHTML('beforeend', `
    <img class="snake-image" data-title="${title}" data-sub="${sub}"
         src="https://images.unsplash.com/${photo}?w=640&h=480&fit=crop" alt=""
         style="width:${w}px;height:${h}px;left:${left}px;top:${top}px;
                opacity:0;transform:translateY(${RISE}px) scale(0.9)">`);
});

// Content swap on click — the animation is declarative, only the src is not.
const big = document.querySelector('#main-image-container img');
snake.addEventListener('click', e => {
  const img = e.target.closest('.snake-image');
  if (!img) return;
  big.src = img.src;
  document.querySelector('#main-title').textContent = img.dataset.title;
  document.querySelector('#main-subtitle').textContent = img.dataset.sub;
});

const kf = (name, keyframes, duration, easing) => ({
  keyframeEffect: { name, keyframes }, duration, easing, fill: 'both',
});

const config = {
  effects: {
    'snake-image-in': kf('snake-image-in', [
      { opacity: 0, transform: `translateY(${RISE}px) scale(0.9)` },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], ENTER_MS, 'ease-out'),

    'text-fade-in':  kf('text-in',  [{ opacity: 0 }, { opacity: 1 }], 900, 'ease-out'),
    'text-fade-out': kf('text-out', [{ opacity: 1 }, { opacity: 0 }], 400, 'ease-in-out'),

    // translate(-50%,-50%) stays INSIDE transform in every frame — note (7).
    'image-cycle-in': kf('img-cycle-in', [
      { opacity: 0, transform: 'translate(-50%, -50%) scale(0.95)' },
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
    ], 400, 'ease-in-out'),
    'image-dismiss': kf('img-dismiss', [
      { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
      { opacity: 0, transform: 'translate(-50%, -50%) scale(0.8)' },
    ], 600, 'ease-out'),

    // pointerEvents in the keyframes is what makes the backdrop dismissable.
    'backdrop-fade-in': kf('backdrop-in', [
      { opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'auto' },
    ], 600, 'ease-out'),
    'backdrop-fade-out': kf('backdrop-out', [
      { opacity: 1, pointerEvents: 'auto' }, { opacity: 0, pointerEvents: 'none' },
    ], 600, 'ease-out'),
  },
  interactions: [
    { key: '#image-snake', trigger: 'viewEnter',
      sequences: [{
        offset: STAGGER, triggerType: 'once',      // one sequence, not six effects
        effects: [{ selector: '.snake-image', effectId: 'snake-image-in' }],
      }] },
    { key: '#image-snake', selector: '.snake-image', trigger: 'click',
      effects: [
        { key: '#main-image-container', effectId: 'image-cycle-in',   triggerType: 'repeat' },
        { key: '#backdrop',             effectId: 'backdrop-fade-in', triggerType: 'repeat' },
        { key: '#text-container',       effectId: 'text-fade-in',     triggerType: 'repeat' },
      ] },
    { key: '#backdrop', trigger: 'click',
      effects: [
        { key: '#main-image-container', effectId: 'image-dismiss',     triggerType: 'repeat' },
        { key: '#backdrop',             effectId: 'backdrop-fade-out', triggerType: 'repeat' },
        { key: '#text-container',       effectId: 'text-fade-out',     triggerType: 'repeat' },
      ] },
  ],
};

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);
Interact.create(config);
</script>

</body>
</html>
```