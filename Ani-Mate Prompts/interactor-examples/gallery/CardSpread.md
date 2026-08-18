# Task

Apply **Card Spread** to this section: five photo cards start stacked on top of each other in the middle of a pinned viewport and fan out horizontally as the page scrolls, shrinking slightly as they separate; on narrow screens they arrive one at a time from below instead.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The stack is not a layout — it is N absolutely-positioned cards all at the
   same point, and the fan is a per-card `translateX` off that point.** Card `i`
   ends at `dx(i) = (i − (N−1)/2)·GAP`; with N = 5 and GAP = 20vw that is
   −40 / −20 / 0 / +20 / +40vw. Nothing in the config knows about "spread" — each
   card carries its own two-keyframe move, so the count and the gap are inputs
   (ladder rung 6), not the demo's five hardcoded numbers.

2. **The centre card's effect is a no-op** (`translateX(0)` → `translateX(0)`).
   It exists only to keep the per-card formula uniform. Dropping it changes
   nothing; dropping its **z-index** does — see (3).

3. **Paint order is deliberately not DOM order: `z-index` is 3, 4, 5, 2, 1.**
   The centre card sits on top of the stack and the left-going cards are above
   the right-going ones, so the pile reads as a deck dealt from the middle rather
   than as five identical rectangles. On mobile the order is reversed to plain
   1…5, because there each card *arrives* and must land on top of the ones
   already parked. Same markup, opposite ordering — this is the piece that gets
   silently lost when a section's cards are re-ordered.

4. **The shrink and the spread are deliberately split across two properties so
   they cannot clobber each other.** The spread writes `transform` per card; the
   shrink writes `height`, once, via a single effect keyed to the collection with
   `selector: '.card'`. Because `height` is layout and `object-fit: cover`
   re-crops, the card gets shorter without the photo distorting — a `scale`
   here would squash it and would also collide with the spread.

5. **The scrub is padded at both ends: `cover` 20% → 80%.** The first fifth of
   the pinned travel holds the full stack and the last fifth holds the finished
   fan, so the section can only be caught at rest in a pose that was designed.
   The padding is a value to re-derive, not a constant — it is what makes a
   400vh runway feel like 240vh of motion.

6. **Mobile is a different mechanism on the same trigger, gated by `conditions`,
   and it uses a different range name.** Desktop scrubs on `cover`; mobile
   staggers four cards across `contain` quartiles (0–25, 25–50, 50–75, 75–100)
   so the sequence is defined by the pinned phase alone. Card 1 has no mobile
   effect — it is already in place and is the thing the others land on.

7. **Flat, by measurement.** Painted/layout width stayed at exactly 1× on the
   section, the collection and all five cards across nine scroll stops: there is
   no perspective in play and none is wanted. Do not add a `rotateY` lean or a
   `perspective` to "improve" the fan — it would need a stage this section does
   not have, and the demo's motion is pure X translation.

## Check before committing numbers

- Cards must not overlap once fanned: `GAP ≥ CARD_W`.
- The outermost card must stay on screen:
  `(N−1)/2·GAP + CARD_W/2 ≤ 50vw`. At N = 5, GAP = CARD_W = 20vw this is exactly
  50vw — the end cards land flush with the viewport edges with no gaps between
  them. Any larger N forces a smaller GAP, which then trips the first check
  unless `CARD_W` shrinks with it.
- Runway minus the pin is the scrub budget: `SECTION_H − STAGE_H` (400vh − 100vh
  here), and only `100 − 2·HOLD` percent of it actually moves.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Card Width | 20 vw | `.card` `width` |
| Spread Gap | 20 vw | `translateX` inside every card's keyframes |
| Rest Height | 85 vh | the second keyframe's `height` |
| Stage Height | 100 vh | `.cards-container-wrapper` `height` |
| Scroll Length | 400 vh | `.scroll-section` `height` |
| Hold | 20 % | `rangeStart` / `rangeEnd` offsets on every effect |

Expose the **geometric inputs**, never values derived from them: no per-card
offset (it follows Spread Gap and the index), no collection width (it follows
Card Width), no first-keyframe height (it is Stage Height), no z-index control
(it follows the paint-order rule in mechanism note 3).

Spread Gap is the baked one: the offset lives inside each effect's `transform`
keyframes, so that control must re-template all N move effects, not set a
variable.

## Reference defaults (N = 5) — inputs, not constants

Card 20vw × 100vh · spread gap 20vw (ends at ±40vw) · rest height 85vh · stage
100vh sticky · runway 400vh · `cover` 20%→80%, `fill: both`,
`cubic-bezier(0.42, 0, 0.58, 1)` · z-order 3,4,5,2,1.
Mobile (≤768px): runway 500vh, collection 90vw, card 100% × 75vh at `top: 12.5vh`,
cards 2–5 rest at `translateY(100vh)`, `contain` quartiles, `easing: linear`,
z-order 1…5.

