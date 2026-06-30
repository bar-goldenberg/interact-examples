import { detect } from './detect.js';
import { buildPrompt } from './prompt.js';
import { writeDraft } from './drafts.js';
import { extractHtml, runAgent as realRunAgent } from './agent.js';

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

export async function fixFile(rootDir, relPath, opts) {
  const { source, optionIds, customPrompt, specText, model, runAgent = realRunAgent } = opts;
  try {
    const diagnosis = detect(relPath, source);
    const { system, user } = buildPrompt({ diagnosis, source, optionIds, customPrompt, specText });
    const html = extractHtml(await runAgent(system, user, { model }));
    await writeDraft(rootDir, relPath, html);
    const recheck = detect(relPath, html);
    let clean = recheck.category === 'Clean & current'
      || (recheck.isLatest && recheck.oldSyntaxMarkers.length === 0);
    if (clean && optionIds.includes('convertCustomEffect') && recheck.usesCustomEffect) clean = false;
    if (clean && optionIds.includes('removeExtraJs') && recheck.usesExtraJs) clean = false;
    return { path: relPath, status: clean ? 'fixed' : 'needsReview', recheck };
  } catch (err) {
    return { path: relPath, status: 'fixFailed', error: String(err.message || err) };
  }
}

export async function runFix(rootDir, files, opts) {
  const { concurrency = 4, ...rest } = opts;
  return mapLimit(files, concurrency, (f) =>
    fixFile(rootDir, f.path, { ...rest, source: f.source }));
}
