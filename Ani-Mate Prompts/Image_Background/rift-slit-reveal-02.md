# Task

Apply the **Rift Slit Reveal** to this section: a full-bleed image inset in the frame that closes to a vertical slit as you scroll, then shuts to a point, while the picture pushes in behind it and the centred title and subtitle stay perfectly still.

The demo below runs. Read it for the mechanism, map it onto this section's elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The reveal is animated inset, not a clip-path or a scale.** The image wrapper is `position: absolute` and the four offsets `top/right/bottom/left` are the animated properties. They are section-relative lengths that interpolate, so the frame closes without ever distorting the picture — `object-fit: cover` re-crops as the box narrows. A `clip-path` would look the same on a photo and then have no box for the scrim, the border-radius or a caption to live in.

2. **It closes in two moves, and the order is the whole effect.** `0 → 50%`: `left/right` go `24px → 45%`, so the frame collapses horizontally to a ~10%-wide vertical slit while staying full height. `50% → 100%`: `top/bottom` go `24px → 50%`, so the slit shuts to a point. Horizontal first, then vertical — reverse them and it reads as an iris, not a rift.

3. **The image scales against the closing box, not with it.** A separate effect on the `img` runs `scale(1) → scale(1.4)` over the *same* range. As the wrapper narrows the visible crop narrows too; without the counter-push the subject shrinks out of the slit. The zoom is what keeps something worth looking at inside the last few pixels.

4. **Two effects on one key, split by `selector`.** Both live under the single `page` `viewProgress` interaction and target the rift element with `selector: '.rift-wrap'` and `selector: '.rift-container img'`. This is what keeps them on one clock — see the house rules on one cascade, one clock.

5. **The scrub is on `contain`, and it needs a pinned frame to have any.** `contain` is the phase where the sticky frame is held; a `500vh` track gives ~400vh of travel. Measured: the rift travels 668px of a 3200px page scroll — the inset animation only advances while the frame is pinned, so a short section yields a scrub that finishes before the viewer notices it started.

6. **The title and subtitle do not move at all** — measured 0px travel across the full sweep. They are pinned siblings above the rift (`z-index: 10`) and their only motion is the one-shot `viewEnter` entrance. The stillness is the point: the frame closes *around* stationary type. Do not add a parallax to the copy.

7. **Entrances are `viewEnter` + `triggerType: 'once'`, staggered by `delay`** (subtitle 600ms, image 500ms) and deliberately unmatched in duration (800ms / 1200ms), so the picture is still settling as the copy lands. They are separate interactions from the scrub, so an element gets both an entrance and a scrub without one clobbering the other — different properties (`opacity`/`transform` vs the insets).

8. **No 3D anywhere.** Measured painted/layout width is exactly 1× on every element at every scroll stop; there is no `perspective` in this animation and none should be added. The depth reads from the crop and the push-in alone.

## Check before committing numbers

- The slit must stay open at the midpoint: `100% − 2·(closed inset %)` > 0. At `45%` that is a 10% strip; anything ≥ 50% shuts the frame early and the second half animates nothing.
- The zoom must outrun the narrowing: over the horizontal half the box goes from `(sectionW − 2·edge)` to `0.10·sectionW`. Size the end scale so the subject still fills the slit — 1.4× is the floor at 10%, not a constant.
- Runway: the scrub only runs during `contain`, so travel ≈ track height − viewport. At `500vh` that is ~400vh; below ~300vh the two moves overlap perceptually into one shrink.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Scroll Length | 500 vh | `.sticky-track` `height` |
| Frame Inset | 24 px | `.rift-wrap` `top/right/bottom/left` rest pose — re-templates keyframe 0 |
| Slit Width | 45 % | the `left`/`right` value at offset 0.5 and 1 |
| Image Zoom | 1.4 | the end `scale()` in the `img-zoom` keyframes |
| Image Grade | `grayscale(1) brightness(0.7) contrast(1.2)` | `.rift-container img` `filter` |
| Entrance Delay | 500 ms | the image effect's `delay` |

Expose the **geometric inputs**, never values derived from them: no control for the slit's *percentage width* (it is `100 − 2 ×` Slit Width), no control for the midpoint offset (it is fixed at 0.5 by the two-move structure), and no control for the vertical close value (it is always `50%` — a point is a point).

Frame Inset and Slit Width are the awkward ones: both are baked into the `rift-close` keyframes, so each must re-template all three keyframes, not merely set a variable. Frame Inset must also update the element's rest pose in CSS, or keyframe 0 disagrees with the resting style and the first paint flashes.

## Reference defaults (N/A — single media element) — inputs, not constants

Track `500vh` · sticky frame `100vh`, `overflow: clip` · frame inset `24px` · slit `45%` (10% strip) at offset 0.5 · full close `top/bottom: 50%` at offset 1 · image `scale(1) → scale(1.4)`, same `contain` 0→100% range, `fill: both` · entrances `viewEnter`/`once`, subtitle 800ms @600ms delay, image 1200ms @500ms delay, `cubic-bezier(0.16, 1, 0.3, 1)`.

