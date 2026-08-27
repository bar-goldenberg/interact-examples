# Task

Apply the **Looping Sphere Gallery** to this section: a shell of image cards
suspended in 3D that the camera flies straight through as you scroll, cards
sweeping past the lens and receding behind you while their label scrims fade up.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The camera starts *inside* the shell — that is the piece, not a bug.** The
   flight is one `translateZ` on the stage, `+1200 → −1200`, against
   `perspective: 800`. The track is 500vh at the top of the page, so `cover`
   spans 600vh and 100vh of it is already spent at scroll 0: progress is exactly
   `100/600 = 1/6`, where `translateZ` = `1200 − 2400/6` = **800px = the
   perspective**. The sphere's centre sits precisely on the camera plane on the
   first painted frame. Two consequences: the keyframes' first 1/6 is
   unreachable unless the track is *not* at page top, and cards whose own
   `translateZ` puts them past the lens are clipped individually all the way
   through. Do not "fix" that clipping — it is the fly-through.

2. **Two keyframes, not three.** The source's middle `translateZ(0px)` is
   exactly the linear midpoint of `1200` and `−1200` at offset 0.5, so it is
   redundant and only buys the CSS/WAAPI easing disagreement. The overlay's
   third keyframe is *not* redundant — `1 @ 0.35` → `1 @ 1` is a deliberate
   hold, and its constant tail can't double-ease.

3. **Every item pose is closed-form, not authored.** For item `i` of `N`:
   `h = 1 − 2i/(N−1)`, `y = R·h`, `r = R·√(1−h²)`, `θ = i·137.508°`, then
   `translateX(r sinθ) translateY(y) translateZ(r cosθ) rotateY(θ) rotateX(−asin h)`.
   The two rotations aim the card's normal down the radius — that is what makes
   it read as a shell rather than a cloud of rectangles. The source proves the
   formula: its six cards are samples `i = 0, 5, 10, 28, 46, 55` of an `N = 56`
   set, their `y` values are exactly `500(1 − 2i/55)` (500, 409.1, 318.2, −9.1,
   −336.4, −500) and their `rotateX` exactly `−asin(y/R)` (−90, −54.9, −39.5,
   +1.0, +42.3, +90). Only the longitudes differ: the source uses a
   variable-increment spiral, replaced here by the golden angle (rung 6).

4. **Both faces are load-bearing, because you see the shell from inside.**
   `.face.back` is `rotateY(180deg)` and both faces carry
   `backface-visibility: hidden`, so the front reads outside-in and the back
   inside-out. For most of the flight the viewer is reading the *back* labels.
   Drop the back face and half the animation is blank rectangles.

5. **The 200%-box-at-`scale(.5)` wrapper is a raster budget.** `.item-content`
   nets 1× (200% × 0.5), so it looks like a no-op. It isn't: (4) forces layer
   promotion and pins the raster (house rules), while a card near the camera
   plane paints up to ~8× (see checks). Laying the face out at 2× and painting
   it at 0.5 buys one factor of two of that back. Because of it, every font size
   inside a face is doubled — `h3` at `1.9rem` paints as `0.95rem`.

6. **The clock and the moving element are in different subtrees.** The
   interaction key is the empty 500vh `.zoom-track`; the effect key is `.scene`
   inside a `position: fixed` overlay — so there is no sticky and no runway
   inside the animated subtree. Re-hosting on a Wix section (rung 2): the
   runway becomes section height and the stage is pinned with sticky; the
   geometry above is untouched.

7. **`.sphere` is dropped — it and `.scene` are the same element.** The source
   nests two zero-size `preserve-3d` wrappers and animates only the outer one.
   The inner has no job and is one more link in the chain between the
   perspective and `.item` that can silently go flat.

## Check before committing numbers

- **Cards must not tile into a solid wall:** mean neighbour spacing on the shell
  is `2R·√(π/N)`; keep it above the card's diagonal `√(w² + h²)`. At R = 500,
  N = 56, 150×107 that is **237px vs 184px** — raising N without raising R turns
  the fly-through into a fly-into.
- **Size against the magnified pass, not the layout box.** A card at total depth
  `z` paints `P/(P − z)`×. At progress 0 the nearest un-clipped plane is
  `z = +700`, i.e. `800/100 = 8×` — a 150px card paints ~1200px. At the far end
  (`translateZ(−1200)`) the shell paints 0.53×–0.32×.
