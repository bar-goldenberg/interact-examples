# Task

Apply **Pixel Churn** to this section: a portrait band whose edges dissolve into a field of flickering white blocks — dense along the left and right walls, thinning toward the centre — with the headline set below it, sized to span the grid exactly.

The demo below runs. Read it for the mechanism, map it onto this section's
elements per the house rules and the ladder. Notes on what isn't obvious:

# Mechanism note

1. **The blocks are generated DOM, and the mechanism is one `listContainer` per cycle.** Three `.pixel-noise` layers exist only so that three *different* cycle durations (1700 / 2300 / 2900 ms — deliberately coprime-ish, so the composite never visibly repeats) can each drive one flat set of children. One interaction, keyed to the card, with three `sequences` entries; each entry's single effect carries `listContainer: '.pixel-noise--a|b|c'`, so the runtime fans one effect out across that layer's blocks and applies `offset` between them.

2. **Constant density comes from `offset = duration / perLayer` plus a 50/50 duty cycle — not from any easing.** With each block lit for exactly half its cycle and the stagger equal to one full cycle divided by the block count, exactly one block lights as another goes dark, so the field's total lit count is invariant. Change `perLayer` without changing the offset formula and the field visibly pulses.

3. **The keyframes must be cuts, not fades.** `opacity 1 → 1 @0.49 → 0 @0.50 → 0 @0.99 → 1` — the two 0.01-wide steps are what make a block *switch*. Interpolating (two keyframes, 1 → 0) turns the same config into a slow global breathe and loses the pixel character entirely.

4. **Each block's inline rest `opacity` is half the mechanism.** `fill: 'forwards'` means a block shows its authored rest value until its turn in the stagger arrives; lighting exactly every other block (`i % 2`) starts the field at its steady-state density. All-lit or all-dark rest values give a visible settling ramp on first view.

5. **The edge weighting is a per-cell probability, not a border ring.** For each cell, distance to the nearest wall normalised by that wall's reach — `side = min(col, cols−1−col) / (cols·SIDE_REACH)`, `cap = min(row, rows−1−row) / (rows·CAP_REACH)` — then `weight = (1 − min(1, side, cap))^EDGE_FALLOFF`. `SIDE_REACH` 0.34 > `CAP_REACH` 0.30 is what makes the flanks read as dense bands while the portrait's face stays clear. Selection is weighted-without-replacement (Efraimidis–Spirakis: sort by `random()^(1/weight)`), so the field *count* is exact even though its *shape* is random — a plain per-cell coin flip would make the count vary and (2) would break.

6. **The grid is measured, not authored.** `cols = round(width/40)`, `rows = round(height/72)` — the 40:72 ratio, not any CSS, is what makes the blocks upright rectangles at every panel size. `perLayer` is counted off the border ring (`2(cols+rows) − 4`) times `FIELD_SHARE`, so density is resolution-independent. A resize therefore needs a **new config**, because `offset` is a function of `perLayer`; the demo rebuilds rather than restyles.

7. **Remounting is what arms the trigger.** `<interact-element>` claims its key on connect, so after `Interact.destroy()` / `create()` the card is replaced with a pristine clone. Re-running `create()` against the already-connected element leaves the blocks static.

8. **`will-change: opacity` on the blocks is deliberate here** — the blocks carry no text and are never magnified, so the usual raster-pinning cost does not apply, and hundreds of independently animating boxes benefit from the promotion.

## Check before committing numbers

- `SIDE_REACH + CAP_REACH` must leave a clear centre: `cols·(1 − 2·SIDE_REACH) ≥ 1` and `rows·(1 − 2·CAP_REACH) ≥ 1`. At 0.34 / 0.30 that needs `cols ≥ 3`, `rows ≥ 3` — trivially satisfied, but a reach above 0.5 makes the field solid and the portrait disappears.
- Total blocks must not exceed the candidate pool: `perLayer · 3 ≤` the number of cells with `weight > 0.001`. At 1.75 field-share off a `2(cols+rows) − 4` ring this holds comfortably; raise `FIELD_SHARE` past ~4 and the field saturates the reach bands into solid walls.
- Every layer needs at least two blocks or (4)'s `i % 2` alternation degenerates — hence the `max(12, …)` floor on `perLayer`.

## Controls to expose

Seven, each writing a **different** property so none clobbers another:

| Control | Default | Writes |
| --- | --- | --- |
| Block Width | 40 px | `BLOCK_W` — column count divisor |
| Block Height | 72 px | `BLOCK_H` — row count divisor |
| Side Reach | 0.34 | `SIDE_REACH` in the cell weight |
| Cap Reach | 0.30 | `CAP_REACH` in the cell weight |
| Edge Falloff | 2.6 | `EDGE_FALLOFF` exponent |
| Field Density | 1.75 | `FIELD_SHARE` — blocks per ring cell |
| Churn Speed | 1700 ms | base cycle `duration` (b, c scale off it) |

