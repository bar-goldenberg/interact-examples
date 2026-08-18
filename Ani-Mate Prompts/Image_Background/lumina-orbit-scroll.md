# Task

Apply the **Lumina Orbit Scroll** to this section: a full-bleed hero image that shrinks and tumbles away into the centre of the frame as you scroll, while the copy over it holds still and then lifts and fades at the very end.

The demo below runs. Read it for the mechanism, map it onto this section's elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The image is not doing real 3D — and it must not pretend to.** Measured over 9 scroll stops, peak painted width / layout width was exactly **1×** at every stop, so the `perspective(1500px)` inside the keyframes is not producing any foreshortening you can see. The `rotateX`/`rotateY` values read as a slight skew on a shrinking rectangle, nothing more. Treat this as a **scale-and-drift** animation: the tilt is seasoning, not the mechanism. Do not sell it as a 3D card, and do not size the section as if the near edge magnifies.

2. **The shrink is the whole animation; everything else is timed off it.** The scale run is `1.1 → 0.65 → 0.40 → 0.20 → 0.01` at offsets `0 / .35 / .5 / .75 / 1`. It is deliberately front-loaded — 41% of the total shrink happens in the first 35% of travel — so the image visibly *leaves* early and then dwindles. A linear scale ramp reads as a slow zoom-out and loses the effect entirely.

3. **`borderRadius` is what makes it read as an object rather than a viewport.** `0 → 20 → 28 → 32px` tracks the scale down: at full bleed the image is the frame, so radius 0; once it detaches it becomes a card, so it gains corners. Because radius is in `px` and the element is shrinking, the *apparent* radius grows faster than the number — 32px on a 0.2-scale element reads like 160px. That is intended; keep the numbers absolute, do not convert to `%`.

4. **The grade drifts warm-then-dead, and it is a fade, not a dim.** `brightness` runs `.5 → .75 → .8 → .5 → .3` (it *brightens* as the image detaches, then dies), `saturate` `1.3 → 1.1 → .9 → .3 → .2`, with `grayscale`/`sepia` ramping in only over the last quarter. The image ends at `opacity: 0`, so the low end of the brightness curve is legal here — it is not a resting state anyone reads (design-guidelines §2 applies to dimming that *rests*; this one exits).

5. **`grayscale` and `sepia` must be present in every keyframe, including the ones where they are `0`.** They are written as `grayscale(0) sepia(0)` at offset 0 for exactly this reason — a `filter` list whose function count changes between keyframes will not interpolate, and the whole grade snaps instead of drifting.

6. **The copy is on the same clock but idles for 70% of it.** `h1` and `p` hold identity through offset `.7`, then leave: title `translateY(-20px) scale(0.95)` to `opacity .7`, subtitle `translateY(-10px)` to `opacity .5`. Neither goes to 0 — the section is meant to end with the copy still faintly there over black. The 0.7 hold is what keeps the copy legible while the image is doing the interesting part; move it and the two motions fight.

7. **The range is `contain`, not `cover`.** With a 500vh track and a 100vh sticky frame, `contain` is exactly the pinned phase — the scrub starts when the frame locks to the top and ends when it unlocks. On `cover` the animation would already be part-done at the moment the section arrives.

8. **Nothing here needs a wrapper element.** The `.image-wrapper` in the demo only centres the image inside the sticky frame; the animated properties all live on the `img` itself. On a Wix section the sticky-frame role can be re-hosted onto an existing grid item (ladder rung 2) and the image animated in place — no new box is required.

## Check before committing numbers

- The track must give the pin real travel: `track height − sticky frame height` is the scrub distance. At 500vh/100vh that is 400vh; below ~250vh of surplus the front-loaded scale run reads as a jump cut.
- The end scale is `0.01`, not `0` — a `0` scale can collapse the element's box and drop the last frame. Keep a nonzero floor and let `opacity: 0` do the disappearing.
- Copy must clear its hold before the image is gone: the copy's exit starts at `.7`, where the image is still at scale `0.2`+. If you shorten the image's run, move the copy's hold offset with it.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Scroll Length | 500 vh | track `height` |
| Frame Height | 100 vh | sticky frame `height` |
| Start Scale | 1.1 | keyframe 0 `transform` scale — re-templates the scale run |
| Corner Radius | 32 px | final `borderRadius` — re-templates the radius run |
| Peak Brightness | 0.8 | mid `brightness()` in the filter run |
| Copy Hold | 0.7 | the `offset` of the copy's second keyframe |

Expose the **geometric inputs**, never values derived from them: no control for the intermediate scales (they follow Start Scale along the front-loaded curve), no control for the intermediate radii (they follow Corner Radius), no control for `saturate`/`grayscale`/`sepia` (they follow the same drift as brightness), and no control for the tilt angles — per (1) they are not doing measurable work.

**Baked into keyframes:** Start Scale and Corner Radius both live inside `transform` / `borderRadius` *values*, so each must re-template the whole 5-keyframe run, not set a variable. Copy Hold rewrites a keyframe `offset`, which is likewise a keyframe edit.

## Reference defaults (N = 1 image, 2 copy blocks) — inputs, not constants