- **Something must be on screen at progress 0:** requires `startZ − R < P`
  (1200 − 500 = 700 < 800). At equality the first frame is empty.

## Controls to expose

Seven, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Flight Depth | 1200 px | scene `transform` — re-templates both keyframes (`±`span) |
| Perspective | 800 px | `.viewport` `perspective` |
| Shell Radius | 500 px | each item's static `transform` (all N re-templated) |
| Card Width | 150 px | item `width` |
| Card Height | 107 px | item `height` |
| Scroll Length | 500 vh | `.zoom-track` `height` |
| Scrim Fade End | 35 % | overlay-fade keyframe `offset` (writes `opacity`) |

Expose the **geometric inputs**, never values derived from them: no control for
the flight midpoint (it is 0, the span's centre — that's note 2), no control for
per-item latitude/longitude or `rotateX` (they follow radius and count), none
for `left`/`top` (they are `−w/2`, `−h/2`), none for the back face's
`rotateY(180deg)`, and none for magnification (it follows perspective and
depth). Item count is given by the section, not by a slider.

Two controls are **baked into transforms and must re-template, not set a
variable**: Flight Depth lives inside the scene's `transform`, so both
keyframes are rewritten; Shell Radius lives inside every item's inline
`transform`, so all N item poses are rewritten.

## Reference defaults (N = 56) — inputs, not constants

R 500px · card 150×107 (aspect 1.4) · perspective 800px · flight
`translateZ(1200px) → translateZ(−1200px)`, `viewProgress` on the 500vh track,
`cover` 0→100%, `fill: both`, two keyframes, no easing · longitude step 137.508°
· scrim `opacity` 0 → 1 by 35%, held to 100%.

Rest pose is keyframe 0: `.scene` rests at `translateZ(1200px)` and both
overlays at `opacity: 0`. The overlay effect's `selector` needs a **leading
space** (`' .overlay'`) — the source's `'.overlay'` joins to
`[data-interact-key="scene"].overlay` and matches nothing.

