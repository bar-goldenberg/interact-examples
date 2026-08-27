# Task

Apply the **Sticky Repeater Stack** to this section: five cards ride up on sticky, each pinning at the same height and shrinking to 0.8 as the next one slides over it, leaving a receding deck of stacked cards.

The demo below runs. Read it for the mechanism, map it onto this section's elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **Nothing is stacked by z-index or absolute positioning — the stack is a byproduct of sticky.** The cards are ordinary flow siblings in a column with a `250px` gap. Each one sticks at `top: 35vh`, so once card *i* has pinned, card *i+1* keeps scrolling until it reaches the same line and lands on top of it (later DOM order paints above). Remove the gap and the stack has no travel; remove `position: sticky` and there is no stack at all.

2. **Each card's range is computed from where *that card* pins, not from a stagger fraction.** Card *i*'s top in the unscrolled document is `padTop + i·(cardH + gap)`, and it starts sticking after `stickScroll_i = vh + top_i − stickyTop` of `cover` progress. Divide by `totalCover = sectionPx + vh` for the percentage. That is why the offsets look like arbitrary numbers (18/29/40/51/62%) — they are geometry, not a schedule.

3. **The shrink must end 1 percentage point before the next card's range begins** (`endPct = startPct + perCardSpan − 1`). The card is fully at 0.8 exactly as the next card arrives at the pin line; give it the full span and the two shrinks overlap by a frame and the deck reads as sagging rather than settling. The last card is the exception: its range runs to `sectionPx / totalCover` so it finishes with the section instead of a span early.

4. **`composite: 'add'` is what makes this survive being restacked.** The scale is contributed relative to the underlying value, so a card that already carries a transform from the section's own design (or from a second effect) is scaled *on top of* it rather than having it overwritten. Keep it — dropping to `replace` silently erases any pre-existing transform on the card.

5. **Section height is derived, not chosen.** `sectionPx = lastStickScroll + cardH + gap` where `lastStickScroll = vh + top_{N−1} − stickyTop`. Pick the card height, the gap and the count; the runway follows. A section shorter than that and the last card never pins; longer and the deck sits finished while empty space scrolls.

6. **The demo's `perspective: 1000px`, `preserve-3d` and `backface-visibility: hidden` are dead weight — drop all three.** The only animated property is a 2D `scale`, which no projection foreshortens; measured across 9 scroll stops, painted/layout width was exactly 1× on every card. `backface-visibility: hidden` additionally promotes the card to its own layer and pins its raster, which is the main cause of blurry text (house rules). They are removed in the demo below.

7. **Content-stack items work as-is** (no rung-4 conversion needed): the card is only ever scaled, never masked or cropped, so an image-above-copy item keeps its internal layout. The only requirement is that the card is a **direct flow child** of the scrolling wrapper — a card wrapped in its own positioned box cannot stick against the wrapper.

## Check before committing numbers

- The pin must be reachable: `stickyTop + cardH ≤ 100vh`, or the pinned card is taller than the space below its pin line and hangs out of view (35 + 40 = 75vh here).
- The gap must exceed nothing visually but must be non-zero and larger than the shrink's visual travel: a card shrinking from `H` to `0.8H` frees `0.2·H` of height, so `gap > 0.2·cardH` keeps a visible step between deck layers (250px > 0.2 × 40vh at any viewport under 3125px tall).
- Runway must satisfy `sectionPx = vh + padTop + (N−1)(cardH + gap) − stickyTop + cardH + gap`. Change `N`, `cardH` or `gap` and every range offset moves.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Stack Gap | 250 px | wrapper `gap` — and re-templates every range offset |
| Card Height | 40 vh | card `height` |
| Pin Offset | 35 vh | card `top` |
| Top Padding | 15 vh | wrapper `padding-top` |
| Shrink Scale | 0.8 | the final keyframe's `transform: scale(...)` |

Expose the **geometric inputs**, never values derived from them: no control for section height (it follows gap, card height, count and pin offset — note 5), no control for the per-card range offsets (they follow the same four — note 2), and no control for the 1-point end trim (it follows the span).

Stack Gap, Card Height, Pin Offset and Top Padding are all baked into the **range offsets**, not into the keyframes — so each of those four controls must recompute all `2N` offsets, not merely set a CSS variable. Only Shrink Scale touches the keyframes, and it touches only the last one.

## Reference defaults (N = 5) — inputs, not constants

Stack gap 250px · card 40vh (max-width 800px) · pin offset `top: 35vh` · wrapper `padding-top: 15vh` · shrink to `scale(0.8)` · `viewProgress` on the section, `cover` ranges per card, `fill: both`, `composite: 'add'`, `easing: 'linear'`, two keyframes. At a 900px viewport this gives section height `calc(300vh + 1250px)` and offsets `cover` 18→28, 29→39, 40→50, 51→61, 62→73 %.

