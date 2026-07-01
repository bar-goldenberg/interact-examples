import { LATEST_VERSION } from './constants.js';

// Constrained set of range-offset units — used so the type→unit rename never
// touches an unrelated `type:` key (e.g. namedEffect: { type: 'FadeIn' }).
const UNITS = 'percentage|px|em|rem|vh|vw|vmin|vmax';

// Pin every @wix/interact import to the latest version.
function pinInteract(src) {
  return src
    // already-versioned imports → bump
    .replace(/@wix\/interact@\d+\.\d+\.\d+/g, `@wix/interact@${LATEST_VERSION}`)
    // unpinned imports (not followed by @version, a word char, or a hyphen) → pin.
    // A trailing "/web" style subpath is preserved (lookahead allows "/").
    .replace(/@wix\/interact(?!@)(?![\w-])/g, `@wix/interact@${LATEST_VERSION}`);
}

const renameTag = (src) => src.replace(/wix-interact-element/g, 'interact-element');
// The old <wix-interact-element> bound via data-wix-path; the public
// <interact-element> binds via data-interact-key (same value → the interaction
// key). Renaming the tag without this leaves elements unbound (nothing animates).
const renameKeyAttr = (src) => src.replace(/data-wix-path/g, 'data-interact-key');
const fixTypo = (src) => src.replace(/useCutsomElement/g, 'useCustomElement');
const renameOffsetUnit = (src) =>
  src.replace(new RegExp(`\\btype(\\s*):(\\s*)(['"\`])(${UNITS})\\3`, 'g'), 'unit$1:$2$3$4$3');

// Deterministic, text-only transforms gated by the selected fix options.
// Returns the rewritten source and a list of the transforms that changed it.
// Does NOT handle structural changes (params.type/method play-mode relocation,
// customEffect conversion, non-interact conversion) — those stay agent-only.
export function applyCodemods(source, optionIds = []) {
  const steps = [];
  if (optionIds.includes('updateVersion')) {
    steps.push([`Pinned @wix/interact to ${LATEST_VERSION}`, pinInteract]);
  }
  if (optionIds.includes('migrateSyntax')) {
    steps.push(['Renamed wix-interact-element → interact-element', renameTag]);
    steps.push(['Renamed data-wix-path → data-interact-key', renameKeyAttr]);
    steps.push(['Fixed useCutsomElement typo', fixTypo]);
    steps.push(['Renamed range-offset type → unit', renameOffsetUnit]);
  }
  let output = source;
  const applied = [];
  for (const [label, fn] of steps) {
    const next = fn(output);
    if (next !== output) { applied.push(label); output = next; }
  }
  return { output, applied };
}
