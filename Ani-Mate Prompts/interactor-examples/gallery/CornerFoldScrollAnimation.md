# Task

Apply the **Corner Fold Scroll Animation** to this section: five fullscreen panels stack one after another — each new panel slides up from below, its image wipes open from the bottom-right corner, then the previous panel's image folds away to the left as the next arrives.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The trigger elements are not the animated elements.** Six empty 100vh `.scroll-section` divs in a separate, `z-index: -1` column are the *clocks*; the panels are pinned inside a `position: sticky` wrapper and never scroll themselves. Every interaction's `key` is a trigger; every effect's `key` is a panel or an image. This is what lets one scroll segment drive two panels at once (see 2), which a single `cover` range on a pinned panel cannot do.

2. **Each trigger's second half does double duty: panel *i+1* arrives while panel *i* is still on screen.** Trigger `i` at `cover` 50→100% both slides panel `i+1` up from `translateY(100vh)` and wipes its image open — and trigger `i` at 0→50% opened panel `i`'s own image. So the beat per trigger is: *reveal the current image* (0→50%), then *bring in the next panel* (50→100%). The shrink of panel `i`'s container runs on trigger `i+1`, one segment later, after it has been covered.

3. **Two clip-paths on two nested elements, moving in opposite directions.** The `img` opens `inset(0% 0% 100% 100%)` → `inset(0)` — bottom and right insets retract together, so the picture grows diagonally out of the bottom-right corner. The wrapping `.image-container` later closes `inset(0)` → `inset(0% 100% 100% 0%)` — right and bottom insets grow, collapsing it toward the **top-left**. Nesting is required: one element cannot open from one corner and close toward the opposite one in a single continuous scrub, and the container's clip crops the already-opened image.

4. **The last panel shrinks on its own trigger, not the next one's.** Trigger 6 exists solely so `#image-container-5` has a segment to close on — there is no panel 6. Drop it and the final image never folds away. Trigger count is therefore `N + 1`, and total runway is `(N + 1) × 100vh`.

5. **Rest poses are authored in CSS to equal keyframe 0**, and they are *not* uniform: panels 2–5 rest at `translateY(100vh)` (off-screen below), panel 1 rests untransformed, every `img` rests at `inset(0% 0% 100% 100%)` (fully clipped), every `.image-container` rests at `inset(0)` (fully open). Getting any one of these wrong shows as a panel already parked on screen at load.

6. **Static `z-index` on the panels, ascending with index**, is the whole occlusion model — panel 5 over panel 4 over … over panel 1. Nothing animates `z-index`, so a later panel is always on top of an earlier one; this is why panel `i` can keep its image visible underneath while `i+1` slides over it.

7. **`translateY(100vh)` is viewport-relative, but the panel is viewport-sized here.** On a target whose panels are not exactly `100vh`, the slide distance must be re-derived from the panel's own height (`translate: 0 100%` on the panel is the equivalent that scales) — otherwise a shorter panel slides further than it needs and shows a gap. Ladder rung 6.

## Check before committing numbers

- Runway must be `(N + 1) × trigger height`. With 5 panels at 100vh triggers that is 600vh; short the runway by one trigger and the last fold never plays.
- The pinned wrapper's height must equal the trigger height (both 100vh here), or panel arrivals desync from the scroll segments that drive them.
- Panel slide distance ≥ panel height, or the incoming panel never fully covers the outgoing one.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Panel Count | 5 | number of panels — re-templates the interaction list and the trigger count (`N + 1`) |
| Segment Height | 100 vh | `.scroll-section` `height` |
| Stage Height | 100 vh | `.sticky-wrapper` / `.sticky-item` `height` |
| Reveal Split | 50 % | the shared `cover` offset that ends the image reveal and starts the next panel's slide |
| Title Inset | 1rem | `.animated-title` `padding` |

Expose the **geometric inputs**, never values derived from them: no control for
total runway (it is `(Panel Count + 1) × Segment Height`), no control for trigger
count (it is `Panel Count + 1`), no separate control for the slide distance (it
follows Stage Height), and no separate control for the shrink range start (it is
the same Reveal Split offset).

