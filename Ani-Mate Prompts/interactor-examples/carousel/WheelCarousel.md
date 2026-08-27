# Task

Apply the **Wheel Carousel** to this section: six image cards ride the rim of one
very large circle that turns slowly and forever, each card counter-rotating so it
stays upright; only the top arc of the circle is inside the frame, so cards drift
in from one side and out the other. Hovering a card swells its image slightly.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The wheel is far bigger than its frame, and that is the whole effect.**
   Radius 65vmin with 20vmin cards makes a 150vmin box, shown through a 68vh
   window with `margin-top: 10vh` — you see an arc, not a circle. Cards appear
   to travel a shallow curve across the top and leave. Shrink the radius toward
   the frame size and it stops being an arc and becomes an obvious spinning
   ring; the radius is the composition control, not just a spacing number.

2. **Counter-rotation is what keeps the copy and images upright.** The wheel
   runs `rotate(0 → 360deg)`, each card runs `rotate(0 → −360deg)` with the
   *same* duration, easing and iteration count. The two must stay locked: a
   different duration on either side makes the cards tumble at the difference
   frequency. It is one input, applied twice — never two controls.

3. **Card `i` is placed by static margins, not by a transform.**
   `margin-left = (R·cos θᵢ − cs/2)·1vmin`, `margin-top = (R·sin θᵢ − cs/2)·1vmin`,
   `θᵢ = i·360/N`. The `0.866` in the source is `sin 60°`. Because placement is
   margin-based, the card's own `transform` is free for the counter-rotation and
   its image's `transform` is free for the hover — three roles, no clobbering.

4. **`z-index` is a static painter's order sampled at the START pose, and it
   never updates.** The source's `100 / 187 / 13` is `round(100 + 100·sin θᵢ)`.
   The rotation is pure 2D, so nothing re-sorts as cards travel: a card keeps
   whichever layer its *initial* angle gave it for the entire loop. If cards
   overlap, the overlap order will be wrong for half of every turn — size the
   radius so they never touch (see the check below) rather than trying to fix
   the stacking.

5. **This animation is time-driven, not scroll-driven.** `viewEnter` starts a
   30s `iterations: Infinity` loop and scroll position never touches it again.
   Measured across 9 scroll stops in a real browser, `#wheel` reported STATIC
   with 0px travel — that is the probe sampling a wall-clock loop, not a dead
   animation. Painted/layout width was exactly 1× everywhere: there is **no
   perspective and no 3D here**, and none should be added when adapting.

6. **The hover is scoped per item by `listContainer`, not by per-card keys.**
   One interaction on the wheel key with `listContainer: '.card'` makes the
   hovered card the effect root, and `selector: 'img'` picks that card's image
   alone. `triggerType: 'alternate'` plays it back out on leave. This is the
   rung-3 shape already: no per-item wrapper or per-item key is required, so a
   Wix repeater whose items share one parent maps directly.

7. **The source's mobile/tablet breakpoints are the same geometry re-derived**
   (`--r: 22 / --cs: 12`, `--r: 18 / --cs: 10`), not different animations. They
   are collapsed here to the desktop numbers; re-derive from the target's own
   frame rather than carrying any of these three sets across (ladder rung 6).

## Check before committing numbers

- Cards must not touch, because nothing re-sorts them mid-turn:
  `2R·sin(180/N°) > cardSize`. At N = 6 that reduces to `R > cardSize`
  (65 > 20 — a 3.25× margin).
- The wheel box is `2R + cardSize` on a side and is *not* independent — if you
  raise the radius, the box grows and the visible arc flattens. Keep
  `2R + cardSize` comfortably larger than the frame's shorter dimension or the
  full circle comes into view.
- Cards sweep outside the frame on both sides, so the frame needs
  `overflow: clip`; a section that must not clip its neighbours cannot host this
  at a large radius.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Wheel Radius | 65 vmin | `--r` |
| Card Size | 20 vmin | `--cs` |
| Spin Duration | 30000 ms | `duration` on the spin **and** counter-spin effects |
| Hover Scale | 1.1 | `img-hover` keyframe `transform` |
| Frame Height | 68 vh | `.arc-viewport` `height` |
| Wheel Offset | 10 vh | `.wheel` `margin-top` |

Expose the **geometric inputs**, never values derived from them: no control for
the wheel box size (it is `2R + cardSize`), no control for card positions (they
follow R, card size and N), no control for `z-index` (it follows θᵢ), and above
all **no separate counter-rotation duration** — it is the spin duration, and
letting the two disagree makes the cards tumble (2).

Hover Scale is the baked one: the value lives inside the `img-hover` keyframes'
`transform`, so that control must re-template the keyframes, not set a variable.
Spin Duration is the other awkward one — a single input that must be written to
two effects at once.

## Reference defaults (N = 6) — inputs, not constants

Radius 65vmin · card 20vmin · wheel box 150vmin · frame 68vh with `overflow: clip`
· wheel `margin-top: 10vh` · spin 30000ms `linear` `iterations: Infinity` on
`viewEnter`, counter-spin identical and negative · hover 250ms `ease-out`
`fill: both` `triggerType: 'alternate'`, scale 1 → 1.1 · card angles
`i·60°`, z-index `round(100 + 100·sin θᵢ)` = 100 / 187 / 187 / 100 / 13 / 13.