The rift wrapper needs `position: absolute` with all four insets set, inside a `position: relative` sticky frame — on a Wix section the frame role can be the section's own `__content` grid item spanned to the last row (house rules), and the rift can be an existing media comp given `position: absolute !important`, `grid-area: auto !important`, `margin: 0 !important`, `max-width`/`max-height: none !important` to escape the grid. The copy stays where the section put it.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Rift Slit Reveal</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; color: #fff; font-family: system-ui, sans-serif; }
  interact-element { display: block; }

  /* Runway. The scrub runs on `contain`, i.e. only while the frame is pinned. */
  .sticky-track { height: 500vh; position: relative; }
  .sticky-frame {
    position: sticky; top: 0; height: 100vh; width: 100%;
    overflow: clip;   /* clip, never hidden */
  }

  /* Stationary type, above the rift. Measured 0px travel — see note (6). */
  .title-wrap { position: absolute; bottom: calc(50% + 16px); left: 0; width: 100%;
                text-align: center; z-index: 10; pointer-events: none; }
  .title-area { overflow: clip; padding-bottom: 0.1em; }
  .title-area h1 { font-size: clamp(5rem, 16vw, 15rem); font-weight: 400;
                   line-height: 0.85; letter-spacing: 0.1em; }
  .sub-wrap { position: absolute; top: calc(50% + 20px); left: 0; width: 100%;
              text-align: center; z-index: 10; pointer-events: none; }
  .sub-area p { font-size: 0.7rem; font-weight: 300; text-transform: uppercase;
                letter-spacing: 0.3em; line-height: 2.4; }

  /* The animated element: the four insets ARE the animation — note (1).
     Rest pose equals keyframe 0 (24px all round) or the first paint flashes. */
  .rift-wrap { position: absolute; top: 24px; right: 24px; bottom: 24px; left: 24px; z-index: 5; }
  .rift-container { position: relative; width: 100%; height: 100%; overflow: clip; }
  .rift-container img {
    width: 100%; height: 100%; object-fit: cover; display: block;
    filter: grayscale(1) brightness(0.7) contrast(1.2);
  }
</style>
</head>
<body>

<interact-element data-interact-key="page">
  <section class="sticky-track">
    <div class="sticky-frame">

      <interact-element data-interact-key="title">
        <div class="title-wrap"><div class="title-area"><h1>RIFT</h1></div></div>
      </interact-element>

      <interact-element data-interact-key="subtitle" data-interact-initial="true">
        <div class="sub-wrap"><div class="sub-area">
          <p>Between the seen &amp; unseen<br>A study in negative space &amp; form</p>
        </div></div>
      </interact-element>

      <interact-element data-interact-key="rift" data-interact-initial="true">
        <div class="rift-wrap"><div class="rift-container">
          <img src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1400&auto=format&fit=crop" alt="">
        </div></div>
      </interact-element>

    </div>
  </section>
</interact-element>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different frame or track height.
const EDGE = '24px';   // resting inset; must match .rift-wrap in CSS
const SLIT = '45%';    // left/right at the midpoint → a 10% strip
const ZOOM = 1.4;      // end scale of the push-in

const range = {
  rangeStart: { name: 'contain', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'contain', offset: { value: 100, unit: 'percentage' } },
};

Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [
    // Entrances: separate interactions, so they don't clobber the scrub — note (7).
    {
      key: 'subtitle', trigger: 'viewEnter',
      effects: [{
        triggerType: 'once',
        keyframeEffect: { name: 'sub-in', keyframes: [
          { opacity: '0', transform: 'translateY(-15px) scale(0.9)', offset: 0 },
          { opacity: '1', transform: 'translateY(0) scale(1)',       offset: 1 },
        ]},
        duration: 800, delay: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both',
      }],
    },
    {
      key: 'rift', trigger: 'viewEnter',
      effects: [{
        triggerType: 'once',
        keyframeEffect: { name: 'rift-in', keyframes: [
          { opacity: '0', offset: 0 }, { opacity: '1', offset: 1 },
        ]},
        duration: 1200, delay: 500, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both',
      }],
    },
    // The scrub: two effects, one key, split by selector — note (4).
    {
      key: 'page', trigger: 'viewProgress',
      effects: [
        {
          key: 'rift', selector: '.rift-wrap',
          keyframeEffect: { name: 'rift-close', keyframes: [
            { top: EDGE,  right: EDGE, bottom: EDGE,  left: EDGE, offset: 0 },
            { top: EDGE,  right: SLIT, bottom: EDGE,  left: SLIT, offset: 0.5 },
            { top: '50%', right: SLIT, bottom: '50%', left: SLIT, offset: 1 },
          ]},
          ...range, fill: 'both',
        },
        {
          key: 'rift', selector: '.rift-container img',
          keyframeEffect: { name: 'img-zoom', keyframes: [
            { transform: 'scale(1)',            offset: 0 },
            { transform: `scale(${ZOOM})`,      offset: 1 },
          ]},
          ...range, fill: 'both',
        },
      ],
    },
  ],
});
</script>

</body>
</html>
```