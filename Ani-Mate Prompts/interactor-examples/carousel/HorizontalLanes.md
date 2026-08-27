# Task

Apply **Horizontal Lanes** to this section: four horizontal bands of images
drifting continuously, alternating direction, each band at a slightly different
speed, starting when the band scrolls into view.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The seam-free loop is a duplicated track, not a modulo.** Each lane's
   wrapper contains the *same* item list twice as two flex children, so the
   wrapper's content is exactly 2× one pass. Animating `translateX` between `0`
   and `-50%` shifts by exactly one copy, and the frame that ends the iteration
   is pixel-identical to the frame that starts it. `iterations: Infinity` then
   repeats with no visible jump — no wrapping arithmetic, no discontinuity to
   hide. Halve or double the copy count and the `50%` must change with it
   (`-100/copies %`).

2. **Direction is which endpoint you start from, not a sign.** Right-drifting
   lanes animate `-50% → 0`; left-drifting lanes animate `0 → -50%`. Same
   distance, same duration semantics, opposite reading. This is why the
   right-drifting lanes need a resting `transform: translateX(-50%)` in CSS —
   their keyframe 0 is `-50%`, not identity.

3. **`transform`, not `translate`.** Both the rest pose and the keyframes write
   the `transform` property. If the rest pose used the `translate` longhand and
   the keyframes used `transform`, the two would compose (outermost-first) and
   a right-drifting lane would sit a full copy-width off. Pick one; the demo
   picks `transform`.

4. **Travel is a percentage of the wrapper, so it is content-derived and needs
   no pixel measurement.** The wrapper is `width: max-content` inside an
   `overflow: hidden` lane, so total travel = one copy's width = however wide N
   items at the lane's height happen to be. Measured travel here was **26px per
   scroll stop sample**, which is not the loop distance — it is how far a lane
   creeps between two capture stops; the loop itself is time-driven at 40–55s
   per pass, so a scroll probe can only ever catch slivers of it.

5. **Speed differences are the whole effect, and they must not resolve.** The
   four durations (40s / 50s / 45s / 55s) share no small common multiple, so the
   lanes never re-align into a visible grid. Scaling all four by one factor keeps
   that property; replacing them with e.g. 40/50/45/55 *rounded to* 40/50/40/50
   destroys it — lanes 1 and 3 would then lock together forever.

6. **A lane per item-count, not a lane per row of the target.** The lane count is
   an input: any set of repeated media items that can be split into ≥2 horizontal
   groups works (ladder rung 6 — re-derive every parameter). A single-row target
   drops to one lane and keeps the mechanism; the *alternation* is what is lost,
   so with only two lanes make them opposite directions rather than same-speed.

7. **`overflow: hidden` on the lane is safe here only because nothing is
   scroll-driven.** These are `viewEnter` + time-driven loops, so no ViewTimeline
   exists to be killed. If a target section also carries a `viewProgress` effect
   on or under a lane, that lane must use `overflow: clip` instead.

8. **No perspective, no 3D.** Every animated value is a pure 2D X translation —
   measured painted/layout width was exactly **1×** on all four lanes at every
   scroll stop. Do not add `perspective`, `preserve-3d`, or `will-change` when
   adapting; there is nothing to project and they only cost a raster.

## Check before committing numbers

- Each lane's single-copy width must **exceed the lane's visible width**, or the
  `-50%` shift reveals empty track: `N_items × item_width > lane_width`. With
  `height: 100%` images and `width: auto`, item width = `lane_height ×
  image_aspect`, so shrinking the lane height can break this.
- Durations must not share a common ratio: for any two lanes, `d_i / d_j` should
  not be a small integer ratio, or the lanes visibly re-sync.
- Item count per lane ≥ 3 at desktop widths, else the loop reads as a shuttle
  rather than a stream.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Lane Height | 25 vh | `.gallery-row` `height` |
| Image Padding | 15 px | `--img-padding` (image `padding`) |
| Base Duration | 40000 ms | lane 1 `duration` (others are offsets off it) |
| Duration Spread | 15000 ms | the span the other lanes' durations distribute across |
| Title Inset | 15 px | `.image-title` `bottom`/`left`/`right` addend |
| Lane Count | 4 | how many `.gallery-row` lanes render |

Expose the **geometric inputs**, never values derived from them: no control for
the travel distance (it follows the copy count — see note 1), no control for
per-lane duration (each follows Base Duration + Duration Spread), no control for
item width (it follows Lane Height × image aspect), and no direction control per
lane (direction alternates by lane index).

Nothing here is baked into keyframes: the keyframes are pure `translateX(0)` /
`translateX(-50%)` percentages, so every control above sets CSS or a timing
field. **Duration Spread is the exception to watch** — it changes four
`duration` fields at once, so it must re-template all four effects, not one.

## Reference defaults (N = 4 lanes × 4 items, duplicated 2×) — inputs, not constants

Lane height 25vh · image padding 15px · title inset 15px · durations
40000/50000/45000/55000ms · `easing: 'linear'` · `iterations: Infinity` ·
`trigger: 'viewEnter'`, one interaction per lane · travel `-50% ↔ 0` on
`transform` · odd lanes (1, 3) drift right and rest at `translateX(-50%)`, even
lanes (2, 4) drift left and rest at identity.

