import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { IGNORED_DIRS, IGNORED_FILES, EXAMPLE_MD_DIRS } from './constants.js';

// An example is any `.html`, plus `.md` docs living under an allowlisted
// top-level dir (EXAMPLE_MD_DIRS) — the latter render as text in the tab.
function isExample(rel) {
  if (rel.endsWith('.html')) return true;
  if (rel.endsWith('.md')) return EXAMPLE_MD_DIRS.has(rel.split('/')[0]);
  return false;
}

export async function listAnimationFiles(rootDir) {
  const out = [];
  async function walk(absDir) {
    const entries = await readdir(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = join(absDir, entry.name);
      if (entry.isDirectory()) {
        if (IGNORED_DIRS.has(entry.name)) continue;
        await walk(abs);
      } else if (entry.isFile() && !IGNORED_FILES.has(entry.name)) {
        const rel = relative(rootDir, abs).split(sep).join('/');
        if (!isExample(rel)) continue;
        const slash = rel.lastIndexOf('/');
        out.push({
          path: rel,
          dir: slash === -1 ? '' : rel.slice(0, slash),
          file: slash === -1 ? rel : rel.slice(slash + 1),
        });
      }
    }
  }
  await walk(rootDir);
  return out.sort((a, b) => a.path.localeCompare(b.path));
}
