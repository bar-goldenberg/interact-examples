# Task

Apply the **Mouse Track Infinite Gallery** hover to this section: a grid of image
tiles where hovering one tile blurs and pulls back its photo while its caption
fades down, so the pointer picks out an item by defocusing it rather than by
lighting it up.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The trigger element is not an animated element.** The hover is bound to
   `item-i` (the whole tile), but every effect targets `img-i` and `txt-i` —
   two *children*. That split is the whole point: the hit area stays the full
   tile (image plus caption) while the blur only touches the photo and the fade
   only touches the text. Binding the effect to the hovered element instead
   would blur the caption too and change the meaning of the animation.

2. **`.text-wrapper { pointer-events: none }` is load-bearing, not decoration.**
   The caption is a sibling inside the hit area; without it, moving the pointer
   from photo to caption re-enters through a child that has its own box and the
   600ms blur can restart mid-flight. The wrapper opts the caption out of hit
   testing so the tile is one continuous target.

3. **The blur and the fade run on different clocks on purpose** — 600ms
   `ease-out` on the image, 500ms `cubic-bezier(0.2, 0.8, 0.2, 1)` on the text.
   The text curve is ~80% done in its first third, so the caption dims almost
   immediately and the photo softens behind it. Equalising the two durations
   collapses this into a single flat dissolve.

4. **Scale goes *down*, not up.** `scale(0.95)` inside an `overflow: clip`
   wrapper pulls the photo away from its own frame, so a hair of wrapper
   background shows at the edges. That reads as recession, which is what makes
   an 8px blur legible as depth rather than as a rendering fault. Scaling up
   would crop and fight the blur.

5. **8px of blur bleeds transparent edges.** The blur is applied to the `img`,
   which fills its wrapper exactly, so the Gaussian samples outside the bitmap
   and the outer ~8px fade toward transparent. The `scale(0.95)` inset happens
   to hide most of it; if you raise the blur, shrink the scale to match or the
   soft border becomes visible against the wrapper.

6. **This is a `transition`, not a `keyframeEffect`** — there is no rest
   keyframe anywhere in the config. The rest pose is whatever the CSS says
   (`filter: none`, no transform, `opacity: 1`), and `@wix/interact` returns to
   it on pointer-out. So the section's own resting styles for these elements are
   the animation's keyframe 0 and must not be overridden.

7. **N interactions, not one.** Each tile gets its own hover interaction with
   its own two effect keys; there is no shared/sibling logic, so items are
   fully independent and a target section with a different item count just needs
   the loop bound to its own count (ladder rung 6).

8. **Caption-below → caption-anywhere.** The demo stacks caption under image,
   but nothing in the mechanism requires it: only the `img` is transformed, and
   the text is faded in place. A section whose copy overlays the media works
   unchanged — the overlay case needs a scrim (design-guidelines), and note that
   fading copy to `0.4` **on top of** a blurred photo loses much more contrast
   than fading it against a solid background.

## Check before committing numbers

- Blur must not out-run the inset: `BLUR_PX ≲ (1 − SCALE)/2 × min(tileW, tileH)`.
  At 0.95 and a 12rem (192px) tile that is `0.025 × 192 = 4.8px`, so the demo's
  8px already exceeds it slightly — acceptable at 12rem, visibly soft-edged if
  the tile gets much smaller. Raise the tile, lower the blur, or lower the scale.
- Caption opacity floor: `0.4` against a solid background is legible; over media
  it is not (design-guidelines §2). If the copy sits on the photo, raise the
  floor rather than adding a second scrim keyframe.
- Grid re-flow: `minmax(12rem, 1fr)` with `auto-fit` means the item count does
  **not** fix the column count. Check that the target's own grid keeps every
  tile wide enough for the blur inequality above at its narrowest breakpoint.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Hover Blur | 8 px | `filter` blur radius on the image transition |
| Hover Scale | 0.95 | `transform` on the image transition |
| Caption Opacity | 0.4 | `opacity` on the text transition |
| Image Duration | 600 ms | image transition `duration` |
| Caption Duration | 500 ms | text transition `duration` |

Expose the **geometric and timing inputs**, never values derived from them: no
control for the inset visible at the tile edge (it follows Hover Scale and tile
size), no control for the caption's rest opacity (it is the section's own style,
per note 6), and no separate easing control per element — the two curves are
the identity of the effect (note 3), not a parameter.

Hover Blur and Hover Scale both land inside the *same* transition's
`styleProperties` list, but on different property names (`filter` vs
`transform`), so they do not clobber. Neither is baked into keyframes — this is
a transition, so both are plain value substitutions with no re-templating.

