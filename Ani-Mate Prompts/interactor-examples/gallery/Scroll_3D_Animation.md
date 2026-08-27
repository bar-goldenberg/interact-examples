# Task

Apply the **Scroll 3D Animation** to this section: a stack of landscape panels, largest at the back, that swings 180° into view as the section scrolls past and simultaneously fans out horizontally so each panel's edge peeks from behind the one in front.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The stack is built by size, not by depth.** Every panel is absolutely
   positioned at the same point (`left: 50%; translateX(-50%)`) and they overlap
   in DOM order; panel `i` is simply wider and taller than panel `i−1`
   (`width = 45 + i·(20/6) vw`, `height = 30 + i·2 vw`). Nothing is pushed back
   in Z. The apparent depth comes from each larger panel being progressively
   *more visible* around the edges of the smaller ones in front of it, plus the
   `scale(0.75 + p·0.4)` in its keyframes (`p = i/(N−1)`), which partly cancels
   the size ramp. **Measured: painted/layout width is exactly 1× on all nine
   tracked elements at all nine scroll stops — this animation contains no live
   perspective and nothing is foreshortened.** The `perspective: 2000px` and the
   two `preserve-3d` declarations in the source are inert (the only 3D primitive
   present is `rotateY` on the wrapper, and its projection is not reaching a
   painted magnification). Do not spend adaptation effort preserving a 3D chain.

2. **The 180° swing is on the wrapper, the fan-out is on the panels — two
   clocks that must not be merged.** The wrapper rotates
   `rotateY(-180deg) → rotateY(0)` over `cover` **0→50%** with `ease-out`; each
   panel translates over `cover` **0→100%** with `linear`. The wrapper finishes
   its turn at the halfway point and the fan continues alone through the second
   half. Collapse them to one range and the fan is over before the stack has
   finished facing front.

3. **The wrapper's rotation and the panels' fan compose without either fighting
   the other**, which is why the roles can be re-hosted freely: the wrapper
   writes only `transform` on itself, the panels write only `transform` on
   themselves. If the target has no spare wrapper (ladder rung 3), put the
   `rotateY` on the section's own content grid item — the panels' local frames
   inherit it, and their `translateX` still fans in that rotated frame, which is
   the intended look.

4. **Both `transform` values must restate the centring translate.** The rest
   pose is `translateX(-50%)` on a panel and `translateY(-50%)` on the wrapper;
   because both are written inside `transform`, every keyframe has to carry them
   or the element jumps by half its own box on the first frame. Written the
   house-rules way this would move to `translate`, freeing `transform` — but
   then keyframe 0 must be re-derived, so keep them paired as here unless you
   split them deliberately.

5. **The fan is symmetric about the stack's centre index.**
   `xEnd(i) = (i − (N−1)/2) · GAP_STEP`, GAP_STEP = 20px. With N = 7 that is
   −60, −40, −20, 0, +20, +40, +60 px: the middle panel never moves, and the
   total spread is `(N−1)·GAP_STEP` = 120px. It is a small offset by design —
   at 20px per step it reads as a deck squaring itself up, not as a gallery
   splaying open.

6. **The panels' `scale` is a static term baked into both keyframes, not an
   animation.** `scale(0.75 + p·0.4)` never changes across the scrub; it is
   there only to trim the size ramp. Because it sits inside `transform` after
   the translate, the fan's 20px steps are multiplied by that scale — the back
   panel (`scale 1.15`) actually fans 23px per step while the front panel
   (`scale 0.75`) fans 15px. If you want a uniform fan, move the offset to
   `translate` instead.

7. **The text block is a fixed sidebar, not part of the animation.** It is
   pinned at `left: 3%`, 18% wide, and the wrapper starts after it
   (`left: calc(3% + 18% + 1%)`). Nothing animates it. **Measured: it was not
   among the moving elements; only the section, the wrapper and the seven
   panels registered travel (2825px max).**

8. **`position: fixed` is doing the pinning, not `sticky`.** Both the text block
   and the panel wrapper are `fixed` inside a `300vh` section, so they hold for
   the whole runway and the section's own height is the only scroll source. On a
   Wix section prefer sticky per the house rules — but note that a `fixed`
   element is *not* clipped by the section, so a sticky conversion needs the
   runway/clip pair the house rules describe.

## Check before committing numbers

