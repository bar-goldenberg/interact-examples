// validator/lib/refinery.js — autonomous refinement engine.
// This file starts with the pure core (decide/historyBlock/extractTriggers);
// the job runner + queue are added by a later task.

const scoreOf = (it) => (it.judge && typeof it.judge.score === 'number' ? it.judge.score : null);

// Stop rule: green at threshold; amber on plateau (two consecutive iterations
// without a NEW BEST score — errors count as non-improving); amber at the cap.
export function decide({ iterations, stop }) {
  const last = scoreOf(iterations[iterations.length - 1]);
  if (last !== null && last >= stop.threshold) return { action: 'stop', status: 'green', reason: null };

  let best = -Infinity, sinceBest = 0;
  for (const it of iterations) {
    const s = scoreOf(it);
    if (s !== null && s > best) { best = s; sinceBest = 0; }
    else sinceBest++;
  }
  if (iterations.length >= stop.maxIters) return { action: 'stop', status: 'amber', reason: 'cap' };
  if (sinceBest >= stop.plateau) return { action: 'stop', status: 'amber', reason: 'plateau' };
  return { action: 'continue' };
}

// Compact cross-iteration memory for the refiner (explicit, never a session).
export function historyBlock(iterations) {
  return (iterations || []).map((it) => {
    const s = scoreOf(it);
    if (s === null) return `iter ${it.iter} → judge failed`;
    const note = String(it.judge.notes || '').split('\n')[0].slice(0, 200);
    return `iter ${it.iter} → ${s}/10: ${note}`;
  }).join('\n');
}

// Trigger types used by the original example (told to the judge: scroll sweeps
// can't show hover/click states, so it must not penalize them).
export function extractTriggers(source) {
  const out = [];
  for (const m of String(source).matchAll(/trigger:\s*['"](\w+)['"]/g)) {
    if (!out.includes(m[1])) out.push(m[1]);
  }
  return out;
}