## Reference defaults (N = 5) — inputs, not constants

Blur 8px · scale 0.95 · caption opacity 0.4 · image 600ms `ease-out` · text
500ms `cubic-bezier(0.2, 0.8, 0.2, 1)` · trigger `hover` on the tile, effects on
image and caption · grid `repeat(auto-fit, minmax(12rem, 1fr))`, gap 1rem ·
`aspect-ratio: 1` image wrapper with `overflow: clip`.

Structural CSS the target will need: `.img-wrapper { overflow: clip }` (never
`hidden`), `.gallery-img { width: 100%; height: 100%; object-fit: cover;
transform-origin: center }`, and `.text-wrapper { pointer-events: none }`. On a
Wix section the tile also needs `min-width: 0` so a grid item can shrink below
its content width, and the image comp needs `margin: 0`, `max-width: none`
(`!important` — structural) to escape the Wix grid.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Mouse Track Infinite Gallery</title>
<style>
  body { margin: 0; background: #0e0e12; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  #gallery-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
    gap: 1rem;
    padding: 1rem;
  }

  /* A grid item will not shrink below its content width without this. */
  .gallery-item { min-width: 0; }

  /* clip, never hidden. The scale(0.95) pulls the photo inside this frame —
     that inset is what makes the blur read as depth (mechanism note 4). */
  .img-wrapper { aspect-ratio: 1; overflow: clip; }

  /* Rest pose === the transition's start: no filter, no transform, opacity 1.
     There is no keyframe 0 anywhere in the config; this IS it (note 6). */
  .gallery-img {
    display: block; width: 100%; height: 100%;
    object-fit: cover; transform-origin: center;
  }

  /* Load-bearing: keeps the caption out of hit testing so the tile is one
     continuous hover target (note 2). */
  .text-wrapper { pointer-events: none; }

  .gallery-text {
    padding: .6rem .1rem 0;
    font-size: .8rem; letter-spacing: .12em;
  }
</style>
</head>
<body>

<div id="gallery-content"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different tile size or item count.
const HOVER_BLUR   = 8;      // px
const HOVER_SCALE  = 0.95;
const TXT_OPACITY  = 0.4;
const IMG_MS       = 600;
const TXT_MS       = 500;
const TILE_MIN_PX  = 192;    // 12rem, the grid's minmax floor

// Blur must not out-run the inset the scale creates, or the image's soft
// edge shows against the wrapper. See "Check before committing numbers".
console.log('blur budget at min tile',
  ((1 - HOVER_SCALE) / 2 * TILE_MIN_PX).toFixed(1) + 'px', 'vs', HOVER_BLUR + 'px');

const ITEMS = [
  ['NEON VOID',   'photo-1506744038136-46273834b3fb'],
  ['URBAN ECHO',  'photo-1469474968028-56623f02e42e'],
  ['SILENT FORM', 'photo-1501785888041-af3ef285b470'],
  ['LIQUID TIME', 'photo-1470071459604-3b5ec3a7fe05'],
  ['GLASS SOUL',  'photo-1519681393784-d120267933ba'],
];

const gallery = document.getElementById('gallery-content');
ITEMS.forEach(([label, photo], i) => {
  gallery.insertAdjacentHTML('beforeend', `
    <div class="gallery-item">
      <interact-element data-interact-key="item-${i}">
        <div>
          <div class="img-wrapper">
            <interact-element data-interact-key="img-${i}">
              <img class="gallery-img" alt=""
                   src="https://images.unsplash.com/${photo}?w=480&h=480&fit=crop">
            </interact-element>
          </div>
          <div class="text-wrapper">
            <interact-element data-interact-key="txt-${i}">
              <div class="gallery-text">${label}</div>
            </interact-element>
          </div>
        </div>
      </interact-element>
    </div>`);
});

// One independent hover interaction per tile. The trigger is the tile;
// the effects target its two children (mechanism note 1).
const interactions = ITEMS.map((_, i) => ({
  key: `item-${i}`,
  trigger: 'hover',
  effects: [
    {
      key: `img-${i}`,
      transition: {
        duration: IMG_MS,
        easing: 'ease-out',
        styleProperties: [
          { name: 'filter',    value: `blur(${HOVER_BLUR}px)` },
          { name: 'transform', value: `scale(${HOVER_SCALE})` },
        ],
      },
    },
    {
      key: `txt-${i}`,
      transition: {
        duration: TXT_MS,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        styleProperties: [{ name: 'opacity', value: String(TXT_OPACITY) }],
      },
    },
  ],
}));

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```