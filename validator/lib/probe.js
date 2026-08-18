// validator/lib/probe.js — measure what a demo actually DOES, in a real browser.
//
// Why this exists: an agent converting a demo headlessly can only read source,
// so every number it writes down is an assertion. The probe replaces assertion
// with measurement — it opens the page and reads the rendered result. It knows
// nothing about @wix/interact and does not need to: the demo imports the library
// itself, and the probe only looks at boxes, transforms and filters.
//
// Used twice:
//   before convert — facts injected into the prompt, so the agent reports
//                    measured numbers instead of guessing them
//   after convert  — the sanitized demo is measured and compared to the
//                    original, so "sanitizing didn't break it" is provable
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Pull the demo out of a generated example's ```html fence. Pure.
export function extractDemoHtml(md) {
  const s = String(md);
  // Prefer the fence under "# Reference demo"; fall back to the first html fence.
  const afterHeading = s.split(/^#\s*Reference demo\s*$/mi)[1] ?? s;
  const m = afterHeading.match(/```html\s*\n([\s\S]*?)```/i);
  return m ? m[1].trim() : '';
}

// What we read at every scroll stop, for every keyed element. Runs in the page.
/* c8 ignore start — executes in the browser, not under node --test */
function readFrame() {
  const els = [...document.querySelectorAll('[data-interact-key]')];
  return els.map((el) => {
    // <interact-element> is display:contents, so it has no box of its own —
    // measure the element it wraps.
    const t = el.firstElementChild || el;
    const r = t.getBoundingClientRect();
    const cs = getComputedStyle(t);
    return {
      key: el.dataset.interactKey,
      rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
      offsetW: t.offsetWidth,
      opacity: +(+cs.opacity).toFixed(3),
      transform: cs.transform,
      filter: cs.filter,
    };
  });
}
/* c8 ignore stop */

const changed = (frames, key, pick) => {
  const seen = new Set(frames.map((f) => JSON.stringify(pick(f.find((x) => x.key === key) || {}))));
  return seen.size > 1;
};

// Turn per-frame reads into a compact, comparable signature.
export function buildSignature(frames) {
  const keys = [...new Set(frames.flat().map((e) => e.key))];
  const elements = keys.map((key) => {
    const seq = frames.map((f) => f.find((x) => x.key === key)).filter(Boolean);
    const last = seq[seq.length - 1] || {};
    const travel = seq.length < 2 ? 0 : Math.round(Math.max(
      ...seq.map((s, i) => (i === 0 ? 0 : Math.hypot(s.rect[0] - seq[0].rect[0], s.rect[1] - seq[0].rect[1])))));
    // A live parent `perspective` makes a rotated element paint WIDER than its
    // layout box. Equal widths across every frame means the 3D is flat.
    const magnification = Math.max(...seq.map((s) => (s.offsetW ? s.rect[2] / s.offsetW : 1)));
    return {
      key,
      moves: changed(frames, key, (e) => e.rect) || changed(frames, key, (e) => e.transform),
      fades: changed(frames, key, (e) => e.opacity),
      filters: changed(frames, key, (e) => e.filter),
      travel,
      magnification: +magnification.toFixed(3),
      finalOpacity: last.opacity,
    };
  });
  return { frames: frames.length, elements };
}

// Open an HTML string and sample it across the scroll. Returns a signature.
export async function probeHtml(html, { frames = 9, viewport = { width: 1280, height: 800 }, browser } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'iv-probe-'));
  const file = join(dir, 'demo.html');
  await writeFile(file, html, 'utf8');
  const { chromium } = await import('playwright');
  const own = !browser;
  const b = browser || await chromium.launch();
  try {
    const page = await b.newPage({ viewport });
    await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(500);                     // fonts, CDN module, first paint
    const max = await page.evaluate(() =>
      Math.max(0, document.documentElement.scrollHeight - window.innerHeight));
    const out = [];
    for (let i = 0; i < frames; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), frames === 1 ? 0 : Math.round((max * i) / (frames - 1)));
      // A ViewTimeline does not advance without a painted frame — scrolling and
      // reading immediately returns identical stale values at every stop, which
      // reads as "the animation is dead". Force a paint before measuring.
      await page.screenshot({ clip: { x: 0, y: 0, width: 1, height: 1 } });
      out.push(await page.evaluate(readFrame));
    }
    return buildSignature(out);
  } finally {
    if (own) await b.close();
    await rm(dir, { recursive: true, force: true });
  }
}

// A short fact sheet for the convert prompt. Numbers the agent must not invent.
// Peak painted/layout width across ALL elements. This — not any single
// element's value — is the evidence for a live perspective: with a small number
// of scroll stops most elements are simply never sampled at the near side, so
// their own ratio can sit below 1 while the effect is working perfectly.
export const peakMagnification = (sig) =>
  Math.max(1, ...(sig?.elements || []).map((e) => e.magnification || 1));

export function summarizeForPrompt(sig) {
  if (!sig?.elements?.length) return '';
  const rows = sig.elements.map((e) => {
    const bits = [e.moves && 'moves', e.fades && 'fades', e.filters && 'filter changes'].filter(Boolean);
    return `- ${e.key}: ${bits.length ? bits.join(', ') : 'STATIC (no measured change)'}` +
      `; max travel ${e.travel}px; painted/layout width ${e.magnification}×`;
  });
  const peak = +peakMagnification(sig).toFixed(3);
  return [
    `Measured over ${sig.frames} scroll stops in a real browser:`,
    ...rows,
    '',
    `Peak painted/layout width across all elements: ${peak}×.`,
    peak > 1.05
      ? `A parent \`perspective\` IS reaching these elements (a rotation makes the near edge paint wider than the layout box). Per-element values below 1 just mean that element was never sampled at the near side — do not read them as a broken perspective.`
      : `No element ever painted wider than its layout box, so either there is no perspective in play or it is not reaching the animated elements. Do not claim a working 3D perspective.`,
    '',
    'Use these numbers. Do not contradict them, and do not invent numbers this does not cover.',
  ].join('\n');
}

// Did sanitizing change the motion? Compares which elements move/fade, not exact
// pixels — a sanitized demo may legitimately differ in size or item count.
export function compareSignatures(original, candidate) {
  const byKey = (s) => new Map((s?.elements || []).map((e) => [e.key, e]));
  const a = byKey(original), b = byKey(candidate);
  const notes = [];

  const animatedA = [...a.values()].filter((e) => e.moves || e.fades || e.filters);
  const animatedB = [...b.values()].filter((e) => e.moves || e.fades || e.filters);
  if (animatedB.length === 0 && animatedA.length > 0) notes.push('sanitized demo has NO animated elements');

  for (const [key, ea] of a) {
    const eb = b.get(key);
    if (!eb) { notes.push(`${key}: missing from sanitized demo`); continue; }
    if ((ea.moves || ea.fades || ea.filters) && !(eb.moves || eb.fades || eb.filters)) {
      notes.push(`${key}: animated in original, static in sanitized demo`);
    }
  }

  // Perspective is judged on the PEAK across elements, never per element —
  // per-element ratios depend on which frames happened to catch an element at
  // the near side, so comparing them one by one produces false alarms.
  const pa = peakMagnification(original), pb = peakMagnification(candidate);
  if (pa > 1.05 && pb <= 1.01) {
    notes.push(`perspective applied in original (peak ${pa.toFixed(3)}×) but flat in sanitized demo`);
  }
  return { ok: notes.length === 0, notes, animatedOriginal: animatedA.length, animatedCandidate: animatedB.length };
}
