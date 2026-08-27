# Task

Apply **Title Folds Scroll Animation** to this section: a stack of full-height sticky cards, each one scaling up from 75% as it arrives while its rule, heading, corner stack and media block reveal at the same time from different resting poses.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The stacking is layout, not animation.** Every card is `position: sticky; top: 0` inside one tall column with a large `gap`; nothing animates the pinning. The gap *is* the per-card runway — each card pins, the next one rides up over it, and the earlier card is simply covered. Reproduce this by making the item wrapper sticky, not by writing a translate.

2. **`entry` is the right clock here, not `cover`.** Each card owns its own reveal and they never need to be ordered against each other — the stagger comes for free from the fact that card *i* enters the viewport ~gap+height later than card *i−1*. Because every card's effects share one `entry 0→100` range, the four inner reveals are exactly simultaneous *within* a card and exactly staggered *between* cards, with no offset arithmetic.

3. **The five effects are one shared pose vocabulary, not five animations.** All five are two-keyframe `transform` scrubs over the identical range with `easing: linear`; the only difference is the resting pose (`scale(0.75)` card, `scale(2.0)` heading, `scaleX(0)` rule, `scale(0.3)` corner stack, `translateY(400px)` content). Define them once and reuse across every card — the config's per-card repetition is boilerplate, not five hundred distinct numbers.

