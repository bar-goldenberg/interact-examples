import { LATEST_VERSION } from './constants.js';
import { isAtLeastVersion } from './version.js';

// Comments are prose, not code. A file that documents what it deliberately does
// NOT do ("no requestAnimationFrame loop, no Element.animate() calls") was read
// as doing exactly that, so an honest comment earned the file a red "extra JS"
// mark. Strip comment bodies before pattern-matching.
//
// Scope matters: the string-aware walk runs ONLY inside <script> bodies. Run
// over the whole document it treats the apostrophe in ordinary prose ("it's")
// as an opening quote and swallows everything up to the next one — which is a
// far worse misreading than the one being fixed.
function stripJsComments(js) {
  let out = '';
  let i = 0;
  while (i < js.length) {
    const two = js.slice(i, i + 2);
    if (two === '//') {
      while (i < js.length && js[i] !== '\n') i++;
      continue;
    }
    if (two === '/*') {
      const end = js.indexOf('*/', i + 2);
      i = end === -1 ? js.length : end + 2;
      continue;
    }
    const q = js[i];
    // String bodies are KEPT — the patterns look inside them, e.g.
    // addEventListener('scroll'). Walking them is also what stops the "//" in
    // an https:// import URL from being read as a line comment. Regex literals
    // are not parsed; one containing an unescaped "//" would still confuse this.
    if (q === "'" || q === '"' || q === '`') {
      out += q;
      i++;
      while (i < js.length && js[i] !== q) {
        if (js[i] === '\\') { out += js.slice(i, i + 2); i += 2; continue; }
        out += js[i];
        i++;
      }
      if (i < js.length) { out += q; i++; }
      continue;
    }
    out += js[i];
    i++;
  }
  return out;
}

function stripComments(source) {
  return source
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi,
      (_m, open, body, close) => open + stripJsComments(body) + close);
}

const EXTRA_JS_PATTERNS = [
  { re: /addEventListener\(\s*['"`](scroll|wheel|mousemove|pointermove|pointerdown|touchmove)['"`]/g,
    label: (m) => `addEventListener(${m[1]})` },
  { re: /\bIntersectionObserver\b/, label: () => 'IntersectionObserver' },
  { re: /\.animate\s*\(/, label: () => 'Element.animate()' },
  { re: /\brequestAnimationFrame\b/, label: () => 'requestAnimationFrame loop' },
  { re: /\bsetInterval\b/, label: () => 'setInterval loop' },
];

function findExtraJs(source) {
  const signals = [];
  for (const { re, label } of EXTRA_JS_PATTERNS) {
    const r = new RegExp(re.source, re.flags);
    if (r.global) {
      let m;
      while ((m = r.exec(source)) !== null) {
        const s = label(m);
        if (!signals.includes(s)) signals.push(s);
      }
    } else if (r.test(source)) {
      signals.push(label());
    }
  }
  return signals;
}

function findOldSyntaxMarkers(source) {
  const markers = [];
  if (/wix-interact-element/.test(source)) markers.push('wix-interact-element tag (use interact-element)');
  if (/data-wix-path/.test(source)) markers.push('data-wix-path attribute (use data-interact-key)');
  if (/\bmethod\s*:/.test(source)) markers.push('params.method (use stateAction on the effect)');
  if (/\btype\s*:\s*['"`](once|repeat|alternate|state)['"`]/.test(source)) markers.push('params.type play-mode (use triggerType on the effect)');
  if (/\btype\s*:\s*['"`](percentage|px|vh|vw|vmin|vmax|em|rem)['"`]/.test(source)) markers.push('range offset {value,type} (use unit)');
  if (/useCutsomElement/.test(source)) markers.push('useCutsomElement typo (use useCustomElement)');
  return markers;
}

export function detect(filePath, source) {
  const usesInteract = /@wix\/interact/.test(source);
  const versionMatch = source.match(/@wix\/interact@(\d+\.\d+\.\d+)/);
  const version = versionMatch ? versionMatch[1] : null;
  // >= not ==: a file ahead of the pin (e.g. 2.5.5 vs 2.5.1) is current, not outdated.
  const isLatest = isAtLeastVersion(version, LATEST_VERSION);
  const usesCustomEffect = /customEffect\s*:/.test(source);
  // These two scan for things the file DOES, so they must not see prose that
  // merely names them. usesInteract/version stay on the raw source: an inlined
  // bundle is still a real dependency even when the only readable mention of
  // the package is a comment above it.
  const code = stripComments(source);
  const extraJsSignals = findExtraJs(code);
  const usesExtraJs = extraJsSignals.length > 0;
  const oldSyntaxMarkers = findOldSyntaxMarkers(code);

  let category;
  if (!usesInteract) category = 'Not using interact';
  else if (!isLatest || oldSyntaxMarkers.length > 0) category = 'Outdated version';
  else if (usesExtraJs) category = 'Uses extra JS';
  else if (usesCustomEffect) category = 'Uses customEffect';
  else category = 'Clean & current';

  return { path: filePath, usesInteract, version, isLatest, usesCustomEffect,
    usesExtraJs, extraJsSignals, oldSyntaxMarkers, category };
}
