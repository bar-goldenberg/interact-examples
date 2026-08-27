# Task

Apply the **7-Card Fan Spread** to this section: seven stacked cards pinned in the
viewport, splayed out from a near-flat pile into a wide fan as the section scrolls.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The fan is a pure 2D rotation about a pivot below the cards — there is no
   3D here.** `transform-origin: center 140%` puts each card's pivot 40% of its
   own height *below* its bottom edge, so `rotate(θ)` swings the card like a
   playing card held in a hand. Measured: painted/layout width stayed exactly
   **1×** on all seven cards at every scroll stop, so nothing is foreshortened.
   Do not add `perspective` or `preserve-3d` when adapting — there is nothing to
   project.

2. **Every card is stacked at the same absolute position; the spread is entirely
   the angle.** The deck box is exactly one card wide and tall, and each card is
   `position: absolute` filling it. So a target section only needs *one* box the
   size of a card, not a row of slots.

3. **The angle is symmetric about the middle card.** With `off = i − ⌊N/2⌋`, card
   `i` goes from `off · 0.8deg` to `off · SPREAD` (SPREAD = 12deg). The middle
   card (`off = 0`) never moves at all — that is intended, it is the card the fan
   opens around. For even N there is no still card and the fan is off-centre by
   half a step; prefer an odd count.

4. **Rest pose must be the 0.8deg-per-step pile, not `rotate(0)`.** The first
   keyframe is `off · 0.8deg`, so the resting CSS must carry that same rotation
   inline per card or the first paint snaps the deck flat.

5. **z-index is the fan order and must ascend with `i`**, matching the direction
   the angles increase; the last card is the topmost and the rightmost. Reverse
   one without the other and the fan reads as folded over itself. Nothing in the
   transform enforces this — it is CSS stacking only.

6. **`transform-origin` is what sizes the swept area, not the card box.** The
   pivot is 1.4 card-heights from the card top, so the outermost card sweeps an
   arc of that radius; the pinned container has to be wide enough for it (see
   the check below) and `overflow: clip` on the sticky container catches the
   rest.

7. **`easing: cubic-bezier(0.22, 1, 0.36, 1)`** — a hard ease-out. The fan is
   ~80% open in the first third of its range and then creeps, so the spread
   effectively lands well before the range ends and holds. That is the whole
   reason the range stops at 55% of `contain`: the remaining 45% is deliberate
   hold time with the deck open.

## Check before committing numbers

- Half-width of the swept fan ≈ `1.4 · cardH · sin(⌊N/2⌋ · SPREAD) + cardW/2`.
  At N=7, cardH=400, cardW=280 that is `560 · sin(36°) + 140 ≈ 469px`, so the
  pinned area must be ≥ ~940px wide or the outer cards get clipped.
- Adjacent cards must still be distinguishable: `SPREAD` in degrees must be
  large enough that the arc step `1.4 · cardH · SPREAD·π/180` exceeds a few px —
  at 400px tall and 12deg that is 117px of separation per card.
- The sticky container must be as tall as the viewport and the section taller
  than it, or there is no scroll to scrub against.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Spread Angle | 12 deg | `SPREAD` — re-templates every keyframe's `rotate` |
| Pile Angle | 0.8 deg | start angle per step — re-templates keyframe 0 *and* the rest pose |
| Pivot Depth | 140 % | card `transform-origin` |
| Card Width | 280 px | `--card-w` |
| Card Height | 400 px | `--card-h` |
| Scroll Length | 600 vh | `--section-height` |

Expose the **geometric inputs**, never values derived from them: no control for
a per-card angle (it follows Spread Angle × index), no control for z-index (it
follows index), no control for the swept width or the deck box size (both follow
card size and pivot depth), and no separate sticky height (it is the viewport).

Both angle controls are **baked into the keyframes** — the value lives inside
`transform: rotate(...)`, so each must re-template all 2 keyframes for all N
cards. Pile Angle additionally has to rewrite the inline rest pose, or note (4)
breaks.

## Reference defaults (N = 7) — inputs, not constants

Card 280×400 · pivot `center 140%` · pile 0.8deg/step · spread 12deg/step
(outer card ±36deg) · section 600vh · sticky 100vh · `viewProgress`, `contain`
0→55%, `fill: both`, `easing: cubic-bezier(0.22, 1, 0.36, 1)` · measured travel
122px per card across the sweep · z-index 1…7 ascending.

