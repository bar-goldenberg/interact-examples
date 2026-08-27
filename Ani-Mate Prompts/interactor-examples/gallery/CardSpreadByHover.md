# Task

Apply **Card Spread by Hover** to this section: five stacked image cards sitting exactly on top of each other, which fan out sideways into a row when the collection is hovered, and slide back into the stack when the pointer leaves.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The trigger is on the container, the effects are on the children.** One
   `hover` interaction keyed to `#cards-collection` carries five effects, each
   keyed to a card. Hovering any card fans *all* of them, because the pointer is
   over the collection. Keying `hover` per card instead would make each card
   spread only itself and re-fire as the pointer crosses gaps — a different
   animation.

2. **`triggerType: 'alternate'` is what supplies the return.** There is no
   second interaction for pointer-leave and no reversed keyframes: `alternate`
   plays 0→1 on enter and 1→0 on leave, so a mid-fan un-hover reverses from
   where it is instead of snapping. Only the spread-out pose is authored.

3. **The offsets are `i` relative to the centre card, times one card width.**
   With N = 5, card index `i ∈ {1..5}` and centre `c = ⌈N/2⌉ = 3`:
   `offset(i) = (i − c) · (cardW + gap)` → `−2, −1, 0, +1, +2` slots. The centre
   card gets a `translateX(0) → translateX(0)` no-op effect on purpose: it keeps
   all five cards on the same clock and the same schedule, so the config stays a
   single uniform map instead of four effects plus a special case.

4. **The stacking order is not 1..5 — it is 3,2,1 over 4,5** (`z-index`
   5,4,3,2,1 for cards 3,2,1,4,5). While stacked, the centre card is on top and
   the pile reads as a deck seen from the front; during the spread the cards that
   travel left pass *over* the ones that travel right. Ordering them 1..5 makes
   the leftmost card the bottom one and the fan looks like it unpeels from the
   wrong side.

5. **This is a pure 2D translate — there is no depth here.** Measured across the
   sweep, painted/layout width was exactly 1× on the collection and all five
   cards, and every card's travel was the same 193px. Do not add `perspective`,
   `preserve-3d` or `translateZ` when adapting: nothing in the mechanism projects.

6. **The demo's card width and its travel distance are the same input.** The
   spread uses `calc(±50vw ± 20px)` because the card is `25vw` wide with a 10px
   gap — `2 × (25vw + 10px)`. Re-derive both from the target's actual card width;
   copying `50vw` onto a section whose cards are not `25vw` leaves gaps or
   overlaps.

7. **The spread needs horizontal room the Wix grid will not give.** The cards are
   `position: absolute` in a container that is one card wide, and they travel
   `±2` card widths out of it — so the *section* needs `overflow: clip` and the
   full spread width must fit the viewport (see the check below). A container
   that clips its own overflow eats the outer cards.

8. **`cubic-bezier(0.16, 1, 0.3, 1)` is 90%+ done in the first third** — that is
   the "spring" feel, and it is legitimate here because a hover fires the whole
   600ms at once (unlike a scrub, where a front-loaded curve reads as a stall).
   Keep it; do not symmetrize it.

## Check before committing numbers

- The whole fan must fit: `N · cardW + (N − 1) · gap ≤ 100vw`. At N = 5 that
  caps `cardW + gap` at `20vw` — the demo's `25vw + 10px` already spills, which
  is why the source clips at the body.
- Travel of the outermost card is `⌊N/2⌋ · (cardW + gap)`; if the section is
  narrower than the viewport, that distance still measures against the card, not
  the section, so the outer cards leave the section box — clip on the section.
- Odd `N` gives a true centre card that does not move; even `N` has no centre, so
  offsets become `(i − (N+1)/2) · (cardW + gap)` and *every* card moves by a
  half-slot.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Card Width | 25 vw | card + container `width` |