Cards must be direct flow children of the wrapper (`interact-element { display: contents }`), with `position: sticky` and `grid-area: auto`, `margin: 0`, `max-height: none` (all `!important` — structural) to escape the Wix grid, and the wrapper needs `display: flex; flex-direction: column; align-items: center` with the gap. `overflow: clip` only — never `hidden` — on any ancestor.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Sticky Repeater Stack</title>
<style>
  body { margin: 0; overflow-x: clip; background: #0b0b10; color: #eee;
         font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  .pad { height: 100vh; display: flex; align-items: center; justify-content: center; }

  /* Runway. Height is DERIVED from card height + gap + count — see note (5).
     Computed below and written onto this element at init. */
  .scroll-section { position: relative; }

  /* Plain flow column. The gap is the stack's travel; the sticky top is the
     shared pin line. No perspective / preserve-3d / backface-visibility:
     the animation is a 2D scale — see note (6). */
  .repeater-wrapper {
    display: flex; flex-direction: column; align-items: center;
    gap: 250px; padding-top: 15vh;
  }

  .card {
    position: sticky; top: 35vh;
    width: 100vw; max-width: 800px; height: 40vh;
    display: flex; flex-direction: column; justify-content: flex-end;
    border-radius: 18px; overflow: hidden;
    /* Rest pose === keyframe 0 (scale(1) under composite: add === identity). */
  }
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content { position: relative; z-index: 2; padding: 1.5rem; }
  .card-content h3 { margin: 0 0 .35rem; font-size: 1.4rem; }
  .card-content p  { margin: 0; font-size: .8rem; color: rgba(255,255,255,.72); }
</style>
</head>
<body>

<div class="pad"><h1>Scroll down</h1></div>

<interact-element data-interact-key="scroll-section">
  <section class="scroll-section">
    <div class="repeater-wrapper"><!-- cards injected here --></div>
  </section>
</interact-element>

<div class="pad"><h1>End of section</h1></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants.
const STACK_GAP = 250;      // px between cards in flow = the stack's travel
const SHRINK    = 0.8;      // scale of a card once the next one lands on it
const PAD_TOP   = 0.15;     // wrapper padding-top, fraction of vh
const CARD_H    = 0.40;     // card height, fraction of vh
const STICKY_TOP= 0.35;     // pin line, fraction of vh

const CARDS = [
  ['Craft first',     'Every detail measured, nothing left to chance.', 'photo-1506744038136-46273834b3fb'],
  ['Built to last',   'Materials chosen for the decade, not the season.', 'photo-1469474968028-56623f02e42e'],
  ['Always on hand',  'A real person, in your timezone, on the first ring.', 'photo-1501785888041-af3ef285b470'],
  ['Quietly precise', 'The work speaks before we do.', 'photo-1470071459604-3b5ec3a7fe05'],
  ['No surprises',    'One price, agreed up front, held to the end.', 'photo-1519681393784-d120267933ba'],
];
const N = CARDS.length;

const vh = window.innerHeight;
const padTopPx = PAD_TOP * vh, cardHPx = CARD_H * vh, stickyTopPx = STICKY_TOP * vh;

// The pin must be reachable, and the gap must out-measure the shrink's slack.
console.assert(STICKY_TOP + CARD_H <= 1, 'pinned card taller than the space below its pin line');
console.assert(STACK_GAP > 0.2 * cardHPx, 'gap smaller than the height freed by the shrink');

// Geometry -> runway -> ranges. See notes (2) and (5).
const cardTop  = i => padTopPx + i * (cardHPx + STACK_GAP);
const stickAt  = i => vh + cardTop(i) - stickyTopPx;      // scroll at which card i pins
const sectionPx  = Math.round(stickAt(N - 1) + cardHPx + STACK_GAP);
const totalCover = sectionPx + vh;
const perCardSpan = ((cardHPx + STACK_GAP) / totalCover) * 100;

const section = document.querySelector('.scroll-section');
section.style.height = sectionPx + 'px';

const wrapper = document.querySelector('.repeater-wrapper');
CARDS.forEach(([title, copy, photo], i) => {
  wrapper.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i + 1}">
      <div class="card">
        <img src="https://images.unsplash.com/${photo}?w=900&h=500&fit=crop" alt="">
        <div class="card-content"><h3>${title}</h3><p>${copy}</p></div>
      </div>
    </interact-element>`);
});

const effects = CARDS.map((_, i) => {
  const startPct = (stickAt(i) / totalCover) * 100;
  // -1 so the shrink lands exactly as the next card arrives; last card runs
  // to the end of the section instead. See note (3).
  const endPct = i < N - 1 ? startPct + perCardSpan - 1
                           : (sectionPx / totalCover) * 100;
  return {
    key: `card-${i + 1}`,
    keyframeEffect: {
      name: `card-${i + 1}-scale`,
      keyframes: [{ transform: 'scale(1)' }, { transform: `scale(${SHRINK})` }],
    },
    rangeStart: { name: 'cover', offset: { unit: 'percentage', value: Math.round(startPct) } },
    rangeEnd:   { name: 'cover', offset: { unit: 'percentage', value: Math.round(endPct) } },
    fill: 'both',
    composite: 'add',   // scales on top of any transform the card already has — note (4)
    easing: 'linear',
  };
});

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: 'scroll-section', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>
```