Expose the **geometric inputs**, never values derived from them: no control for
the block count (it follows block size and panel size), no control for the
per-layer stagger (it is `duration / perLayer`, and exposing it separately breaks
note 2), no control for the b/c durations (they are ratios off the base), and no
control for the rest-`opacity` pattern (it is fixed by note 4).

Churn Speed is the awkward one — the `duration` feeds `offset` in `sequences`, so
that control must re-emit the sequence offsets, not merely change a duration.
Field Density and both Block-size controls likewise change `perLayer`, and so
must rebuild the block DOM and the offsets together, not restyle.

## Reference defaults (N = 3 layers) — inputs, not constants

Block 40×72px · side reach 0.34 · cap reach 0.30 · falloff 2.6 · field share 1.75
· durations 1700 / 2300 / 2900 ms, `easing: 'linear'`, `iterations: Infinity`,
`fill: 'forwards'` · trigger `viewEnter`, `threshold: 0.2`, gated on
`(prefers-reduced-motion: no-preference)`.

Media band 70vh of a 100vh card; photo inset `1% 1% 0` with a `#000` / `0.2`
overlay *inside* it so the portrait darkens and the pixel field above it does
not. Pixel layers are `position: absolute; inset: -1px; z-index: 2` grids of
`repeat(cols, 1fr) / repeat(rows, 1fr)`; each block claims one cell via
`--col`/`--row`. Card is `overflow: clip`. On a Wix section each pixel layer will
also need `grid-area: auto`, `margin: 0`, `max-width`/`max-height: none` (all
`!important` — structural) to escape the Wix grid.

# Reference demo

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Pixel Churn</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; height: 100%; }
  body { background: #fff; color: #0a0a0a; font-family: system-ui, sans-serif; }

  /* The card splits into a picture band on top and a type band below. */
  .card {
    position: relative; width: 100vw; height: 100vh;
    overflow: clip;                 /* clip, never hidden */
    --media-height: 70vh;
  }

  .card__stage { position: absolute; inset: 0 0 auto; height: var(--media-height); overflow: clip; }

  /* Pulled in from the sides and top so a sliver of paper frames it. */
  .photo { position: absolute; inset: 1% 1% 0; z-index: 1; }
  /* Inside .photo, so it darkens the portrait without touching the pixel field. */
  .photo::after { content: ''; position: absolute; inset: 0; background: #000; opacity: .2; }
  .photo img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 10%; display: block; }

  /* One grid per cycle length. Blocks claim a cell via --col / --row. */
  .pixel-noise {
    position: absolute; inset: -1px; z-index: 2; display: grid;
    grid-template-columns: repeat(var(--grid-cols), 1fr);
    grid-template-rows: repeat(var(--grid-rows), 1fr);
  }
  .pixel-noise__block {
    background: #fff; grid-column: var(--col); grid-row: var(--row);
    will-change: opacity;           /* see mechanism note (8) */
  }

  .caption {
    position: absolute; top: var(--media-height); bottom: 0; left: 3.2vw; right: 3.2vw;
    z-index: 3; align-content: center; row-gap: 2.2vh;
  }
  .caption h1 {
    margin: 0; font-size: min(12vw, 22vh); font-weight: 900;
    letter-spacing: -.05em; line-height: .82; white-space: nowrap;
  }
  .caption p { margin: 0; max-width: 32ch; margin-left: auto; font-size: 1rem; line-height: 1.4; }
</style>
</head>
<body>

<main>
  <interact-element data-interact-key="card">
    <article class="card">
      <div class="card__stage">
        <div class="photo">
          <img src="https://images.unsplash.com/photo-1509281373149-e957c6296406?w=1600&h=1000&fit=crop" alt="">
        </div>
        <div class="pixel-noise pixel-noise--a" aria-hidden="true"></div>
        <div class="pixel-noise pixel-noise--b" aria-hidden="true"></div>
        <div class="pixel-noise pixel-noise--c" aria-hidden="true"></div>
      </div>
      <div class="caption">
        <h1>Bird of Paradise</h1>
        <p>A portrait of exotic tranquility and a deep connection to nature against a sunset backdrop.</p>
      </div>
    </article>
  </interact-element>
</main>

<script type="module">
import { Interact, generate } from 'https://esm.sh/@wix/interact@2.5.5/web';

// Inputs, not constants — re-derive for a different panel size or density.
const BLOCK_W = 40, BLOCK_H = 72;   // px; the 40:72 ratio makes blocks upright
const SIDE_REACH = 0.34;            // share of the grid the field reaches in from left/right
const CAP_REACH  = 0.30;            // ...and from top/bottom
const EDGE_FALLOFF = 2.6;           // how sharply the odds drop across that reach
const FIELD_SHARE  = 1.75;          // blocks per cell of the border ring
const CYCLES = [
  { name: 'a', duration: 1700 },
  { name: 'b', duration: 2300 },
  { name: 'c', duration: 2900 },
];

// Cuts, not fades — the 0.01-wide steps are the mechanism. See note (3).
const CHURN_KEYFRAMES = [
  { opacity: '1' },
  { opacity: '1', offset: 0.49 },
  { opacity: '0', offset: 0.50 },
  { opacity: '0', offset: 0.99 },
  { opacity: '1' },
];

// Grid is measured off the panel, so its size stays a pure CSS decision.
function measure(stage) {
  const { width, height } = stage.getBoundingClientRect();
  const cols = Math.max(8, Math.round(width / BLOCK_W));
  const rows = Math.max(4, Math.round(height / BLOCK_H));
  const border = 2 * (cols + rows) - 4;
  return { cols, rows, perLayer: Math.max(12, Math.round(border * FIELD_SHARE / CYCLES.length)) };
}

// Weighted sampling WITHOUT replacement (Efraimidis–Spirakis) — the field COUNT
// must be exact or the constant-density invariant (2) breaks.
function pickCells({ cols, rows }, count) {
  const candidates = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const side = Math.min(col, cols - 1 - col) / (cols * SIDE_REACH);
      const cap  = Math.min(row, rows - 1 - row) / (rows * CAP_REACH);
      const weight = (1 - Math.min(1, side, cap)) ** EDGE_FALLOFF;
      if (weight > 0.001) candidates.push({ col, row, key: Math.random() ** (1 / weight) });
    }
  }
  console.assert(candidates.length >= count, 'field larger than the candidate pool');
  return candidates.sort((a, b) => b.key - a.key).slice(0, count);
}