| Card Height | 70 vh | card + container `height` |
| Spread Gap | 10 px | gap term — re-templates every keyframe's `translateX` |
| Spread Duration | 600 ms | effect `duration` |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` | effect `easing` |

Expose the **geometric inputs**, never values derived from them: no control for
per-card travel distance (it follows card width, gap and index), no control for
the number of slots or the centre index (both follow `N`), and no separate
z-index control (the stacking order is a fixed pattern over `N`).

Spread Gap and Card Width are the awkward pair: the travel distance
`(i − c) · (cardW + gap)` lives inside each keyframe's `transform`, so either
control must **re-template all five effects' keyframes**, not just set a
variable.

## Reference defaults (N = 5) — inputs, not constants

Card 25vw × 70vh · gap 10px · slots `−2 −1 0 +1 +2` → `translateX` of
`calc(-50vw - 20px)`, `calc(-25vw - 10px)`, `0`, `calc(25vw + 10px)`,
`calc(50vw + 20px)` · duration 600ms · `easing: cubic-bezier(0.16, 1, 0.3, 1)` ·
`triggerType: 'alternate'`, `fill: 'both'` · z-index 3,4,5,2,1 for cards 1..5 ·
measured travel 193px per card at the harness viewport.

Container `position: relative`, one card wide; cards `position: absolute` at
`top: 0; left: 0` with rest pose `transform: translateX(0)` (= keyframe 0).
On a Wix section each card also needs `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` (all `!important` — structural) to escape the
grid, plus `overflow: clip` on the section, not on the collection.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Card Spread By Hover</title>
<style>
  html, body { margin: 0; height: 100%; }
  body {
    display: grid; place-items: center;
    background: #0b0b10; color: #eee; font-family: system-ui, sans-serif;
    overflow: clip;   /* the fan travels +-2 card widths out of the container */
  }
  interact-element { display: contents; }

  /* One card wide. The cards are absolute inside it and spread out of it, so
     this must NOT clip -- the clip lives on the body/section. */
  #cards-collection { position: relative; width: 25vw; height: 70vh; }

  .card {
    position: absolute; top: 0; left: 0;
    width: 25vw; height: 70vh;
    overflow: clip;
    transform: translateX(0);   /* rest pose == keyframe 0 */
  }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }

  /* Copy over media needs a scrim -- these photos were not chosen for contrast. */
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem; z-index: 2; text-align: center; }
  .card-content h2 { margin: 0 0 .5rem; font-size: 1.25rem; }
  .card-content p  { margin: 0; font-size: .8rem; color: rgba(255,255,255,.72); }
</style>
</head>
<body>

<interact-element data-interact-key="#cards-collection">
  <div id="cards-collection"><!-- cards injected here --></div>
</interact-element>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants -- re-derive for a different count or card size.
const N = 5;
const CARD_W = '25vw';     // card width; also the slot pitch
const GAP    = 10;         // px between fanned cards
const DUR    = 600;        // ms
const EASE   = 'cubic-bezier(0.16, 1, 0.3, 1)';

const CENTER = Math.ceil(N / 2);                 // card 3 of 5 -- does not move
const slot   = i => i - CENTER;                  // -2 -1 0 +1 +2
// travel = slot * (cardW + gap); slot 0 stays a no-op effect on purpose (note 3)
const offset = i => slot(i) === 0
  ? 'translateX(0)'
  : `translateX(calc(${slot(i) * 25}vw + ${slot(i) * GAP}px))`;

// Whole fan must fit the viewport: N*cardW + (N-1)*gap <= 100vw.
console.log('fan width', N * 25, 'vw +', (N - 1) * GAP, 'px');

// Centre card on top, left-travelling cards over right-travelling ones (note 4).
const Z = { 1: 3, 2: 4, 3: 5, 4: 2, 5: 1 };

const CARDS = [
  ['Serene Peaks',  'Find your calm',            'photo-1506744038136-46273834b3fb'],
  ['Rolling Hills', 'Explore the landscape',     'photo-1469474968028-56623f02e42e'],
  ['Alpine Lake',   'Reflect and relax',         'photo-1501785888041-af3ef285b470'],
  ['Hidden Falls',  "Discover nature's power",   'photo-1470071459604-3b5ec3a7fe05'],
  ['Forest Canopy', 'Breathe the fresh air',     'photo-1519681393784-d120267933ba'],
];

const root = document.querySelector('#cards-collection');
CARDS.forEach(([title, copy, photo], k) => {
  const i = k + 1;
  root.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="#card-${i}">
      <div id="card-${i}" class="card" style="z-index:${Z[i]}">
        <img src="https://images.unsplash.com/${photo}?w=640&h=900&fit=crop" alt="">
        <div class="card-content"><h2>${title}</h2><p>${copy}</p></div>
      </div>
    </interact-element>`);
});

// One hover interaction on the CONTAINER, five effects on the cards (note 1).
const effects = CARDS.map((_, k) => {
  const i = k + 1;
  return {
    key: `#card-${i}`,
    keyframeEffect: {
      name: `card-${i}-move`,
      keyframes: [{ transform: 'translateX(0)' }, { transform: offset(i) }],
    },
    triggerType: 'alternate',   // supplies the return on pointer-leave (note 2)
    duration: DUR,
    easing: EASE,
    fill: 'both',
  };
});

// Init order: defineInteractElement() -> one frame -> create(). Fails silently
// both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: '#cards-collection', trigger: 'hover', effects }],
});
</script>

</body>
</html>
```