Cards positioned by `position: absolute; left: 50%; top: 50%` plus the margin
pair from (3). On a Wix section each card will also need `grid-area: auto`,
`margin` overridden by the computed pair, and `max-width` / `max-height: none`
(all `!important` — structural) to escape the grid, and the frame needs
`display: flex; justify-content: center; align-items: flex-start`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Wheel Carousel</title>
<style>
  body { margin: 0; overflow-x: hidden; background: #0b0b10; }
  interact-element { display: contents; }
  .spacer { height: 60vh; }

  /* The frame. The wheel is far larger than this; you see only its top arc. */
  .arc-viewport {
    position: relative; width: 100%; height: 68vh;
    overflow: clip;
    display: flex; justify-content: center; align-items: flex-start;
  }

  /* Box side = 2R + cs, so the rotation never leaves the element's own bounds. */
  .wheel {
    position: relative; flex-shrink: 0;
    width:  calc(var(--r) * 2vmin + var(--cs) * 1vmin);
    height: calc(var(--r) * 2vmin + var(--cs) * 1vmin);
    transform-origin: center center;
    margin-top: 10vh;
    transform: rotate(0deg);   /* rest pose === keyframe 0 */
  }

  /* Placement is margin-based (see note 3), leaving transform free for the
     counter-rotation and the image's transform free for the hover. */
  .card {
    position: absolute; left: 50%; top: 50%;
    width: calc(var(--cs) * 1vmin); height: calc(var(--cs) * 1vmin);
    overflow: hidden;
    transform: rotate(0deg);   /* rest pose === keyframe 0 */
  }
  .card img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    transform: scale(1);       /* rest pose === keyframe 0 */
  }
</style>
</head>
<body>

<div class="spacer"></div>

<section class="arc-viewport">
  <interact-element data-interact-key="wheel">
    <div class="wheel"><!-- cards injected here --></div>
  </interact-element>
</section>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for another item count or frame size.
const N = 6, RADIUS = 65, CARD = 20;   // vmin
const SPIN_MS = 30000;                 // one turn; counter-spin MUST match
const HOVER_SCALE = 1.1, HOVER_MS = 250;

document.documentElement.style.setProperty('--r', RADIUS);
document.documentElement.style.setProperty('--cs', CARD);

// Cards must never touch: nothing re-sorts them mid-turn (note 4).
console.assert(2 * RADIUS * Math.sin(Math.PI / N) > CARD, 'radius too small for N cards');

const PHOTOS = [
  'photo-1506744038136-46273834b3fb', 'photo-1469474968028-56623f02e42e',
  'photo-1501785888041-af3ef285b470', 'photo-1470071459604-3b5ec3a7fe05',
  'photo-1519681393784-d120267933ba', 'photo-1441974231531-c6227db76b6e',
];

const wheel = document.querySelector('.wheel');
PHOTOS.slice(0, N).forEach((photo, i) => {
  const th = i * 2 * Math.PI / N;
  const ml = `calc((var(--r) * ${Math.cos(th).toFixed(3)} - var(--cs) / 2) * 1vmin)`;
  const mt = `calc((var(--r) * ${Math.sin(th).toFixed(3)} - var(--cs) / 2) * 1vmin)`;
  // Static painter's order, sampled at the START angle and never updated.
  const z = Math.round(100 + 100 * Math.sin(th));
  wheel.insertAdjacentHTML('beforeend', `
    <div class="card" style="margin-left:${ml};margin-top:${mt};z-index:${z}">
      <img src="https://images.unsplash.com/${photo}?w=600&h=600&fit=crop" alt="">
    </div>`);
});

const loop = { duration: SPIN_MS, iterations: Infinity, easing: 'linear' };

const config = {
  effects: {
    // Equal and opposite, same duration/easing/iterations — they must stay locked.
    'wheel-spin': {
      keyframeEffect: { name: 'wheel-spin-kf',
        keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }] },
      ...loop,
    },
    'card-counter': {
      keyframeEffect: { name: 'card-counter-kf',
        keyframes: [{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }] },
      ...loop,
    },
    'img-hover': {
      keyframeEffect: { name: 'img-hover-kf',
        keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${HOVER_SCALE})` }] },
      duration: HOVER_MS, easing: 'ease-out', fill: 'both',
    },
  },
  interactions: [
    {
      key: 'wheel', trigger: 'viewEnter',
      effects: [
        { key: 'wheel', effectId: 'wheel-spin' },
        { selector: '.card', effectId: 'card-counter' },
      ],
    },
    {
      // listContainer scopes the hover to the hovered card only — no per-card keys.
      key: 'wheel', trigger: 'hover', listContainer: '.card',
      effects: [{ selector: 'img', effectId: 'img-hover', triggerType: 'alternate' }],
    },
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

**Verification report.** Headless run — no browser, no file access. Only check
(3) was available and was performed: every number in the prose was checked
against the emitted demo — N = 6, θᵢ = i·60°, `sin 60° = 0.866`, R = 65vmin,
card 20vmin, box `2·65 + 20 = 150`vmin, frame 68vh, offset 10vh, spin 30000ms
linear infinite, counter-spin −360deg at the same duration, hover 250ms ease-out
scale 1 → 1.1, `z = round(100 + 100·sin θ)` giving 100/187/187/100/13/13 (matching
the source's 100/187/13), and `2R·sin(30°) = R = 65 > 20`. Checks (1) "the
sanitized demo runs" and (2) "its motion matches the original's" were **not run**;
the caller's render loop is the gate for those. The supplied measurement
(`#wheel` STATIC, 0px travel, painted/layout width 1× at every stop) is what
mechanism note (5) rests on — a scroll probe cannot sample a wall-clock loop — and
I claim no perspective or scroll-driven motion anywhere. Sanitization changes a
render check should confirm: the two mobile breakpoints were collapsed to the
desktop geometry, `overflow: hidden` on the frame became `overflow: clip`, the six
hand-written `#card-N` rules became one generated array, and rest poses were made
explicit so they equal keyframe 0.