Track 500vh · sticky frame 100vh, `top: 0`, `overflow: clip` · image `width: 100vw; height: 100vh; object-fit: cover` · scale `1.1/.65/.40/.20/.01` at `0/.35/.5/.75/1` · radius `0/20/28/32/32px` · brightness `.5/.75/.8/.5/.3` · saturate `1.3/1.1/.9/.3/.2` · grayscale `0/0/0/.4/.6` · sepia `0/0/.1/.2/.5` · opacity `1/1/1/.6/0` · copy holds identity to `.7` then exits · range `contain` 0→100%, `fill: both`.

On a Wix section the image needs `grid-area: auto`, `margin: 0`, `max-width`/`max-height: none` (all `!important` — structural) to escape the grid and fill the frame, and `overflow: clip` belongs on the sticky frame.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Lumina Orbit Scroll</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; color: #fff; font-family: system-ui, sans-serif; }
  interact-element { display: block; }

  /* The scrub's only fuel is this height. 500vh - 100vh = 400vh of travel. */
  .sticky-track { height: 500vh; position: relative; }

  /* clip, never hidden - hidden creates a scroll container and kills ViewTimeline. */
  .sticky-frame {
    position: sticky; top: 0; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    overflow: clip;
  }

  /* Rest pose === keyframe 0, or the first paint flashes. */
  .sticky-frame img {
    display: block; width: 100vw; height: 100vh; object-fit: cover;
    transform: scale(1.1) perspective(1500px) rotateX(0deg) rotateY(0deg);
    border-radius: 0px;
    filter: brightness(0.5) saturate(1.3) grayscale(0) sepia(0);
    opacity: 1;
  }

  .hero-content {
    position: absolute; inset: 0; z-index: 10;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 12px;
    pointer-events: none;
  }
  .hero-content h1 {
    font-size: clamp(3rem, 10vw, 7.5rem); font-weight: 400; font-style: italic;
    letter-spacing: .12em; line-height: .95;
    opacity: 1; transform: translateY(0) scale(1);
  }
  .hero-content p {
    font-size: clamp(.75rem, 1.2vw, .95rem); font-weight: 300;
    letter-spacing: .35em; text-transform: uppercase;
    color: rgba(255,255,255,.55);
    opacity: 1; transform: translateY(0);
  }
</style>
</head>
<body>

<interact-element data-interact-key="track">
  <section class="sticky-track">
    <div class="sticky-frame">
      <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2074&auto=format&fit=crop" alt="">
      <div class="hero-content">
        <h1>Ethereal</h1>
        <p>Between silence and light</p>
      </div>
    </div>
  </section>
</interact-element>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants. The scale run is front-loaded on purpose - see note (2).
const SCALE  = [1.10, 0.65, 0.40, 0.20, 0.01];
const TILT   = [[0, 0], [12, -15], [-8, 12], [0, 0], [0, 0]];   // deg; seasoning only - note (1)
const RADIUS = [0, 20, 28, 32, 32];                              // px, absolute - note (3)
const BRIGHT = [0.50, 0.75, 0.80, 0.50, 0.30];
const SATUR  = [1.30, 1.10, 0.90, 0.30, 0.20];
const GRAY   = [0, 0, 0, 0.4, 0.6];                              // present at 0 - note (5)
const SEPIA  = [0, 0, 0.1, 0.2, 0.5];
const OPAC   = [1, 1, 1, 0.6, 0];
const OFFSET = [0, 0.35, 0.5, 0.75, 1];
const COPY_HOLD = 0.7;

const range = {
  rangeStart: { name: 'contain', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'contain', offset: { value: 100, unit: 'percentage' } },
};

const imageKeyframes = OFFSET.map((offset, i) => ({
  offset,
  transform: `scale(${SCALE[i]}) perspective(1500px) rotateX(${TILT[i][0]}deg) rotateY(${TILT[i][1]}deg)`,
  borderRadius: `${RADIUS[i]}px`,
  filter: `brightness(${BRIGHT[i]}) saturate(${SATUR[i]}) grayscale(${GRAY[i]}) sepia(${SEPIA[i]})`,
  opacity: `${OPAC[i]}`,
}));

Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{
    key: 'track',
    trigger: 'viewProgress',
    effects: [
      {
        selector: 'img',
        keyframeEffect: { name: 'orbit-image', keyframes: imageKeyframes },
        ...range, fill: 'both',
      },
      {
        selector: 'h1',
        keyframeEffect: { name: 'title-reveal', keyframes: [
          { opacity: '1', transform: 'translateY(0) scale(1)', offset: 0 },
          { opacity: '1', transform: 'translateY(0) scale(1)', offset: COPY_HOLD },
          { opacity: '0.7', transform: 'translateY(-20px) scale(0.95)', offset: 1 },
        ] },
        ...range, fill: 'both',
      },
      {
        selector: '.hero-content p',
        keyframeEffect: { name: 'subtitle-fade', keyframes: [
          { opacity: '1', transform: 'translateY(0)', offset: 0 },
          { opacity: '1', transform: 'translateY(0)', offset: COPY_HOLD },
          { opacity: '0.5', transform: 'translateY(-10px)', offset: 1 },
        ] },
        ...range, fill: 'both',
      },
    ],
  }],
});
</script>

</body>
</html>
```