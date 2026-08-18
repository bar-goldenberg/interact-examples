# Task

Apply **Manifest Shrink Scroll** to this section: a photo that fills the frame
behind the headline collapses — first downward, then inward — until it is parked
as a small picture in the bottom-left corner, while the image inside it zooms in
as the frame closes.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The collapse is inset animation anchored at one corner.** `left` and
   `bottom` stay at the gutter `G` for the whole scrub; only `top` and `right`
   animate. So `width = 100% − right − G` and `height = 100% − top − G`, and the
   box shrinks *into its bottom-left corner* rather than toward its centre.
   Re-host this on any absolutely-positioned box in the section — the corner it
   collapses into is whichever two insets you leave static.

2. **The two-stage sweep lives in the keyframe offsets, not in two effects.**
   `0 → 0.5` moves `top` only (the box loses height at full width); `0.5 → 1`
   moves `right` only (it narrows). One effect, three keyframes, an L-shaped
   sweep — down, then in. Reverse the reading order by swapping which inset the
   first half animates; move the `0.5` to bias one leg longer.

3. **The `scale(1) → scale(1.25)` on the `img` is a counter-zoom, not a
   flourish.** At the end pose the box is a narrow portrait, so `object-fit:
   cover` is already magnifying the photo hard; pushing to 1.25 as the frame
   closes turns the whole move into a *descent into detail* — the picture tightens
   onto its subject instead of the subject dwindling with the box. Drop it and the
   collapse reads as a zoom-out, and the end pose is a shrunken thumbnail rather
   than a crop.

4. **The timeline host is the track, not the box.** The scrub is declared on the
   `page` key (the 400vh track — the only element that actually travels) and
   re-targeted onto the box with `key` + `selector`. The sticky frame has no
   travel of its own, so hanging the effect there gives a dead scrub.

5. **Entrance and scrub share `.image-wrap` and must stay on different
   properties.** The `viewEnter` intro writes `transform` + `opacity`; the scrub
   writes `top`/`right`. Rewrite the intro as a `top` slide and it silently
   fights the collapse. The intro is `triggerType: 'once'` and is finished before
   the pinned phase begins — it will not appear in a scroll-sweep capture. Note
   that the intro now resolves onto the *full-bleed* pose, so the section opens on
   a full-frame photo.

6. **The start pose puts the photo under the copy**, so the headline and columns
   are text-over-media from the very first frame — the scrim has to be present
   from the start (design-guidelines 1), gradient running *down* from the top
   because the copy sits top-left, not bottom. Unlike the expanding variant, there
   is no grace period before the overlap: get the scrim right or the headline is
   unreadable on frame one.

## Check before committing numbers

- The copy stack must clear the end box: `titleBlockHeight + 40px ≤ endTop ×
  frameHeight` (0.60 here). Otherwise the two overlap after the collapse has
  landed — the pose the user rests on.
- The end box must still read as a photo, not a sliver:
  `(1 − endRight) ≥ 0.18` of frame width.
- `object-fit: cover` crops the image twice — once near-landscape (`W−2G ×
  H−2G`), once portrait (`0.25W × 0.40H`). The subject must survive both, so set
  `object-position` rather than trusting centre.
- Consequence to size against: at offset 0.5 the box is full width and already
  only 40% tall — a wide band along the bottom. That is a pose the user can stop
  on.

## Controls to expose

Seven, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Runway | 400 vh | `.track` `height` |
| Gutter (G) | 24 px | `.image-wrap` `left`/`bottom` — and the `− G` term in every keyframe inset |
| End width | 75% (`right`) | the percentage term of `right` at offsets 0.5 and 1 |
| End height | 60% (`top`) | the percentage term of `top` at offsets 0.5 and 1 |
| End zoom | 1.25 | `img` `transform` at keyframe 1 |
| Collapse split | 0.5 | the middle keyframe's `offset` |
| Entrance stagger | 225 ms | each entrance effect's `delay` (`i · stagger`) |

Expose the **geometric inputs**, never values derived from them: no control for
the starting box size (it is `frame − 2G`), none for the box's aspect ratio (it
follows end width, end height and G), and none for the image's start scale (it is
1 by definition — the section's own resting crop).

Gutter is the awkward one: `G` appears inside `calc()` in *every* keyframe of the
collapse, so it must re-template all three keyframes, not merely set a variable —
and it shares the `right`/`top` properties with the two end-inset controls, so
those three must be rendered from one template, not bound separately.

## Reference defaults (G = 24px) — inputs, not constants

Runway 400vh over a 100vh sticky frame ⇒ `contain` is the 300vh pinned phase ·
start box `24px` on all four sides (full bleed), ending `left:24 bottom:24
right:calc(75% − 24) top:calc(60% − 24)` = 25% × 40% of the frame · img `scale(1)
→ 1.25` on the same range · `fill: 'both'`, no easing (linear — the staging is in
the offsets) · entrances `viewEnter`/`once`, 1000/900/1100 ms, delays 0/250/450
ms, `cubic-bezier(0.16, 1, 0.3, 1)`.

