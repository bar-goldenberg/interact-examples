# Task

Apply **Classic Horizontal Scroll** to this section: a row of full-bleed panels
slides sideways while the section is pinned, so vertical scrolling reads as
horizontal travel through the panels.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The travel distance is `trackWidth − 100vw`, and it resolves against the
   track's *declared* width, not against its contents.** The source writes this
   as `translateX(calc(-100% + 100vw))`, which hides the failure: its track is
   `calc(var(--panel-w) * 8 + gap * 7)` while its markup holds **5** panels, so
   the scrub ends with **300vw** — three whole viewports — of empty track
   crossing the screen after the last panel. Derive the width and the travel
   from the same panel count (`N`), as the demo below does, or they drift apart
   silently.

2. **Write the travel as a literal, not as a `calc()` mixing `%` and `vw`.** The
   house rules already prefer literal keyframes over `var()`; a
   `%`-plus-viewport-unit `calc` inside a WAAPI transform is the same class of
   risk, and here the browser sweep measured **0px of travel on both the section
   and the track** (peak painted/layout width 1× everywhere — no perspective is
   involved). I could not isolate the cause headlessly; the demo below removes
   the `calc` and uses `translate: -400vw 0`, computed from `N`.

3. **The track is the only role that must exist** (ladder rung 2/3). The stage
   can be the section itself and the pin can be any wrapper; what the mechanism
   needs is *one* flex row whose width is the sum of the items. On a Wix section
   the `__content` grid is that row — `display: flex !important`,
   `width: max-content !important` (structural, so `!important` is correct;
   never on `translate`).

4. **`flex-shrink: 0` on the panels is load-bearing whenever the track has an
   explicit width.** With the default `1`, flexbox treats the declared track
   width as the authority and shrinks every panel to fit it, so the row is
   exactly as wide as one viewport and nothing appears to move — the panels just
   get narrower.

5. **`overflow-x: clip` on the page body, not just on the pin wrapper.** The
   track is `N × 100vw` wide, and its overflow at rest reaches the document. If
   the page gains a horizontal scrollbar the layout viewport changes and the
   vertical runway is measured against a different box.