- The panels must actually overlap, or the "stack" reads as seven separate
  boxes: for every `i`, `width(i)·scale(i)` > `width(i+1)·scale(i+1) −
  2·GAP_STEP`. With the demo's ramp the painted widths *shrink* going back
  (`65vw·0.75 = 48.75vw` front vs `45vw·1.15 = 51.75vw` back is inverted —
  check which panel is actually largest on screen before sizing anything).
- The widest painted panel must fit the wrapper: `max(width(i)·scale(i))` ≤
  `100% − (3% + 18% + 4%)` of the viewport, i.e. ≤ 75vw at the demo's sidebar
  widths. Re-derive if the sidebar is a different width or absent.
- The runway must outlast the two ranges: the wrapper's turn ends at 50% of
  `cover`, so the section needs enough height that 50% of `cover` is still a
  comfortable scroll — `300vh` at the demo's numbers.

## Controls to expose

Six, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Fan Step | 20 px | `GAP_STEP` — re-templates each panel's keyframe `translateX` |
| Front Panel Width | 45 vw | panel 0 `width` (the ramp follows) |
| Width Ramp | 20 vw | total added width across the stack |
| Turn End | 50 % | wrapper effect `rangeEnd` offset |
| Sidebar Width | 18 % | `.text-block` `width` (wrapper `left` follows) |
| Scroll Length | 300 vh | section `height` |

Expose the **geometric inputs**, never values derived from them: no control for
each panel's own width or height (they follow Front Panel Width + Width Ramp),
no control for the per-panel `scale` (it follows `i/(N−1)`), no control for the
symmetric offsets (they follow Fan Step and N), and no control for the wrapper's
`left` (it follows Sidebar Width).

**Fan Step and Front Panel Width are both baked into the keyframes** — the
`translateX` offsets and the `scale` term live inside each panel's `transform`,
so either control must re-template all fourteen keyframes (two per panel), not
merely set a variable.

## Reference defaults (N = 7) — inputs, not constants

Panel `i`: width `45 + i·20/6` vw, height `30 + i·2` vw, `scale(0.75 + 0.4·i/6)`,
fan `translateX((i − 3)·20px)` — so −60→+60px, 120px total spread.
Wrapper: `rotateY(-180deg → 0)`, `cover` 0→50%, `ease-out`, `fill: both`.
Panels: `cover` 0→100%, `linear`, `fill: both`. Section `height: 300vh`.
Sidebar 18% at `left: 3%`; wrapper `left: calc(3% + 18% + 1%)`,
`width: calc(100% - (3% + 18% + 4%))`. Measured travel 2825px across the sweep.