function buildNoiseField(card, grid) {
  const cells = pickCells(grid, grid.perLayer * CYCLES.length);
  CYCLES.forEach(({ name }, layerIndex) => {
    const layer = card.querySelector(`.pixel-noise--${name}`);
    const frag = document.createDocumentFragment();
    cells.filter((_, i) => i % CYCLES.length === layerIndex).forEach((cell, i) => {
      const block = document.createElement('div');
      block.className = 'pixel-noise__block';
      block.style.setProperty('--col', cell.col + 1);
      block.style.setProperty('--row', cell.row + 1);
      // fill: 'forwards' shows this until the block's turn in the stagger. Every
      // other one lit starts the field at steady-state density — note (4).
      block.style.opacity = i % 2 ? '1' : '0';
      frag.append(block);
    });
    layer.style.setProperty('--grid-cols', grid.cols);
    layer.style.setProperty('--grid-rows', grid.rows);
    layer.replaceChildren(frag);
  });
}

// offset = duration / perLayer is the constant-density invariant — note (2).
const buildConfig = perLayer => ({
  conditions: { 'motion-ok': { type: 'media', predicate: '(prefers-reduced-motion: no-preference)' } },
  effects: Object.fromEntries(CYCLES.map(({ name, duration }) => [`churn-${name}`, {
    duration, easing: 'linear', iterations: Infinity, fill: 'forwards',
    keyframeEffect: { name: `churn${name.toUpperCase()}`, keyframes: CHURN_KEYFRAMES },
  }])),
  interactions: [{
    key: 'card', trigger: 'viewEnter', params: { threshold: 0.2 },
    conditions: ['motion-ok'],
    sequences: CYCLES.map(({ name, duration }) => ({
      offset: duration / perLayer,
      effects: [{ effectId: `churn-${name}`, listContainer: `.pixel-noise--${name}` }],
    })),
  }],
});

const style = document.createElement('style');
document.head.append(style);

// A pristine clone: <interact-element> claims its key on connect, so remounting
// is what arms the trigger — note (7).
const template = document.querySelector('[data-interact-key="card"]').cloneNode(true);
let card = document.querySelector('[data-interact-key="card"]');

function build() {
  const grid = measure(card.querySelector('.card__stage'));
  const config = buildConfig(grid.perLayer);
  style.textContent = generate(config, true);

  Interact.destroy();
  Interact.create(config);

  const next = template.cloneNode(true);
  buildNoiseField(next, grid);
  card.replaceWith(next);
  card = next;
}

build();

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(build, 250);
});
</script>

</body>
</html>
```