Panel Count and Reveal Split are the awkward pair: both are baked into the
generated interaction list — Panel Count changes how many interactions exist,
Reveal Split changes the `rangeStart`/`rangeEnd` of nearly every one. Neither can
be a plain CSS variable; both must re-template the config.

## Reference defaults (N = 5) — inputs, not constants

5 panels · 6 triggers · segment 100vh · stage 100vh · runway 600vh · reveal split
at `cover` 50% · slide `translateY(100vh)` → `translateY(0)` · image reveal
`inset(0% 0% 100% 100%)` → `inset(0)` · container shrink `inset(0)` →
`inset(0% 100% 100% 0%)` · every effect `fill: 'both'`, `easing: 'linear'`,
trigger `viewProgress` on `cover`.

Structural CSS the target will need: `overflow: clip` (never `hidden`) on the
clipper; `.scroll-triggers-placeholder { position: relative; z-index: -1 }` so the
empty trigger column sits behind the pinned stage; panels `position: absolute;
inset: 0` with ascending `z-index`, plus `grid-area: auto`, `margin: 0`,
`max-width`/`max-height: none` (all `!important` — structural) to escape the Wix
grid.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Corner Fold Scroll Animation</title>
<style>
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }

  .scroll-parent-container { position: relative; }

  /* The pinned stage. Its height must match one trigger segment. */
  .sticky-wrapper { position: sticky; top: 0; height: 100vh; width: 100%; }
  /* clip, never hidden — hidden creates a scroll container and kills ViewTimeline. */
  .overflow-clipper { position: relative; width: 100%; height: 100%; overflow: clip; }

  /* The clocks: N+1 empty segments behind the stage. See mechanism note (1), (4). */
  .scroll-triggers-placeholder { position: relative; z-index: -1; }
  .scroll-section { height: 100vh; width: 100%; }

  /* Panels all occupy the stage; static ascending z-index is the occlusion model (6). */
  .sticky-item { position: absolute; inset: 0; }

  .animated-title { position: absolute; top: 0; left: 0; width: 100%; padding: 1rem; z-index: 20; }
  .animated-title p { margin: 0; white-space: nowrap; font-size: 1.1rem; }

  /* Two nested clips moving in opposite directions (3). Both rest poses are
     authored here so they equal keyframe 0 (5). */
  .image-container { position: absolute; inset: 0; clip-path: inset(0% 0% 0% 0%); }
  .animated-image { width: 100%; height: 100%; object-fit: cover;
                    clip-path: inset(0% 0% 100% 100%); }
</style>
</head>
<body>

<div class="scroll-parent-container">
  <div class="sticky-wrapper">
    <div class="overflow-clipper"><!-- panels injected here --></div>
  </div>
  <div class="scroll-triggers-placeholder"><!-- triggers injected here --></div>
</div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different panel count or stage height.
const SPLIT = 50;   // %, cover offset where reveal ends and the next panel starts
const PANELS = [
  ['Architectural Curves', 'photo-1487958449943-2429e8be8625'],
  ['Desert Landscape',     'photo-1509316785289-025f5b846b35'],
  ['Urban Metropolis',     'photo-1477959858617-67f85cf4f1df'],
  ['Forest Canopy',        'photo-1441974231531-c6227db76b6e'],
  ['Ocean Waves',          'photo-1505144808419-1957a94ca61e'],
];
const N = PANELS.length;
const TRIGGERS = N + 1;   // the extra one closes the last image (4)

// Runway is derived, never authored: (N + 1) segments of 100vh.
console.assert(TRIGGERS === N + 1, 'last panel would never fold away');