Structural CSS the target will need: `body { overflow-x: clip }` (the rotating
wrapper overhangs mid-turn), each panel `position: absolute` at `left: 50%`,
and — on a Wix section — `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` (all `!important`, structural) to escape the grid.
The source's `@media (max-width: 1280px)` branch dropped the whole animation to a
static vertical column; that is a responsive fallback, not part of the mechanism
(ladder rung 6 — re-derive, don't carry it forward).

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Scroll 3D Animation</title>
<style>
  body { margin: 0; overflow-x: clip; background: #0b0b10; color: #eee;
         font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  /* The runway. 300vh of section height is the only scroll source; 50% of
     `cover` is where the wrapper's turn ends — see mechanism note (2). */
  .intro { height: 300vh; position: relative; padding: 20px; }

  /* Fixed sidebar, never animated — mechanism note (7). */
  .text-block {
    position: fixed; top: 50%; left: 3%; transform: translateY(-50%);
    z-index: 10; width: 18%; min-width: 200px;
  }
  .text-block h1 { margin: 0 0 .5rem; font-size: 2rem; }
  .text-block p  { margin: 0; font-size: .85rem; color: rgba(255,255,255,.7); }

  /* The wrapper carries the 180deg turn. Rest pose = keyframe 0's
     translateY(-50%) rotateY(-180deg) is set inline below so the first paint
     does not flash. `perspective`/`preserve-3d` are NOT declared: measured
     painted/layout width is 1x everywhere, so no projection is in play — see
     mechanism note (1). */
  .panel-wrapper {
    position: fixed; top: 50%; left: calc(3% + 18% + 1%);
    display: flex; justify-content: center; align-items: center;
    width: calc(100% - (3% + 18% + 4%));
  }

  /* Every panel sits at the same point and overlaps its neighbours; the stack
     is made by the width/height ramp, not by depth — mechanism note (1). */
  .panel { position: absolute; left: 50%; }
  .panel img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key="intro-section">
  <section class="intro">
    <div class="text-block">
      <h1>Title 01</h1>
      <p>Scroll-driven 3D animation with horizontal subtle movement.</p>
    </div>

    <interact-element data-interact-key="panel-wrapper">
      <!-- rest pose === wrapper keyframe 0 -->
      <div class="panel-wrapper" style="transform: translateY(-50%) rotateY(-180deg)">
        <!-- panels injected here -->
      </div>
    </interact-element>
  </section>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different panel count or sidebar.
const N          = 7;
const W0         = 45;   // vw, front (narrowest-authored) panel
const W_RAMP     = 20;   // vw, total width added across the stack
const H0         = 30;   // vw
const H_RAMP     = 12;   // vw, total height added across the stack
const GAP_STEP   = 20;   // px per index of the symmetric fan
const TURN_END   = 50;   // % of `cover` where the wrapper finishes its turn
const SCALE_MIN  = 0.75, SCALE_RANGE = 0.4;

const PHOTOS = [
  'photo-1506744038136-46273834b3fb', 'photo-1469474968028-56623f02e42e',
  'photo-1501785888041-af3ef285b470', 'photo-1470071459604-3b5ec3a7fe05',
  'photo-1519681393784-d120267933ba', 'photo-1441974231531-c6227db76b6e',
  'photo-1447752875215-b2761acb3c5d',
];

// p = i/(N-1). Panel geometry and its baked scale both derive from it.
const geom = i => {
  const p = N > 1 ? i / (N - 1) : 1;
  return {
    w: W0 + p * W_RAMP,
    h: H0 + p * H_RAMP,
    scale: SCALE_MIN + p * SCALE_RANGE,
    // Symmetric about the centre index; middle panel never moves — note (5).
    xEnd: (i - (N - 1) / 2) * GAP_STEP,
  };
};

// Widest PAINTED panel must fit the wrapper — see the checks.
const widest = Math.max(...Array.from({ length: N }, (_, i) => {
  const g = geom(i); return g.w * g.scale;
}));
console.assert(widest <= 75, 'widest painted panel exceeds the wrapper');

const wrapper = document.querySelector('.panel-wrapper');
Array.from({ length: N }, (_, i) => {
  const g = geom(i);
  wrapper.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="#panel-${i}">
      <div class="panel" id="panel-${i}"
           style="width:${g.w.toFixed(1)}vw;height:${g.h.toFixed(1)}vw;
                  transform:translateX(-50%) translateX(0px) scale(${g.scale.toFixed(2)})">
        <img src="https://images.unsplash.com/${PHOTOS[i]}?w=1200&h=800&fit=crop" alt="">
      </div>
    </interact-element>`);
});

const cover = (from, to) => ({
  rangeStart: { name: 'cover', offset: { unit: 'percentage', value: from } },
  rangeEnd:   { name: 'cover', offset: { unit: 'percentage', value: to } },
});

// Two clocks: the wrapper turns over the first half, the fan runs the whole
// range — mechanism note (2). Every keyframe restates the centring translate,
// note (4).
const wrapperEffect = {
  key: 'panel-wrapper',
  keyframeEffect: {
    name: 'wrapper-rotation',
    keyframes: [
      { transform: 'translateY(-50%) rotateY(-180deg)' },
      { transform: 'translateY(-50%) rotateY(0deg)' },
    ],
  },
  ...cover(0, TURN_END), easing: 'ease-out', fill: 'both',
};

const panelEffects = Array.from({ length: N }, (_, i) => {
  const g = geom(i);
  const base = `scale(${g.scale.toFixed(2)})`;
  return {
    key: `#panel-${i}`,
    keyframeEffect: {
      name: `panel-move-${i}`,
      keyframes: [
        { transform: `translateX(-50%) translateX(0px) ${base}` },
        { transform: `translateX(-50%) translateX(${g.xEnd}px) ${base}` },
      ],
    },
    ...cover(0, 100), easing: 'linear', fill: 'both',
  };
});

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{
    key: 'intro-section',
    trigger: 'viewProgress',
    effects: [wrapperEffect, ...panelEffects],
  }],
});
</script>

</body>
</html>
```