# Task

Apply **Horizontal and Vertical Scroll** to this section: six image cards rise up
from below one after another as you scroll, then the whole row slides left to
reveal the ones still off-screen — a single scroll timeline running both moves.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **Two motions, one clock, deliberately overlapped.** Every effect is an effect
   of the *same* `viewProgress` interaction on the section, so the ranges are
   directly comparable: cards rise over `cover` 10→90% (staggered ends), the row
   slides over `cover` 50→90%. The last three cards are still rising while the
   row is already sliding — that overlap is the animation, not a bug. Do not
   split the slide onto its own trigger or element timeline.

2. **The rise stagger is in the END offsets, not the starts.** Cards 1–3 all
   start at 10% and end at 40/50/60%; cards 4–6 start at 40/50/60% and end at
   70/80/90%. So the first three enter together but settle in sequence (a fan),
   and the last three enter in sequence. Equal-length ranges would give a plain
   conveyor instead.

3. **The row translates, the cards translate — two different elements, so no
   clobber.** `#stack` writes `transform: translateX(...)`, each card writes
   `transform: translateY(...)`. If a target ever has to carry both, put the rise
   on `translate` and the slide on `transform` rather than merging them.

4. **The slide distance is derived from card width and count, and it is a
   `calc` mixing units.** `N·W − 100` viewport widths, minus `(N−1)·gap` pixels:
   the vw term walks the row off by its own total width less one screen, the px
   term pays back the flex gaps, which are not vw. Recompute both terms for any
   other N or card width — copying the demo's `-98vw` is the classic failure.

5. **The rise offset must exceed the sticky window's bottom, not 100vh.** The
   card is `75vh` tall inside a wrap stuck at `top: 12.5vh`, so a card sitting at
   `translateY(100vh)` is *already partly visible*. The demo uses
   `max(cardH + 10, 100)` = 85 → 100vh here, which is why the CSS rest pose is
   `translateY(100vh)` and matches keyframe 0.

6. **The stage is the sticky wrap, and its `overflow: clip` is what makes the
   horizontal move read as a reveal** — cards past the right edge are hidden
   rather than widening the page. The wrap is centered by
   `top: (100 − cardH)/2 vh`, so card height and sticky offset are one input, not
   two.

7. **Content-stack → media-cover (ladder rung 4):** the card is a column flex
   with `justify-content: flex-end`, image absolutely filling it, copy over the
   image at `z-index: 2` with a scrim.

8. **There is no 3D here.** Measured over 9 scroll stops, every element painted
   at exactly its layout width (1×) — the motion is pure 2D translation. Do not
   add `perspective`, and do not read the `translateX/Y` as depth.

## Check before committing numbers

- The row must be wider than the viewport or the slide has nothing to reveal:
  `N·W > 100vw` (6 × 33.3 = 200vw here). If a section has 3 cards at 33vw, the
  slide distance goes negative and the row walks the wrong way.
- Slide end must equal exactly `−(N·W − 100)vw − (N−1)·gap px`. Any other value
  either strands the last card off-screen or overshoots into empty space.
- Rise offset ≥ `cardH/2 + 50` vh (the wrap's bottom edge in viewport terms), or
  the card starts on screen and the entrance is a jump.
- Runway must cover both phases: the last card finishes rising at the same 90%
  the slide ends, so the section needs enough height that 40% of `cover` is a
  comfortable read — the demo spends 900vh.

## Controls to expose

Five, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Card Width | 33.3 vw | `--hvs-card-w` → card `width` |
| Card Height | 75 vh | `--hvs-card-h` → card `height` + wrap `top`/`height` |
| Card Gap | 4 px | `--hvs-gap` → `#stack` `gap` |
| Scroll Length | 900 vh | section `height` |
| Slide End % | 90 | every effect's `rangeEnd` offset |

Expose the **geometric inputs**, never values derived from them: no control for
the slide distance (it follows card width, count and gap), no control for the
sticky offset (it follows card height), no control for the rise offset (it
follows card height), and no separate control per card's range (they follow the
stagger schedule).

Card Width and Card Gap are the baked ones: both appear inside the `#stack`
keyframes' `translateX(calc(...))`, so changing either must **re-template that
keyframe**, not merely set the CSS variable. Card Height is not baked — but the
rise offset is computed from it at build time, so it must re-template the card
keyframes too.

## Reference defaults (N = 6) — inputs, not constants

Card 33.3vw × 75vh · gap 4px · runway 900vh · wrap sticky at `top: 12.5vh`,
`height: 75vh`, `overflow: clip` · rise offset 100vh · slide end
`calc(-99.8vw - 20px)` · all effects `easing: linear`, `fill: both`, on `cover`.
Rise ranges 10→40/10→50/10→60/40→70/50→80/60→90 %; slide 50→90 %.

On a Wix section the row (`#stack` equivalent) needs `display: flex`,
`width: max-content`, `grid-area: auto`, `margin: 0`, `max-width: none` (all
`!important` — structural) to escape the grid, and the section wants
`overflow: clip` with the sticky wrap spanning to the last grid row.