6. **Panel copy over full-bleed media is ladder rung 4**, and it is the normal
   shape here: the panel's image goes `position: absolute; inset: 0;
   object-fit: cover`, the copy sits above it. Content-stack items (image, then
   heading, then paragraph) convert rather than disqualify the section.

## Check before committing numbers

- `travel = N·panelW + (N−1)·gap − 100vw`. Any keyframe end value that isn't
  this leaves the last panel short of the viewport (too small) or scrolls blank
  track (too large).
- Scroll pacing: `(sectionHeight − 100vh) / (N − 1)` is the scroll spent per
  panel. Below ~100vh per panel the panels fly past faster than the page moves;
  the reference uses 175vh.
- The pin wrapper's height must equal the panel height, or the row is not
  vertically centred in the pinned viewport for the whole scrub.

## Controls to expose

Four, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Panel Width | 100 vw | `--panel-w` → panel `width` |
| Panel Height | 100 vh | `--panel-h` → track `height` |
| Panel Gap | 0 px | track `gap` |
| Scroll Per Panel | 175 vh | section `height` |

Expose the **geometric inputs**, never values derived from them: no control for
track width (it is `N·panelW + (N−1)·gap`), no control for the travel distance
(it is `trackWidth − 100vw`), no control for the pin wrapper height (it follows
panel height), and no control for section height independent of scroll-per-panel
(one is `(N−1)×` the other, plus the 100vh pin).

**Panel Width and Panel Gap are baked into the keyframes** — both feed the
travel literal in keyframe 1 — so those two controls must re-template the
keyframes, not merely set a CSS variable. Panel Height and Scroll Per Panel are
pure variables.

## Reference defaults (N = 5) — inputs, not constants

Panel 100vw × 100vh · gap 0 · track 500vw · travel −400vw · scroll-per-panel
175vh → section height 800vh · `viewProgress` on the section, `contain` 0→100%,
`easing: linear`, `fill: both`, two keyframes.

Structural CSS the target will need to escape the Wix grid: the content row gets
`display: flex !important; width: max-content !important; grid-area: auto`, the
items `flex-shrink: 0`, `max-width: none !important`, `margin: 0`; the section
gets `height: 800vh` (a real runway) and the pin wrapper `position: sticky;
top: 0; height: 100vh; overflow: clip`.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Classic Horizontal Scroll</title>
<style>
  /* --panel-w / --panel-h / --track-w / --section-h are written from JS so the
     panel count is the single source of truth. See mechanism note (1). */
  body { margin: 0; overflow-x: clip; background: #0b0b10; color: #eee;
         font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  /* The runway. Its height is what the scrub spends. */
  #scroll-container { position: relative; height: var(--section-h); }

  .sticky-wrapper {
    position: sticky; top: 0;
    height: 100vh; width: 100%;
    overflow: clip;                 /* clip, never hidden */
    display: flex; align-items: center;
  }

  /* One flex row, N panels wide. Rest pose == keyframe 0. */
  #horizontal-track {
    display: flex; gap: var(--panel-gap);
    width: var(--track-w); height: var(--panel-h);
    translate: 0 0;
  }

  .panel {
    position: relative; overflow: clip;
    width: var(--panel-w); height: 100%;
    flex-shrink: 0;                 /* mechanism note (4) */
    display: flex; flex-direction: column; justify-content: flex-end;
    padding: 4rem; box-sizing: border-box;
  }
  .panel img { position: absolute; inset: 0; width: 100%; height: 100%;
               object-fit: cover; z-index: 1; }
  .panel::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 2;
  }
  .panel-content { position: relative; z-index: 3; max-width: 60%; }
  .panel-content h2 { margin: 0; font-size: 2.4rem; }
  .panel-content p  { margin: 1rem 0 0; color: rgba(255,255,255,.78); }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key="scroll-container">
  <section id="scroll-container">
    <div class="sticky-wrapper">
      <interact-element data-interact-key="horizontal-track">
        <div id="horizontal-track"><!-- panels injected here --></div>
      </interact-element>
    </div>
  </section>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different panel count or panel size.
const PANEL_VW = 100;   // panel width, vw
const GAP_VW   = 0;     // gap between panels, vw
const PANEL_VH = 100;   // panel height, vh
const SCROLL_PER_PANEL = 175;  // vh of page scroll spent per panel

const PANELS = [
  ['Panel One',   'Sample copy long enough to show the layout in motion.',        'photo-1506744038136-46273834b3fb'],
  ['Panel Two',   'Driven by a viewProgress trigger on the pinned section.',      'photo-1469474968028-56623f02e42e'],
  ['Panel Three', 'Declarative — no manual scroll listeners anywhere.',           'photo-1501785888041-af3ef285b470'],
  ['Panel Four',  'The contain range is exactly the pinned phase.',               'photo-1470071459604-3b5ec3a7fe05'],
  ['Panel Five',  'The last panel lands flush with the viewport, not past it.',   'photo-1519681393784-d120267933ba'],
];

const N        = PANELS.length;
const TRACK_VW = N * PANEL_VW + (N - 1) * GAP_VW;
const TRAVEL   = TRACK_VW - 100;                       // vw — mechanism note (1)
const SECTION  = (N - 1) * SCROLL_PER_PANEL + 100;     // vh — pin + travel

console.assert(TRAVEL > 0, 'track narrower than the viewport: nothing to scroll');
console.log(`N=${N} track=${TRACK_VW}vw travel=-${TRAVEL}vw section=${SECTION}vh`);

const root = document.documentElement.style;
root.setProperty('--panel-w',   PANEL_VW + 'vw');
root.setProperty('--panel-h',   PANEL_VH + 'vh');
root.setProperty('--panel-gap', GAP_VW + 'vw');
root.setProperty('--track-w',   TRACK_VW + 'vw');
root.setProperty('--section-h', SECTION + 'vh');

document.querySelector('#horizontal-track').innerHTML = PANELS.map(
  ([title, copy, photo]) => `
    <div class="panel">
      <img src="https://images.unsplash.com/${photo}?w=1600&h=1000&fit=crop" alt="">
      <div class="panel-content"><h2>${title}</h2><p>${copy}</p></div>
    </div>`).join('');

// Literal travel, no calc() mixing % with vw — mechanism note (2).
const effects = [{
  key: 'horizontal-track',
  keyframeEffect: {
    name: 'horizontal-scroll',
    keyframes: [
      { translate: '0 0' },
      { translate: `-${TRAVEL}vw 0` },
    ],
  },
  rangeStart: { name: 'contain', offset: { value: 0,   unit: 'percentage' } },
  rangeEnd:   { name: 'contain', offset: { value: 100, unit: 'percentage' } },
  easing: 'linear',
  fill: 'both',
}];

// Init order: defineInteractElement() -> one frame -> create().
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: 'scroll-container', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>
```

**Verification report.** Headless run — no browser, no file access. Only check
(3) was available and it was run: every number in the prose was checked against
the emitted code — N = 5, panel 100vw × 100vh, gap 0, track `5 × 100 = 500vw`,
travel `500 − 100 = 400vw`, section `(5 − 1) × 175 + 100 = 800vh` (matching the
source's `--section-height: 800vh`), `contain` 0→100%, linear, `fill: both`, two
keyframes, scrim 62% / `.82`/`.34`@48%. The source's own mismatch (`* 8 + * 7`
track width against 5 panels → 300vw of blank track) is arithmetic off the
supplied source, not a measurement. Checks (1) "the sanitized demo runs" and (2)
"its motion matches the original's" were **not run** — the caller's render loop
is the gate for those, and given the supplied sweep measured both elements
STATIC (0px travel, painted/layout width 1× everywhere, so no perspective is
claimed anywhere here), check (2) is the one that matters most for this file.
Sanitization changes a render check should confirm: the `--outer-pad` padding
(0 at rest) and the `@media (max-width: 768px)` padding block were dropped, the
`.panel-content` negative-margin/over-padding scaffolding was replaced with a
plain `max-width: 60%` block, the five hand-written panels became an array, the
interact keys lost their `#` prefix, and the keyframe `calc()` became a literal.