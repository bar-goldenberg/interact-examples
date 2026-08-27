# Task

Apply **Specimen Card Gallery** to this section: five cards start spread wide, blurred and faded, then slide inward and sharpen into a single flat centered row as the section scrolls past pinned.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The convergence is pure 2D, despite the `rotateY` and `perspective()` in
   every keyframe.** Measured over 9 scroll stops: painted/layout width is
   exactly **1×** on all five cards and the wrapper at every stop. The
   `perspective(1200px)` sits *inside* each keyframe's own `transform` list,
   after the translate, so it never produces measurable foreshortening. Treat
   this as a 2D slide-in + blur-out; do not build a 3D stage, `preserve-3d`
   chain, or perspective control for it. Keeping the `rotateY` term is
   harmless flavour, but it buys nothing you can see.

2. **The whole animation is 28px of measured travel per card.** Max travel was
   28px for every card *and* for the wrapper — i.e. what the sweep saw was
   dominated by the sticky wrapper's own movement, not by the 560px→0
   `translateX` written in the keyframes. The reason is (3): each card's range
   ends well before the runway does, so across most of a 600vh scroll the cards
   are held at their 100% keyframe by `fill: both` and only the sticky pin
   moves. Do not size the spread against the sweep number.

3. **The stagger is in the RANGES, not in the keyframes.** All five cards share
   an identical three-keyframe shape; what differs is where each one's `contain`
   window sits: outer pair 15→85%, middle pair 10→72%, centre 0→58%. The centre
   card therefore finishes first and the outer pair last, so the row assembles
   from the middle outward. Reproducing this by offsetting keyframes instead
   would put all five on one clock and lose the outward assembly.

4. **`translateX` per card is `±(i − centre) · STEP`, and the 45% keyframe is
   exactly half of it.** With STEP = 280px and N = 5: −560/−280/0/+280/+560 at
   the start (card 1 rightmost, card 5 leftmost — the spread is *mirrored*, each
   card starting on the far side of where it belongs), halving at 45%, zero at
   the end. `rotateY` follows the same shape: `±15deg` → `±4.5deg` (0.3×) → 0,
   and card 2/4 get `9deg → 2.7deg` because they are one step in.

5. **`scale` does not halve — it goes 0.7 → 0.88 → 1**, deliberately non-linear
   against the translate so the cards are already near full size while still
   sliding. The 45% keyframe is the only place the three channels disagree,
   which is why this cannot collapse to two keyframes.

6. **Opacity and blur finish at 45%, not at 100%.** `opacity: 0 → 1` and
   `blur(12px) → blur(0)` are both complete by the middle keyframe; the back
   half of every range is translate/scale only. So the cards are fully opaque
   and sharp for the entire second half of their travel — the reveal reads as
   "appear, then settle", not "fade in while arriving".

7. **The card's CSS rest state is `opacity: 0` and keyframe 0 is also
   `opacity: 0`** — they agree, which is what stops the flash. If you change
   the rest state you must change keyframe 0 with it.

8. **`contain` is the right range name here because the container is pinned.**
   A 600vh wrapper with a 100vh sticky child makes `contain` exactly the pinned
   phase, so `contain` 0→85% is "while the pin holds", and the tail after 85%
   is the settled row on screen before the section leaves.

## Check before committing numbers

- Spread must actually clear the row: `STEP ≥ cardWidth + gap`. At 260px + 20px
  gap, STEP = 280px is the minimum non-overlapping step — a wider card needs a
  proportionally wider STEP or the spread poses stack.
- Outermost start offset is `(N−1)/2 · STEP` (560px at N = 5). The sticky
  container must be able to hide that: it is the `overflow: clip` host, so the
  spread is clipped rather than widening the page — check the row's own width
  plus 2 × that offset against the viewport if you want the spread visible
  rather than swept in from off-screen.
- Every card's range must end before the runway does, or the row never gets a
  settled moment. Latest end here is 85% of `contain`.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Card Width | 260 px | `--card-width` on the card |
| Row Gap | 20 px | `.cards-row` `gap` |
| Spread Step | 280 px | `STEP` — re-templates every keyframe's `translateX` |
| Start Blur | 12 px | keyframe 0 `filter` |
| Start Scale | 0.7 | keyframe 0 `scale` term in `transform` |
| Scroll Length | 600 vh | wrapper `height` |

