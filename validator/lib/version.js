// Semver-ish comparison for the CDN version pinned in an example's import URL.
// Only ever sees plain x.y.z strings (the detect regex captures exactly that),
// so this deliberately handles no pre-release or build metadata.

const parse = (v) => {
  const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(v ?? '').trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

// True when `version` is >= `min`. Segments compare numerically, so 2.10.0 and
// 10.0.0 both beat 2.5.1 — a string compare gets those backwards. An absent or
// unparseable version is never "at least" anything: unpinned imports must keep
// reading as outdated.
export function isAtLeastVersion(version, min) {
  const a = parse(version), b = parse(min);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return true;
}
