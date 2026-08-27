# Task

Apply **Vertical Lanes** to this section: four vertical image columns that scroll continuously in alternating directions once the section enters view, each lane at a slightly different speed so they drift out of phase.

The demo below runs. Read it for the mechanism, map it onto this section's elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The loop is seamless only because the track holds the item list TWICE and travels exactly 50% of itself.** `translateY(-50%)` ↔ `translateY(0)` on a 2N-item track moves it by exactly the height of one copy, so the frame at 100% is pixel-identical to the frame at 0% and the `Infinity` iteration restart is invisible. Break either half of that pact — one copy, or any travel other than 50% — and the lane visibly jumps every cycle. The duplicate list is content, not decoration: do not de-duplicate it when sanitizing or adapting.

2. **Direction is the keyframe order, not a sign.** Down-lanes are `-50% → 0`, up-lanes are `0 → -50%`; both use the same two values. That is why every lane's *rest* pose differs: a down-lane must rest at `translateY(-50%)` and an up-lane at `translateY(0)`, or the first paint jumps by half the track.

3. **The lane speeds are deliberately non-multiples** — 40s, 50s, 45s, 55s. Any two lanes whose periods share a small ratio re-sync periodically and read as one block sliding; co-prime-ish durations keep them permanently out of phase. When re-deriving for a different lane count, keep the spread and avoid 1:2 / 2:3 relations.

4. **The trigger element and the animated element are deliberately different.** One `viewEnter` interaction per lane, keyed to the *gallery* with `selector: .gallery-column:nth-child(i)`, targeting the lane's own key. So each lane starts when *its own column* enters view, not when the gallery does — on a wide gallery this matters, and it is what makes the four starts independent rather than simultaneous.

5. **`triggerType: 'state'` is what keeps an infinite loop alive.** A time-driven `viewEnter` effect defaults to running once; `state` holds the animation while the condition is true, which is the only way `iterations: Infinity` survives.

6. **This animation is purely 2D and has no depth cue at all.** Measured: painted/layout width is exactly 1× on the gallery and all four lanes at every scroll stop. Do not add `perspective`, `preserve-3d`, or a Z term when adapting — there is nothing to project, and the extra containing block is a hazard for any scroll-driven descendant.

7. **The lane clip is per-column, and it is the column, not the track.** `overflow: clip` on `.gallery-column` with the track at `height: max-content` is what hides the wrap point. Moving the clip up to the container would let one lane's overflow show in its neighbour's gutter.

## Check before committing numbers

- Each lane's track must overflow its column: `N · itemHeight > columnHeight`. If one copy of the list is shorter than the visible column, the wrap point is on screen and the 50% travel exposes empty space.
- Travel is `50%` of the *track*, so the perceived speed is `(N · itemHeight) / duration` px/s — a lane with taller images at the same duration scrolls visibly faster. Re-derive durations from item height, not by copying 40/50/45/55s.
- Column width × lane count must equal the container width: `laneCount · colWidth = 100%` (4 × 25vw here). A lane count change is a width change.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Column Width | 25 vw | `--col-width` (`.gallery-column` width) |
| Image Padding | 15 px | `--img-padding` (image `padding`) |
| Base Duration | 40000 ms | lane 1 `duration` |
| Duration Spread | 5000 ms | the per-lane offset added to Base Duration |
| Gallery Height | 100 vh | `.gallery-container` height |
| Image Aspect | auto | `.gallery-image` `aspect-ratio` |

Expose the **geometric inputs**, never values derived from them: no control for the per-lane durations individually (they follow Base Duration + Duration Spread), no control for lane direction (it follows lane parity), no control for track travel (it is fixed at 50% by mechanism note 1), and no control for lane count (it follows how many columns the section has).

No control here is baked into keyframes — the keyframes are the two constants `translateY(-50%)` / `translateY(0)` and stay literal for every lane and every speed. That is unusual and worth keeping: it means the speed controls only touch `duration`.

## Reference defaults (N = 4 lanes, 4 items per copy, 8 per track) — inputs, not constants

Column width 25vw · image padding 15px · gallery 100vh · durations 40000 / 50000 / 45000 / 55000 ms · `easing: linear`, `iterations: Infinity`, `fill: 'both'`, `triggerType: 'state'`, `trigger: viewEnter` · lanes 1 and 3 travel `-50% → 0` (down) and rest at `translateY(-50%)`; lanes 2 and 4 travel `0 → -50%` (up) and rest at `translateY(0)`. Measured travel over a 9-stop sweep: 62px on the gallery and each lane (the loop is time-driven, so a scroll sweep samples arbitrary phases — see the verification note).