Structural CSS the target will need: each lane `position: relative; overflow:
hidden` (or `clip` — note 7) and a fixed `height`; the wrapper `display: flex;
flex-direction: row; width: max-content; height: 100%` with each duplicate copy
also `display: flex; flex-direction: row`. Escaping the Wix grid needs
`grid-area: auto`, `margin: 0`, `max-width: none` (all `!important` —
structural) on the lane, and the images need `height: 100%; width: auto;
flex-shrink: 0` on their container so the track sizes to content rather than to
the grid column.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Horizontal Lanes</title>
<style>
  :root { --row-height: 25vh; --img-padding: 15px; }
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 60vh; }

  .gallery-container { display: flex; flex-direction: column; width: 100%; }

  /* overflow: hidden is safe ONLY because nothing here is scroll-driven — see note 7. */
  .gallery-row { height: var(--row-height); position: relative; overflow: hidden; }

  /* max-content: the track sizes to its two copies, so -50% is exactly one copy. */
  .animation-wrapper { display: flex; flex-direction: row; height: 100%; width: max-content; }
  .animation-wrapper > div { display: flex; flex-direction: row; height: 100%; }

  /* Rest pose === keyframe 0 for the right-drifting lanes, or the first paint jumps.
     Written on `transform`, matching the keyframes — not the `translate` longhand. */
  .lane-right .animation-wrapper { transform: translateX(-50%); }

  .image-container { position: relative; height: 100%; flex-shrink: 0; }
  .gallery-image {
    height: 100%; width: auto; object-fit: cover;
    padding: var(--img-padding); box-sizing: border-box; display: block;
  }
  .image-title {
    position: absolute;
    bottom: calc(var(--img-padding) + 15px);
    left:   calc(var(--img-padding) + 15px);
    right:  calc(var(--img-padding) + 15px);
    pointer-events: none; z-index: 2;
    font-size: .8rem; color: #fff;
  }
</style>
</head>
<body>

<div class="spacer"></div>
<div class="gallery-container"><!-- lanes injected here --></div>
<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants.
const COPIES    = 2;                    // duplicated track -> seamless loop (note 1)
const BASE_MS   = 40000;
const SPREAD_MS = 15000;
const LANES = [
  { dir: 'right', items: ['Spiral Staircase','Geometric Facade','Atrium View','Modern Interior'],
    photos: ['photo-1497366754035-f200968a6e72','photo-1486406146926-c627a92ad1ab','photo-1524758631624-e2822e304796','photo-1502672260266-1c1ef2d93688'] },
  { dir: 'left',  items: ['Night Cityscape','Flowing Lines','Abstract Lines','Bright Living Room'],
    photos: ['photo-1480714378408-67cf0d13bc1b','photo-1470071459604-3b5ec3a7fe05','photo-1509316975850-ff9c5deb0cd9','photo-1493809842364-78817add7ffb'] },
  { dir: 'right', items: ['Symmetrical Hallway','Glass Ceiling','Industrial Interior','Suspension Bridge'],
    photos: ['photo-1503387762-592deb58ef4e','photo-1449034446853-66c86144b0ad','photo-1497366811353-6870744d04b2','photo-1470004914212-05527e49370b'] },
  { dir: 'left',  items: ['Modern Museum','Skyscraper Reflection','Cozy Nook','Library Rows'],
    photos: ['photo-1518005020951-eccb494ad742','photo-1485871981521-5b1fd3805eee','photo-1522708323590-d24dbb6b0267','photo-1521587760476-6c12a4b040da'] },
];

// Travel is one copy of the track; -50% at COPIES = 2. See note 1.
const SHIFT = `translateX(-${100 / COPIES}%)`;

// Durations must not share a small integer ratio, or lanes re-sync (note 5).
const durationFor = i => BASE_MS + Math.round(SPREAD_MS * [0, 0.667, 0.333, 1][i]);
// -> 40000, 50000, 45000, 55000

const container = document.querySelector('.gallery-container');
const copy = lane => lane.items.map((t, j) => `
  <div class="image-container">
    <img class="gallery-image" src="https://images.unsplash.com/${lane.photos[j]}?w=800&h=600&fit=crop" alt="">
    <div class="image-title">${t}</div>
  </div>`).join('');

LANES.forEach((lane, i) => {
  const track = Array.from({ length: COPIES }, () => `<div>${copy(lane)}</div>`).join('');
  container.insertAdjacentHTML('beforeend', `
    <div class="gallery-row lane-${lane.dir}">
      <interact-element data-interact-key="wrapper-${i + 1}">
        <div class="animation-wrapper" id="wrapper-${i + 1}">${track}</div>
      </interact-element>
    </div>`);
});

// Direction = which endpoint you start from (note 2).
const keyframesFor = dir => dir === 'right'
  ? [{ transform: SHIFT }, { transform: 'translateX(0)' }]
  : [{ transform: 'translateX(0)' }, { transform: SHIFT }];

const interactions = LANES.map((lane, i) => ({
  key: `wrapper-${i + 1}`,
  trigger: 'viewEnter',
  effects: [{
    key: `wrapper-${i + 1}`,
    keyframeEffect: { name: `lane-${i + 1}-drift`, keyframes: keyframesFor(lane.dir) },
    duration: durationFor(i),
    easing: 'linear',
    iterations: Infinity,
  }],
}));

// Init order: defineInteractElement() -> one frame -> create(). Silent both ways.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```