4. **`transform-origin` is what gives each reveal its direction, and it is the only thing that does.** Card `bottom center` (grows upward, so the card's top edge is what sweeps in); rule `left` (wipes left→right); heading `top left` (shrinks toward the corner it is pinned to); corner stack `top right` (grows out of its own corner). Change an origin and the same keyframes read as a completely different motion. Any target element must be given the matching origin explicitly — the default `50% 50%` silently turns every one of these into a centred zoom.

5. **The heading starts at `scale(2.0)`, i.e. it *shrinks* into place** while everything else grows. That inversion is the signature of the effect; do not normalise it to a matching grow. At 2× a 40px heading paints 80px from its top-left corner and can overflow the card horizontally — the card's `overflow: clip` is load-bearing for that, not decoration.

6. **`translateY(400px)` on the content container is masked by the container's own `overflow: clip`, not the card's.** The content block slides up from below inside its own box; the image is `height: 100%` so it never reveals a gap. On a target, whatever box holds the media must carry `overflow: clip` itself or the image will be seen crossing the card boundary.

7. **Content-stack → media-cover** (ladder rung 4): the demo's content container is already a full-bleed image with copy and an icon absolutely positioned over it. A section whose item is image-above-text converts by making the image fill the container and laying the copy over it; copy over media needs a scrim.

## Check before committing numbers

- The runway must cover every card's entry: `sectionHeight ≥ padTop + N·cardHeight + (N−1)·gap`. At N=5, 100vh pad, 95vh card, 500px gap the demo runs 6300px — under that, the last card's `entry` range never completes and it rests scaled-down.
- `gap` must be ≥ the distance a card needs to finish its `entry` scrub before the next card covers it; a gap smaller than one viewport means a card is still growing while already being overlapped.
- Heading at `scale(2.0)` from `top left` occupies `2 × headingWidth` from `left: 20px` — that must be ≤ card width, or the clip eats the first frame of the word.

## Controls to expose

Seven, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Card Scale Start | 0.75 | keyframe 0 of `card-scale` |
| Heading Scale Start | 2.0 | keyframe 0 of `heading-scale` |
| Corner Stack Scale Start | 0.3 | keyframe 0 of `top-stack-reveal` |
| Content Rise | 400 px | keyframe 0 of `content-slide-up` |
| Card Height | 95 vh | `.card` `height` |
| Card Gap | 500 px | `.cards-repeater` `gap` |
| Scroll Length | 6300 px | `.scroll-section` `height` |

Expose the **geometric inputs**, never values derived from them: no control for
the rule's `scaleX(0)` (a wipe has exactly one start value and it is 0), no
control for the range (all five effects share one `entry 0→100` by design — see
note 2), no control for stagger (it follows Card Height and Card Gap), and no
control for `transform-origin` (it is the identity of each reveal, note 4).

Every one of the four pose controls is **baked into keyframes** — each writes
keyframe 0 of a `transform` string, so changing one must re-template that
effect's keyframes, not set a CSS variable. Scroll Length is the odd one out:
it is plain layout CSS, but it is *derived-adjacent* — raising Card Height or
Card Gap without raising it breaks the first inequality above.

## Reference defaults (N = 5) — inputs, not constants

Card `100% × 95vh`, `transform-origin: bottom center`, `overflow: clip` ·
column gap 500px, `padding-top: 100vh` · section height 6300px ·
rule 6px tall, origin `left` · heading `top: 20px; left: 20px`, origin `top left` ·
corner stack `top: 20px; right: 20px`, origin `top right` · content container
inset `top: 120px; left/right: 20px; bottom: 20px`, `overflow: clip` ·
all five effects `viewProgress`, `entry` 0→100%, `fill: both`, `easing: linear`.

Every card wrapper needs `position: sticky; top: 0` and `display: block` — an
`interact-element` is `display: inline` by default and cannot be sticky. On a Wix
target the item wrapper also needs `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` (all `!important` — structural) to escape the grid,
and the section needs a trailing `1fr` row so the runway grows the grid rather
than the section.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Title Folds Scroll Animation</title>
<style>
  body { margin: 0; background: #0b0b10; color: #fff; font-family: system-ui, sans-serif; }

  /* Runway. Must cover padTop + N*cardH + (N-1)*gap — see the checks. */
  .scroll-section { position: relative; height: 6300px; }

  /* interact-element is inline by default and cannot be sticky. The pin is
     pure layout: no effect animates it. */
  interact-element { display: block; position: sticky; top: 0; }

  /* The gap is the per-card runway; padding-top puts card 1 below the fold. */
  .cards-repeater { display: flex; flex-direction: column; gap: 500px; padding-top: 100vh; }

  /* origin bottom center => the card grows upward. clip contains the 2x heading. */
  .card {
    width: 100%; height: 95vh; overflow: clip;
    transform-origin: bottom center;
    background: #14141c;
  }
  .card-content { position: relative; width: 100%; height: 100%; }

  /* Each origin below IS the direction of its reveal — see mechanism note (4). */
  .horizontal-line {
    position: absolute; top: 0; left: 0; width: 100%; height: 6px;
    transform-origin: left; background: #fff;
  }
  .heading-text {
    position: absolute; top: 20px; left: 20px; margin: 0;
    transform-origin: top left; font-size: 2.5rem;
  }
  .top-right-stack {
    position: absolute; top: 20px; right: 20px;
    display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
    transform-origin: top right; font-size: .8rem;
  }

  /* Its own clip is what masks the 400px rise — not the card's. */
  .content-container {
    position: absolute; top: 120px; left: 20px; right: 20px; bottom: 20px;
    overflow: clip;
  }
  .main-image { width: 100%; height: 100%; object-fit: cover; display: block; }
  .content-container::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
  }
  .bottom-text-stack {
    position: absolute; bottom: 20px; left: 20px; z-index: 2;
    display: flex; flex-direction: column;
  }
  .small-text { font-size: .75rem; opacity: .75; }
  .big-text { font-size: 1.6rem; }
  .arrow-icon { position: absolute; bottom: 20px; right: 20px; width: 48px; height: 48px; z-index: 2; }

  .next-section { height: 100vh; display: flex; align-items: center; justify-content: center; }
</style>
</head>
<body>

<main class="scroll-section">
  <div class="cards-repeater"><!-- cards injected here --></div>
</main>
<section class="next-section"><p>Next Section</p></section>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different item count or card height.
const CARD_SCALE_START    = 0.75;
const HEADING_SCALE_START = 2.0;
const STACK_SCALE_START   = 0.3;
const CONTENT_RISE        = 400;   // px
const CARD_H_VH = 95, GAP_PX = 500, PAD_TOP_VH = 100, SECTION_PX = 6300;

const CARDS = [
  ['Heading 1', 'Craft first',     'photo-1506744038136-46273834b3fb'],
  ['Heading 2', 'Built to last',   'photo-1469474968028-56623f02e42e'],
  ['Heading 3', 'Always on hand',  'photo-1501785888041-af3ef285b470'],
  ['Heading 4', 'Quietly precise', 'photo-1470071459604-3b5ec3a7fe05'],
  ['Heading 5', 'No surprises',    'photo-1519681393784-d120267933ba'],
];
const N = CARDS.length;

// The runway must outlast the last card's entry, or it rests scaled-down.
console.assert(
  SECTION_PX >= innerHeight * PAD_TOP_VH / 100 + N * innerHeight * CARD_H_VH / 100 + (N - 1) * GAP_PX,
  'section too short for N cards'
);

const repeater = document.querySelector('.cards-repeater');
CARDS.forEach(([heading, big, photo], i) => {
  const n = i + 1;
  // Rest pose === keyframe 0 for every animated element, or the first paint flashes.
  repeater.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="#card-${n}">
      <div class="card" id="card-${n}" style="transform:scale(${CARD_SCALE_START})">
        <div class="card-content">
          <div class="horizontal-line" style="transform:scaleX(0)"></div>
          <h2 class="heading-text" style="transform:scale(${HEADING_SCALE_START})">${heading}</h2>
          <div class="top-right-stack" style="transform:scale(${STACK_SCALE_START})">
            <span>text 1</span><span>text 2</span>
          </div>
          <div class="content-container" style="transform:translateY(${CONTENT_RISE}px)">
            <img class="main-image" src="https://images.unsplash.com/${photo}?w=1600&h=900&fit=crop" alt="">
            <div class="bottom-text-stack">
              <span class="small-text">Small Text</span>
              <span class="big-text">${big}</span>
            </div>
            <svg class="arrow-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="23.5" stroke="white"/>
              <path d="M24 16V32M24 32L30 26M24 32L18 26" stroke="white" stroke-width="2"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>
      </div>
    </interact-element>`);
});

// One clock for all five reveals: same range, same easing. The stagger between
// cards is layout (gap + height), not offsets. See mechanism note (2).
const commonRange = {
  rangeStart: { name: 'entry', offset: { unit: 'percentage', value: 0 } },
  rangeEnd:   { name: 'entry', offset: { unit: 'percentage', value: 100 } },
  easing: 'linear', fill: 'both',
};
const scrub = (name, from) => ({
  keyframeEffect: { name, keyframes: [{ transform: from }, { transform: 'none' }] },
  ...commonRange,
});

const effects = {
  'card-scale':       scrub('card-scale-effect',       `scale(${CARD_SCALE_START})`),
  'heading-scale':    scrub('heading-scale-effect',    `scale(${HEADING_SCALE_START})`),
  'line-reveal':      scrub('line-reveal-effect',      'scaleX(0)'),
  'top-stack-reveal': scrub('top-stack-reveal-effect', `scale(${STACK_SCALE_START})`),
  'content-slide-up': scrub('content-slide-up-effect', `translateY(${CONTENT_RISE}px)`),
};

const interactions = CARDS.map((_, i) => {
  const key = `#card-${i + 1}`;
  return {
    key, trigger: 'viewProgress',
    effects: [
      { key, effectId: 'card-scale' },
      { key, selector: '.heading-text',     effectId: 'heading-scale' },
      { key, selector: '.horizontal-line',  effectId: 'line-reveal' },
      { key, selector: '.top-right-stack',  effectId: 'top-stack-reveal' },
      { key, selector: '.content-container', effectId: 'content-slide-up' },
    ],
  };
});

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ effects, interactions });
</script>

</body>
</html>
```