The cards need `position: absolute` inside a `position: relative` collection that
is `margin: 0 auto` at card width — and to escape the Wix grid each also needs
`grid-area: auto`, `margin: 0`, `max-width` / `max-height: none` (all
`!important` — structural, never on `transform` or `height`). `overflow: clip` on
the sticky wrapper, never `hidden`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Card Spread</title>
<style>
  body { margin: 0; background: #0b0b10; color: #fff; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  .scroll-section { height: 400vh; }
  /* clip here, not on the cards' parent — hidden would kill the ViewTimeline */
  .cards-container-wrapper { position: sticky; top: 0; height: 100vh; overflow: clip; }
  #cards-collection { position: relative; width: 20vw; height: 100vh; margin: 0 auto; }

  /* Rest pose == keyframe 0: translateX(0), height 100vh. */
  .card { position: absolute; top: 0; left: 0; width: 20vw; height: 100vh;
          overflow: clip; transform: translateX(0); }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 0; }
  .card::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent); z-index: 1; }
  .card-content { position: absolute; bottom: 0; left: 0; right: 0; padding: 2rem; z-index: 2; text-align: center; }
  .card-content h2 { margin: 0 0 .5rem; font-size: 1.15rem; }
  .card-content p { margin: 0; font-size: .75rem; color: rgba(255,255,255,.75); }

  @media (max-width: 768px) {
    .scroll-section { height: 500vh; }
    #cards-collection { width: 90vw; }
    .card { width: 100%; height: 75vh; top: 12.5vh; }
    .card-content { text-align: left; padding: 1.5rem; }
  }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key=".scroll-section">
  <section class="scroll-section">
    <div class="cards-container-wrapper">
      <interact-element data-interact-key="#cards-collection">
        <div id="cards-collection"><!-- cards injected here --></div>
      </interact-element>
    </div>
  </section>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different item count or card size.
const N = 5, CARD_W = 20, GAP = 20, REST_H = 85, HOLD = 20;
const Z = [3, 4, 5, 2, 1];                 // paint order, NOT DOM order — see note (3)
const dx = i => (i - (N - 1) / 2) * GAP;   // -40 -20 0 20 40 vw

console.assert(GAP >= CARD_W, 'cards overlap once fanned');
console.assert((N - 1) / 2 * GAP + CARD_W / 2 <= 50, 'outer cards leave the viewport');

const CARDS = [
  ['Serene Peaks',  'Find your calm',            'photo-1506744038136-46273834b3fb'],
  ['Rolling Hills', 'Explore the landscape',     'photo-1469474968028-56623f02e42e'],
  ['Alpine Lake',   'Reflect and relax',         'photo-1501785888041-af3ef285b470'],
  ['Hidden Falls',  "Discover nature's power",   'photo-1470071459604-3b5ec3a7fe05'],
  ['Forest Canopy', 'Breathe the fresh air',     'photo-1519681393784-d120267933ba'],
];

// Per-card z-index (and the mobile rest pose) can't be inline: they're media-dependent.
document.head.insertAdjacentHTML('beforeend', `<style>${CARDS.map((_, i) => `
  #card-${i + 1} { z-index: ${Z[i]}; }
  @media (max-width: 768px) {
    #card-${i + 1} { z-index: ${i + 1}; ${i ? 'transform: translateY(100vh);' : ''} }
  }`).join('')}</style>`);

document.querySelector('#cards-collection').innerHTML = CARDS.map(([h, p, photo], i) => `
  <interact-element data-interact-key="#card-${i + 1}">
    <div id="card-${i + 1}" class="card">
      <img src="https://images.unsplash.com/${photo}?w=600&h=1000&fit=crop" alt="">
      <div class="card-content"><h2>${h}</h2><p>${p}</p></div>
    </div>
  </interact-element>`).join('');

const cover = (a, b) => ({
  rangeStart: { name: 'cover', offset: { unit: 'percentage', value: a } },
  rangeEnd:   { name: 'cover', offset: { unit: 'percentage', value: b } },
});
const contain = (a, b) => ({
  rangeStart: { name: 'contain', offset: { unit: 'percentage', value: a } },
  rangeEnd:   { name: 'contain', offset: { unit: 'percentage', value: b } },
});

const desktop = [
  // One effect for all cards: key + selector join with NO space, so '.card' must be a compound.
  { key: '#cards-collection', selector: '.card',
    keyframeEffect: { name: 'card-shrink', keyframes: [{ height: '100vh' }, { height: `${REST_H}vh` }] },
    ...cover(HOLD, 100 - HOLD), easing: 'cubic-bezier(0.42, 0, 0.58, 1)', fill: 'both' },
  ...CARDS.map((_, i) => ({
    key: `#card-${i + 1}`,
    keyframeEffect: { name: `card-${i + 1}-move`,
      keyframes: [{ transform: 'translateX(0)' }, { transform: `translateX(${dx(i)}vw)` }] },
    ...cover(HOLD, 100 - HOLD), easing: 'cubic-bezier(0.42, 0, 0.58, 1)', fill: 'both',
  })),
];

// Card 1 is already in place; the other N-1 arrive in sequence across the pinned phase.
const mobile = CARDS.slice(1).map(([, ], j) => ({
  key: `#card-${j + 2}`,
  keyframeEffect: { name: `card-${j + 2}-in`,
    keyframes: [{ transform: 'translateY(100vh)' }, { transform: 'translateY(0)' }] },
  ...contain(j * 100 / (N - 1), (j + 1) * 100 / (N - 1)), easing: 'linear', fill: 'both',
}));

// Init order: defineInteractElement() -> one frame -> create(). Fails silently both ways.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  conditions: {
    desktop: { type: 'media', predicate: '(min-width: 769px)' },
    mobile:  { type: 'media', predicate: '(max-width: 768px)' },
  },
  interactions: [
    { key: '.scroll-section', trigger: 'viewProgress', conditions: ['desktop'], effects: desktop },
    { key: '.scroll-section', trigger: 'viewProgress', conditions: ['mobile'],  effects: mobile  },
  ],
});
</script>

</body>
</html>
```