# Reference demo

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Horizontal and Vertical Scroll</title>
<style>
  body { margin: 0; background: #0b0b10; color: #eee; font-family: system-ui, sans-serif; }
  interact-element { display: contents; }
  .spacer { height: 100vh; }

  /* Geometric inputs. Everything else is derived from these three. */
  :root { --hvs-gap: 4; --hvs-card-w: 33.3; --hvs-card-h: 75; }

  /* Runway: the only source of scroll distance for the scrub. */
  #scroll-section { position: relative; height: 900vh; }

  /* The stage. clip (never hidden) is what turns the row slide into a reveal;
     top centres the 75vh window in the viewport — one input, not two. */
  .sticky-wrap {
    position: sticky;
    top: calc((100 - var(--hvs-card-h)) / 2 * 1vh);
    height: calc(var(--hvs-card-h) * 1vh);
    width: 100%;
    overflow: clip;
  }

  /* The row. width: max-content so it can be wider than the viewport. */
  #stack {
    display: flex; width: max-content;
    gap: calc(var(--hvs-gap) * 1px);
  }

  /* Rest pose === keyframe 0 (translateY(100vh)), or the first paint flashes. */
  .card {
    position: relative;
    transform: translateY(100vh);
    width: calc(var(--hvs-card-w) * 1vw);
    height: calc(var(--hvs-card-h) * 1vh);
    display: flex; flex-direction: column; justify-content: flex-end;
    overflow: hidden; border-radius: 12px;
  }
  /* Media-cover, not content-stack: photo fills the card, copy sits over it. */
  .card img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
  .card::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 62%;
    background: linear-gradient(to top, rgba(0,0,0,.82), rgba(0,0,0,.34) 48%, transparent);
    z-index: 1;
  }
  .card-content { position: relative; z-index: 2; padding: 2rem; }
  .card-content h2 { margin: 0 0 .4rem; font-size: 2rem; }
  .card-content p  { margin: 0; font-size: .95rem; color: rgba(255,255,255,.75); }
</style>
</head>
<body>

<div class="spacer"></div>

<interact-element data-interact-key="#scroll-section">
  <section id="scroll-section">
    <div class="sticky-wrap">
      <interact-element data-interact-key="#stack">
        <div id="stack"><!-- cards injected here --></div>
      </interact-element>
    </div>
  </section>
</interact-element>

<div class="spacer"></div>

<script type="module">
import { Interact } from 'https://esm.sh/@wix/interact@2.5.1/web?bundle';

// Inputs, not constants — re-derive for a different count or card size.
const N = 6, GAP = 4, CARD_W = 33.3, CARD_H = 75;

// Row must overflow the viewport or the slide reveals nothing.
console.assert(N * CARD_W > 100, 'row narrower than viewport — no slide');

// vw term walks the row off by its own width less one screen; px term pays
// back the flex gaps, which are not vw. See mechanism note (4).
const SLIDE_END = `translateX(calc(-${(N * CARD_W - 100).toFixed(1)}vw - ${(N - 1) * GAP}px))`;
// Must clear the sticky window's bottom edge, not merely 100vh — note (5).
const RISE = Math.max(CARD_H + 10, 100);

const CARDS = [
  ['Discovery',   'Every scroll reveals something new.',   'photo-1506744038136-46273834b3fb'],
  ['Progression', 'Building momentum with each frame.',    'photo-1469474968028-56623f02e42e'],
  ['Harmony',     'Where design and motion align.',        'photo-1501785888041-af3ef285b470'],
  ['Energy',      'A dynamic visual experience.',          'photo-1470071459604-3b5ec3a7fe05'],
  ['Clarity',     'The story becomes clear.',              'photo-1519681393784-d120267933ba'],
  ['Finale',      'The final view unfolds.',               'photo-1441974231531-c6227db76b6e'],
];

// Stagger lives in the END offsets for 1-3, in both for 4-6 — note (2).
const RISE_RANGE = [[10, 40], [10, 50], [10, 60], [40, 70], [50, 80], [60, 90]];

const stack = document.querySelector('#stack');
CARDS.forEach(([title, copy, photo], i) => {
  stack.insertAdjacentHTML('beforeend', `
    <interact-element data-interact-key="#card-${i + 1}">
      <div class="card" id="card-${i + 1}">
        <img src="https://images.unsplash.com/${photo}?w=900&h=1000&fit=crop" alt="">
        <div class="card-content"><h2>${title}</h2><p>${copy}</p></div>
      </div>
    </interact-element>`);
});

const cover = (a, b) => ({
  rangeStart: { name: 'cover', offset: { unit: 'percentage', value: a } },
  rangeEnd:   { name: 'cover', offset: { unit: 'percentage', value: b } },
  easing: 'linear', fill: 'both',
});

const effects = [
  {
    key: '#stack',
    keyframeEffect: {
      name: 'stack-slide',
      keyframes: [{ transform: 'translateX(0vw)' }, { transform: SLIDE_END }],
    },
    ...cover(50, 90),
  },
  ...CARDS.map((_, i) => ({
    key: `#card-${i + 1}`,
    keyframeEffect: {
      name: `card-${i + 1}-rise`,
      keyframes: [{ transform: `translateY(${RISE}vh)` }, { transform: 'translateY(0vh)' }],
    },
    ...cover(...RISE_RANGE[i]),
  })),
];

// Init order: defineInteractElement() -> one frame -> create(). Fails
// silently both ways if reordered.
Interact.defineInteractElement();
await new Promise(requestAnimationFrame);

Interact.create({
  interactions: [{ key: '#scroll-section', trigger: 'viewProgress', effects }],
});
</script>

</body>
</html>
```