const clipper = document.querySelector('.overflow-clipper');
PANELS.forEach(([title, photo], i) => {
  // Panel 1 rests untransformed; 2..N rest off-screen below === keyframe 0 (5).
  const rest = i === 0 ? '' : 'transform:translateY(100vh);';
  clipper.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="panel-${i + 1}">
      <div class="sticky-item" style="${rest}z-index:${i + 1}">
        <div class="animated-title"><p>Text ${i + 1}: ${title}</p></div>
        <interact-element data-interact-key="image-container-${i + 1}">
          <div class="image-container">
            <interact-element data-interact-key="image-${i + 1}">
              <img class="animated-image" src="https://images.unsplash.com/${photo}?w=1600&h=900&fit=crop" alt="">
            </interact-element>
          </div>
        </interact-element>
      </div>
    </interact-element>`);
});

const triggerHost = document.querySelector('.scroll-triggers-placeholder');
for (let t = 1; t <= TRIGGERS; t++) {
  triggerHost.insertAdjacentHTML('beforeend',
    `<interact-element data-interact-key="trigger-${t}"><div class="scroll-section"></div></interact-element>`);
}

const range = (from, to) => ({
  rangeStart: { name: 'cover', offset: { unit: 'percentage', value: from } },
  rangeEnd:   { name: 'cover', offset: { unit: 'percentage', value: to } },
  fill: 'both', easing: 'linear',
});

const REVEAL = [{ clipPath: 'inset(0% 0% 100% 100%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }];
const SHRINK = [{ clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 100% 100% 0%)' }];
const SLIDE  = [{ transform: 'translateY(100vh)' }, { transform: 'translateY(0vh)' }];

const interactions = [];
const on = (trigger, effects) => interactions.push({ key: trigger, trigger: 'viewProgress', effects });

// Panel 1 opens in the first half of trigger 1 — nothing slides in for it.
on('trigger-1', [{ key: 'image-1', keyframeEffect: { name: 'p1-reveal', keyframes: REVEAL }, ...range(0, SPLIT) }]);

for (let i = 1; i <= N; i++) {
  // Second half of trigger i: panel i+1 slides up AND its image opens (2).
  if (i < N) {
    on(`trigger-${i}`, [
      { key: `panel-${i + 1}`, keyframeEffect: { name: `p${i + 1}-slide`, keyframes: SLIDE }, ...range(SPLIT, 100) },
      { key: `image-${i + 1}`, keyframeEffect: { name: `p${i + 1}-reveal`, keyframes: REVEAL }, ...range(SPLIT, 100) },
    ]);
  }
  // Panel i's container folds away one segment later, on trigger i+1 (4).
  on(`trigger-${i + 1}`, [
    { key: `image-container-${i}`, keyframeEffect: { name: `p${i}-shrink`, keyframes: SHRINK }, ...range(SPLIT, 100) },
  ]);
}

// Init order: defineInteractElement() -> one frame -> create(). Fails silently
// both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({ interactions });
</script>

</body>
</html>
```

**Verification report (not part of the example).** Headless run: no browser. Only check (3) was performed — every number in the prose was checked against the emitted code: N = 5, triggers 6, `N + 1`, runway 600vh, segment/stage 100vh, split 50%, the three keyframe pairs (`inset(0% 0% 100% 100%)`, `inset(0)`, `inset(0% 100% 100% 0%)`, `translateY(100vh)`→`translateY(0vh)`), `fill: 'both'`, `easing: 'linear'`, title padding 1rem, z-index 1–5 and −1 on the trigger column. All match. Checks (1) "the sanitized demo runs" and (2) "its motion matches the original's" were **not run** — the caller's render loop is the gate for those. The supplied measurements (all 21 elements STATIC, 0px travel, painted/layout width 1× at every stop) are honoured: I claim **no perspective and no 3D** anywhere, and the source declares none. Sanitization changes a render check should confirm: Tailwind utility classes (`px-4 md:px-8 py-4 md:py-2`, `text-2xl md:text-base`) replaced with plain CSS since Tailwind is absent; the unused `.fullscreen-section` rule dropped; per-panel markup and the id-based `#panel-N` z-index rules generated from an array; `data-interact-key` switched from id-selectors (`#panel-1`) to plain keys.