Expose the **geometric inputs**, never values derived from them: no control for
the per-card start offset (it follows Spread Step and the card's index), none
for the 45% midpoint values (translate is half the start, rotate is 0.3× the
start, scale is the authored 0.88), and none for `rotateY` (it is decorative and
unmeasurable — see note 1). No perspective control at all.

Spread Step and Start Scale are the awkward pair: both live inside each card's
`transform` list, so those controls must **re-template all three keyframes of
all five cards**, not merely set a variable.

## Reference defaults (N = 5) — inputs, not constants

Card 260px wide, aspect 36/50, row `gap: 20px` · STEP 280px (starts
∓560/∓280/0) · start `blur(12px)`, `opacity: 0`, `scale(0.7)`,
`rotateY(±15deg)` · 45% keyframe: half translate, `rotateY(±4.5deg)`,
`scale(0.88)`, `opacity: 1`, `blur(0)` · end: identity, `scale(1)` · runway
600vh, sticky 100vh, `easing: cubic-bezier(0.22, 1, 0.36, 1)`, `fill: both` ·
ranges `contain` 15→85 / 10→72 / 0→58 / 10→72 / 15→85.

Wrapper `position: relative; height: 600vh`; sticky child
`position: sticky; top: 0; height: 100vh; overflow: clip` (clip, not hidden).
On a Wix section the cards will each need `grid-area: auto`, `margin: 0`,
`max-width: none` (all `!important` — structural) to sit in one flex row.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Specimen Card Gallery</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #f4f2ee; color: #1a1a1a; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  .hero, .end-section {
    height: 100vh; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 1rem;
  }

  /* Runway. The scrub has no travel without this height. */
  #scroll-wrapper { position: relative; height: 600vh; }

  /* Pinned stage, and the clip host for the 560px spread. clip, not hidden. */
  .sticky-container {
    position: sticky; top: 0; height: 100vh; width: 100%;
    display: flex; align-items: center; justify-content: center;
    overflow: clip;
  }

  .cards-row { display: flex; gap: 20px; align-items: center; justify-content: center; }

  /* opacity: 0 rest state === keyframe 0's opacity, or the first paint flashes. */
  .card {
    width: 260px; flex-shrink: 0; padding: 10px;
    overflow: clip; opacity: 0;
  }
  .card-meta, .card-title-row {
    display: flex; justify-content: space-between; align-items: center;
  }
  .card-meta { margin-bottom: 2px; font-size: .65rem; letter-spacing: .04em; }
  .card-title-row { margin-bottom: 8px; font-size: .95rem; }
  .card-image { width: 100%; aspect-ratio: 36 / 50; overflow: clip; }
  .card-image img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
</head>
<body>

<section class="hero">
  <h1>Ammonoidea</h1>
  <p>[ scroll to reveal the collection ]</p>
</section>

<interact-element data-interact-key="scroll-wrapper">
  <div id="scroll-wrapper">
    <div class="sticky-container">
      <div class="cards-row"><!-- cards injected here --></div>
    </div>
  </div>
</interact-element>

<section class="end-section"><p>[ end of collection ]</p></section>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different count, card width or gap.
const N = 5;
const CARD_W = 260, GAP = 20;
const STEP = 280;          // px of spread per index step from centre
const START_BLUR = 12;     // px
const START_SCALE = 0.7;
const MID_SCALE = 0.88;    // authored, not half of anything (note 5)
const ROT = 15;            // deg at the outermost card's start pose

// Spread must clear the row, or the start poses overlap.
console.assert(STEP >= CARD_W + GAP, 'STEP too small for card width + gap');

// Per-card contain window — the stagger lives HERE, not in the keyframes (3).
const RANGES = [[15, 85], [10, 72], [0, 58], [10, 72], [15, 85]];

const PHOTOS = [
  'photo-1518791841217-8f162f1e1131', 'photo-1441974231531-c6227db76b6e',
  'photo-1470071459604-3b5ec3a7fe05', 'photo-1501785888041-af3ef285b470',
  'photo-1506744038136-46273834b3fb',
];

// Signed index step from the centre; card 1 starts on the RIGHT (mirrored, note 4).
const stepOf = i => (Math.floor(N / 2) - i);

// f = 1 at the start pose, 0.5 at the 45% keyframe, 0 at rest.
const poseAt = (i, f, opacity, blur, scale) => ({
  opacity,
  filter: `blur(${blur}px)`,
  transform: `translateX(${(stepOf(i) * STEP * f).toFixed(0)}px) `
           + `translateY(${(60 * (f === 1 ? 1 : 0)).toFixed(0)}px) `
           + `perspective(1200px) `
           + `rotateY(${(stepOf(i) / Math.floor(N / 2) * ROT * (f === 1 ? 1 : 0.3)).toFixed(1)}deg) `
           + `scale(${scale})`,
});

const row = document.querySelector('.cards-row');
PHOTOS.forEach((photo, i) => {
  // Rest pose is opacity 0, matching keyframe 0 (note 7).
  row.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="card-${i + 1}">
      <div class="card">
        <div class="card-meta"><span>white colors</span><span>[C456JK]</span></div>
        <div class="card-title-row"><span>Ammonoidea</span><span>→</span></div>
        <div class="card-image">
          <img src="https://images.unsplash.com/${photo}?w=520&h=720&fit=crop" alt="">
        </div>
      </div>
    </interact-element>`);
});

const effects = PHOTOS.map((_, i) => ({
  key: `card-${i + 1}`,
  keyframeEffect: {
    name: `card-${i + 1}-spread`,
    keyframes: [
      poseAt(i, 1,   0, START_BLUR, START_SCALE),
      { ...poseAt(i, 0.5, 1, 0, MID_SCALE), offset: 0.45 },
      poseAt(i, 0,   1, 0, 1),
    ],
  },
  rangeStart: { name: 'contain', offset: { value: RANGES[i][0], unit: 'percentage' } },
  rangeEnd:   { name: 'contain', offset: { value: RANGES[i][1], unit: 'percentage' } },
  easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
  fill: 'both',
}));

// Init order: defineInteractElement() -> one frame -> create(). Silently
// broken in both directions if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: 'scroll-wrapper', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>
```