On a Wix section the cards must escape the grid: `position: absolute`,
`grid-area: auto`, `margin: 0`, `max-width`/`max-height: none` (all
`!important` — structural), with one existing wrapper taking `position: relative`
and the card-sized box. `overflow: clip` goes on the sticky container, never
`hidden`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>7-Card Fan Spread</title>
<style>
  :root { --card-w: 280px; --card-h: 400px; --section-height: 600vh; }
  body { margin: 0; background: #0c0c11; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  .intro, .outro {
    height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; text-align: center;
  }

  /* Runway. The scrub has no travel without this height. */
  #scroll-wrapper { height: var(--section-height); position: relative; }

  /* Pinned stage. clip lives here — it catches the swept arc of the outer cards. */
  .sticky-container {
    position: sticky; top: 0; height: 100vh; width: 100%;
    display: flex; align-items: center; justify-content: center;
    overflow: clip;
  }

  /* The deck is exactly ONE card; all seven stack inside it. */
  .deck { position: relative; width: var(--card-w); height: var(--card-h); }

  /* transform-origin below the card is the whole fan: the pivot sits 40% of the
     card's height past its bottom edge. See mechanism note (1) and (6). */
  .card {
    position: absolute; inset: 0;
    overflow: clip; border-radius: 10px;
    transform-origin: center 140%;
    box-shadow: 0 18px 40px rgba(0,0,0,.5);
  }
  .card img { width: 100%; height: 100%; object-fit: cover; display: block; }
  /* Copy over media needs a scrim to stay readable. */
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
  }
  .card-label { position: absolute; bottom: 0; left: 0; right: 0; padding: 1.4rem; z-index: 2; }
  .card-label span { display: block; margin-bottom: .35rem; font-size: .7rem; color: rgba(255,255,255,.72); }
  .card-label h3 { margin: 0; font-size: 1.15rem; }
</style>
</head>
<body>

<section class="intro"><h1>The Collection</h1><p>Scroll to reveal</p></section>

<interact-element data-interact-key="scroll-wrapper">
  <div id="scroll-wrapper">
    <div class="sticky-container">
      <div class="deck"><!-- cards injected here --></div>
    </div>
  </div>
</interact-element>

<section class="outro"><p>— fin —</p></section>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different card count or size.
const N = 7;            // prefer ODD: the middle card is the still one
const SPREAD = 12;      // deg per step at full spread
const PILE   = 0.8;     // deg per step at rest
const CARD_W = 280, CARD_H = 400, PIVOT = 1.4;   // PIVOT = transform-origin, in card heights
const MID = Math.floor(N / 2);

// The swept fan must fit the pinned area, or the outer cards clip.
const halfSpan = PIVOT * CARD_H * Math.sin(MID * SPREAD * Math.PI / 180) + CARD_W / 2;
console.log('fan needs', Math.round(2 * halfSpan) + 'px of width');

const CARDS = [
  ['01 — Landscape', 'Alpine Peaks',    'photo-1506744038136-46273834b3fb'],
  ['02 — Ocean',     'Tropical Shore',  'photo-1501785888041-af3ef285b470'],
  ['03 — Sky',       'Northern Lights', 'photo-1470071459604-3b5ec3a7fe05'],
  ['04 — Flora',     'Cherry Blossoms', 'photo-1522383225653-ed111181a951'],
  ['05 — Desert',    'Sand Dunes',      'photo-1509316785289-025f5b846b35'],
  ['06 — Water',     'Misty Waterfall', 'photo-1432405972618-c60b0225b8f9'],
  ['07 — Urban',     'City Lights',     'photo-1519681393784-d120267933ba'],
];

const angles = i => {
  const off = i - MID;
  return { start: off * PILE, end: off * SPREAD };
};

const deck = document.querySelector('.deck');
CARDS.forEach(([kicker, title, photo], i) => {
  const { start } = angles(i);
  // Rest pose === keyframe 0 (the pile angle), or the first paint snaps flat.
  // z-index ascends with i — that IS the fan order. See note (5).
  deck.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i + 1}">
      <div class="card" style="transform:rotate(${start}deg);z-index:${i + 1}">
        <img src="https://images.unsplash.com/${photo}?w=560&h=800&fit=crop" alt="">
        <div class="card-label"><span>${kicker}</span><h3>${title}</h3></div>
      </div>
    </interact-element>`);
});

const effects = CARDS.map((_, i) => {
  const { start, end } = angles(i);
  return {
    key: `card-${i + 1}`,
    keyframeEffect: {
      name: `fan-${i + 1}`,
      keyframes: [
        { transform: `rotate(${start}deg)` },
        { transform: `rotate(${end}deg)` },
      ],
    },
    rangeStart: { name: 'contain', offset: { value: 0,  unit: 'percentage' } },
    rangeEnd:   { name: 'contain', offset: { value: 55, unit: 'percentage' } },
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    fill: 'both',
  };
});

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: 'scroll-wrapper', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>
```