Structural CSS the target will need to escape the Wix grid: `overflow: clip` on the section (never `hidden`), `overflow: clip` on each column, `height: max-content` on each track, and on each column `grid-area: auto`, `margin: 0`, `max-width`/`max-height: none` — all `!important`, all structural, never on an animated property.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Vertical Lanes</title>
<style>
  :root { --col-width: 25vw; --img-padding: 15px; }
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; overflow: clip; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  .gallery-container { display: flex; flex-direction: row; width: 100%; height: 100vh; }

  /* The clip is per-column: it hides this lane's wrap point without letting
     the lane bleed into its neighbour's gutter. clip, never hidden. */
  .gallery-column { flex: none; width: var(--col-width); position: relative; overflow: clip; }

  /* Track = the item list TWICE, at max-content height. 50% travel == one
     copy, which is what makes the Infinity restart invisible. See note (1). */
  .animation-wrapper { display: flex; flex-direction: column; width: 100%; height: max-content; }
  .animation-wrapper > div { display: flex; flex-direction: column; width: 100%; }

  .image-container { position: relative; width: 100%; flex-shrink: 0; }
  .gallery-image {
    width: 100%; height: auto; object-fit: cover;
    padding: var(--img-padding); box-sizing: border-box; display: block;
  }
  .image-title {
    position: absolute; bottom: calc(var(--img-padding) + 15px);
    left: calc(var(--img-padding) + 15px); right: calc(var(--img-padding) + 15px);
    text-align: center; font-size: .8rem; pointer-events: none; z-index: 2;
  }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key="gallery-lanes">
  <div class="gallery-container" id="gallery-container"><!-- lanes injected --></div>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive durations from item height, not by copying.
const BASE_DURATION = 40000, SPREAD = 5000;
const LANES = [
  { dir: 'down', photos: ['photo-1506744038136-46273834b3fb', 'photo-1469474968028-56623f02e42e', 'photo-1501785888041-af3ef285b470', 'photo-1470071459604-3b5ec3a7fe05'],
    titles: ['Spiral Staircase', 'Geometric Facade', 'Atrium View', 'Modern Interior'] },
  { dir: 'up',   photos: ['photo-1519681393784-d120267933ba', 'photo-1493246507139-91e8fad9978e', 'photo-1439405326854-014607f694d7', 'photo-1497366216548-37526070297c'],
    titles: ['Night Cityscape', 'Flowing Lines', 'Abstract Lines', 'Bright Living Room'] },
  { dir: 'down', photos: ['photo-1511818966892-d7d671e672a2', 'photo-1518005020951-eccb494ad742', 'photo-1503387762-592deb58ef4e', 'photo-1477959858617-67f85cf4f1df'],
    titles: ['Symmetrical Hallway', 'Glass Ceiling', 'Industrial Interior', 'Suspension Bridge'] },
  { dir: 'up',   photos: ['photo-1497604401993-f2e922e5cb0a', 'photo-1487958449943-2429e8be8625', 'photo-1493809842364-78817add7ffb', 'photo-1521587760476-6c12a4b040da'],
    titles: ['Modern Museum', 'Skyscraper Reflection', 'Cozy Nook', 'Library Rows'] },
];

// Duration alternates so no two lanes share a small period ratio — note (3).
const durationFor = i => BASE_DURATION + (i % 2 ? 10000 : 0) + Math.floor(i / 2) * SPREAD;

// Each lane's rest pose IS its keyframe 0, or the first paint jumps 50%.
const REST = { down: 'translateY(-50%)', up: 'translateY(0)' };
const KEYFRAMES = { down: [{ transform: 'translateY(-50%)' }, { transform: 'translateY(0)' }],
                    up:   [{ transform: 'translateY(0)' }, { transform: 'translateY(-50%)' }] };

const copy = lane => lane.photos.map((p, j) => `
  <div class="image-container">
    <img class="gallery-image" src="https://images.unsplash.com/${p}?w=640&h=800&fit=crop" alt="">
    <div class="image-title">${lane.titles[j]}</div>
  </div>`).join('');

const container = document.getElementById('gallery-container');
LANES.forEach((lane, i) => {
  const items = copy(lane);
  // The list appears TWICE. This duplication is the mechanism, not filler.
  container.insertAdjacentHTML('beforeend', `
    <div class="gallery-column">
      <interact-element data-interact-key="wrapper-${i + 1}">
        <div class="animation-wrapper" style="transform:${REST[lane.dir]}">
          <div>${items}</div>
          <div>${items}</div>
        </div>
      </interact-element>
    </div>`);
});

// Sanity: one copy of the list must be taller than the column, or the wrap
// point is visible and the 50% travel exposes empty space.
requestAnimationFrame(() => {
  const col = container.querySelector('.gallery-column');
  const track = col.querySelector('.animation-wrapper');
  console.assert(track.offsetHeight / 2 > col.offsetHeight, 'one list copy is shorter than the column');
});

// Trigger element != animated element: each lane starts when ITS column
// enters view. triggerType 'state' is what keeps Infinity alive — note (5).
const interactions = LANES.map((lane, i) => ({
  key: 'gallery-lanes',
  selector: `.gallery-column:nth-child(${i + 1})`,
  trigger: 'viewEnter',
  effects: [{
    key: `wrapper-${i + 1}`,
    triggerType: 'state',
    keyframeEffect: { name: `lane-${i + 1}`, keyframes: KEYFRAMES[lane.dir] },
    duration: durationFor(i),
    easing: 'linear',
    iterations: Infinity,
    fill: 'both',
  }],
}));

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```