On a Wix section the collapsing box needs `position: absolute !important` plus
`grid-area: auto`, `margin: 0`, `max-width`/`max-height: none` (all `!important`
— structural) to escape the grid, `position: sticky` on its frame, and
`overflow: clip` on the section.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Manifest Shrink Scroll</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; color: #fff; font-family: system-ui, sans-serif; }
  interact-element { display: block; }

  /* Runway: 400vh track, 100vh sticky frame -> `contain` is the pinned phase. */
  .track { position: relative; height: 400vh; }
  .frame { position: sticky; top: 0; height: 100vh; overflow: clip; }

  .title-wrap { position: absolute; top: 40px; left: 40px; z-index: 10; }
  .title-wrap h1 { font-size: clamp(4rem, 14vw, 12rem); line-height: .85; letter-spacing: .03em; }
  .title-wrap sup { font-size: .12em; vertical-align: super; font-weight: 300; }

  .text-wrap { position: absolute; left: 40px; z-index: 10; display: flex; gap: 40px;
    top: calc(40px + clamp(4rem, 14vw, 12rem) * .85 + 24px); }
  .text-wrap p { max-width: 140px; font-size: .55rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: .06em; line-height: 1.7; color: rgba(255,255,255,.5); }

  /* Rest pose == keyframe 0 (both the insets and the img scale), or first paint flashes.
     Here that is full bleed at G. left/bottom stay at G for the whole scrub:
     the box collapses into this corner. */
  .image-wrap { position: absolute; left: 24px; bottom: 24px; right: 24px; top: 24px; }
  .image-container { position: relative; width: 100%; height: 100%; overflow: clip; border-radius: 3px; }
  .image-container img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 35%;
    display: block; transform: scale(1);
    filter: grayscale(1) brightness(.65) contrast(1.25); }
  /* The start pose sits under the top-left copy -> scrim runs downward, from frame one. */
  .image-container::after { content: ''; position: absolute; left: 0; right: 0; top: 0; height: 62%;
    background: linear-gradient(to bottom, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent); }
</style>
</head>
<body>

<interact-element data-interact-key="page">
  <section class="track">
    <div class="frame">

      <interact-element data-interact-key="title" data-interact-initial="true">
        <div class="title-wrap"><h1>MANIFEST<sup>&reg;</sup></h1></div>
      </interact-element>

      <interact-element data-interact-key="text-cols" data-interact-initial="true">
        <div class="text-wrap">
          <p>Design studio focused on brand identity &amp; digital experiences</p>
          <p>Founded 2019<br>New York, Paris &amp; Tokyo</p>
        </div>
      </interact-element>

      <interact-element data-interact-key="image-box" data-interact-initial="true">
        <div class="image-wrap">
          <div class="image-container">
            <img src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?q=80&w=1400&auto=format&fit=crop"
                 alt="" crossorigin="anonymous" referrerpolicy="no-referrer">
          </div>
        </div>
      </interact-element>

    </div>
  </section>
</interact-element>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different frame or copy block.
const G = 24, END_RIGHT = 75, END_TOP = 60, END_ZOOM = 1.25, SPLIT = 0.5, STAGGER = 250;

// Copy must clear the end box; the end box must not be a sliver.
console.assert((100 - END_RIGHT) / 100 >= 0.18, 'end box too narrow to read as a photo');

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const contain = {
  rangeStart: { name: 'contain', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'contain', offset: { value: 100, unit: 'percentage' } },
};

// Entrances: transform + opacity only — the scrub owns top/right on the same box.
const INTRO = [['title', 40, 1000, 0], ['text-cols', 30, 900, 1], ['image-box', 60, 1100, 2]];

Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [
    ...INTRO.map(([key, dy, duration, i]) => ({
      key, trigger: 'viewEnter',
      effects: [{
        triggerType: 'once',
        keyframeEffect: { name: `${key}-in`, keyframes: [
          { opacity: '0', transform: `translateY(${dy}px)`, offset: 0 },
          { opacity: '1', transform: 'translateY(0)', offset: 1 },
        ] },
        duration, delay: i * STAGGER, easing: EASE, fill: 'both',
      }],
    })),
    {
      // Timeline = the track (the only element that travels); target = the box.
      key: 'page', trigger: 'viewProgress',
      effects: [
        {
          key: 'image-box', selector: '.image-wrap',
          keyframeEffect: { name: 'container-shrink', keyframes: [
            // 0 -> SPLIT: `top` only (lose height). SPLIT -> 1: `right` only (narrow).
            { top: `${G}px`,                     right: `${G}px`, offset: 0 },
            { top: `calc(${END_TOP}% - ${G}px)`, right: `${G}px`, offset: SPLIT },
            { top: `calc(${END_TOP}% - ${G}px)`, right: `calc(${END_RIGHT}% - ${G}px)`, offset: 1 },
          ] },
          ...contain, fill: 'both',
        },
        {
          // Counter-zoom: the frame closing becomes a crop into detail, not a dwindle.
          key: 'image-box', selector: '.image-container img',
          keyframeEffect: { name: 'image-zoom-in', keyframes: [
            { transform: 'scale(1)', offset: 0 },
            { transform: `scale(${END_ZOOM})`, offset: 1 },
          ] },
          ...contain, fill: 'both',
        },
      ],
    },
  ],
});
</script>

</body>
</html>
```