On a Wix section: `perspective` + `transform-style: preserve-3d` on the pinned
stage, `overflow: clip` up on the section (never on the stage or any 3D link),
and each item needs `position: absolute`, `left: 50%; top: 50%`,
`translate: -50% -50%`, plus `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` — all `!important`, all structural — to escape the
grid. The stage must be a **direct** child of the perspective element.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Looping Sphere Gallery</title>
<style>
  html, body { margin: 0; background: #05060a; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  /* Camera. perspective reaches DIRECT children, and display: contents above
     keeps .scene one. pointer-events: none so the full-screen overlay doesn't
     swallow the page. No overflow here — it would force transform-style: flat. */
  .viewport {
    position: fixed; inset: 0;
    perspective: 800px;
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  }

  /* The one animated element. Zero-size anchor at the shell's centre.
     Rest pose === keyframe 0, or the first paint flashes. */
  .scene {
    position: relative; width: 0; height: 0;
    transform-style: preserve-3d;
    transform: translateZ(1200px);
  }

  .item { position: absolute; transform-style: preserve-3d; }

  /* 2x layout painted at 0.5 — net 1x. Raster headroom, see mechanism note (5). */
  .item-content {
    position: absolute; left: -50%; top: -50%; width: 200%; height: 200%;
    transform: scale(.5); transform-style: preserve-3d;
  }

  /* backface-visibility is required here: it is the front/back switch (4). */
  .face {
    position: absolute; inset: 0;
    backface-visibility: hidden; overflow: clip;
    display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
    text-align: center; padding-bottom: 16px;
  }
  .face.back { transform: rotateY(180deg); }
  .face img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
  /* Font sizes are doubled: this paints at 0.95rem after the 0.5 downscale. */
  .face h3 { position: relative; z-index: 2; margin: 0; font-size: 1.9rem; letter-spacing: .06em; }

  .overlay { position: absolute; opacity: 0; }   /* rest === keyframe 0 */
  .face.front .overlay {
    left: 0; bottom: 0; width: 100%; height: 50%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
  }
  .face.back .overlay { inset: 0; background: rgba(4,6,12,.72); }

  .zoom-track { height: 500vh; }
</style>
</head>
<body>

<div class="viewport">
  <interact-element data-interact-key="scene">
    <div class="scene"><!-- items injected here --></div>
  </interact-element>
</div>

<!-- The clock: an empty runway, in a different subtree from what moves (6). -->
<interact-element data-interact-key="zoom-track">
  <div class="zoom-track"></div>
</interact-element>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for another item count, radius or card size.
const N = 56, R = 500, CARD_W = 150, CARD_H = 107;
const PERSPECTIVE = 800, DEPTH = 1200;   // camera distance; half the flight
const GOLDEN = 137.508;                  // longitude step, deg

// Cards must not tile into a solid wall; and size against the magnified pass.
console.assert(Math.hypot(CARD_W, CARD_H) < 2 * R * Math.sqrt(Math.PI / N), 'cards overlap');
console.log('nearest un-clipped plane at p=0 magnifies',
  (PERSPECTIVE / (PERSPECTIVE - (DEPTH - R))).toFixed(1) + '×');
// A 500vh track at page top: cover spans 600vh, 100vh is spent at scroll 0.
console.log('translateZ at scroll 0 =', DEPTH - 2 * DEPTH / 6, '(= perspective)');

const PHOTOS = [
  'photo-1506744038136-46273834b3fb', 'photo-1469474968028-56623f02e42e',
  'photo-1501785888041-af3ef285b470', 'photo-1470071459604-3b5ec3a7fe05',
  'photo-1519681393784-d120267933ba', 'photo-1441974231531-c6227db76b6e',
];
const LABELS = ['CYBER CORE', 'ABSTRACT A', 'DATA MESH', 'DEEP SPACE', 'NATURE X', 'SIGNAL 7'];

const rad = d => d * Math.PI / 180;
const scene = document.querySelector('.scene');

// Closed-form shell pose — mechanism note (3). rotateY/rotateX aim the card's
// normal down the radius, which is what reads as a shell.
for (let i = 0; i < N; i++) {
  const h = 1 - 2 * i / (N - 1);                       // +1 bottom pole → −1 top pole
  const r = R * Math.sqrt(Math.max(0, 1 - h * h));
  const th = i * GOLDEN;
  const x = r * Math.sin(rad(th)), y = R * h, z = r * Math.cos(rad(th));
  const lat = -Math.asin(h) * 180 / Math.PI;
  const pose = `translateX(${x.toFixed(1)}px) translateY(${y.toFixed(1)}px) `
             + `translateZ(${z.toFixed(1)}px) rotateY(${th.toFixed(1)}deg) rotateX(${lat.toFixed(1)}deg)`;
  const photo = PHOTOS[i % PHOTOS.length];
  scene.insertAdjacentHTML('beforeend', `
    <div class="item" style="width:${CARD_W}px;height:${CARD_H}px;
         left:${-CARD_W / 2}px;top:${-CARD_H / 2}px;transform:${pose}">
      <div class="item-content">
        <div class="face front">
          <img src="https://images.unsplash.com/${photo}?w=320&h=228&fit=crop" alt="">
          <div class="overlay"></div>
          <h3>${LABELS[i % LABELS.length]}</h3>
        </div>
        <div class="face back">
          <div class="overlay"></div>
          <h3>SYSTEM ${String(i).padStart(2, '0')}</h3>
        </div>
      </div>
    </div>`);
}

const range = {
  rangeStart: { name: 'cover', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'cover', offset: { value: 100, unit: 'percentage' } },
};

// Init order: defineInteractElement() -> one frame -> create(). Silent both ways.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{
    key: 'zoom-track',
    trigger: 'viewProgress',
    effects: [
      { // Two keyframes: the source's translateZ(0) middle frame is the exact
        // linear midpoint and only buys an easing disagreement. Note (2).
        key: 'scene', ...range, fill: 'both',
        keyframeEffect: { name: 'zoom-scene', keyframes: [
          { transform: `translateZ(${DEPTH}px)` },
          { transform: `translateZ(${-DEPTH}px)` },
        ]},
      },
      { // LEADING SPACE — selector joins to the key without one, so '.overlay'
        // would emit [data-interact-key="scene"].overlay and match nothing.
        key: 'scene', selector: ' .overlay', ...range, fill: 'both',
        keyframeEffect: { name: 'overlay-fade', keyframes: [
          { opacity: 0, offset: 0 },
          { opacity: 1, offset: 0.35 },
          { opacity: 1, offset: 1 },
        ]},
      },
    ],
  }],
});
</script>

</body>
</html>
```