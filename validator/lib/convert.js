import { appendFile } from 'node:fs/promises';
import { mapLimit } from './fix.js';
import { runAgent as realRunAgent } from './agent.js';
import { writePrompt } from './prompts.js';
import { SUGGESTED_GLOBALS_FILE } from './constants.js';

// Assemble the system+user prompt that runs the interact-example-builder skill
// headlessly: skill instructions, exemplar and the shared globals go in the
// system prompt; the demo source is the user message.
//
// The globals are not decoration. The skill's dedupe test says a platform fact
// already stated in house-rules.md must NOT be repeated in an example's mechanism
// note — otherwise the same fact is restated ~170 times and drifts. Headless the
// agent cannot read files, so the globals must be in the prompt or the test is
// silently unenforceable.
export function buildConvertPrompt({ skill, exemplar = '', houseRules = '', design = '',
                                     ladder = '', suggested = '', facts = '', relPath, source }) {
  const factsBlock = facts
    ? `\n=== MEASURED FACTS (from a real browser — authoritative, overrides your reading of the source) ===\n${facts}\n`
    : '';
  const system = `You are executing the "interact-example-builder" skill. Follow its instructions exactly to turn a @wix/interact demo into one example file.

You are running HEADLESSLY: no browser, no file access, no tools. Text in, text out. Follow the skill's headless guidance — work from the source, do the checks that need only the text, and state plainly which verifications you could not run.

=== SKILL INSTRUCTIONS ===
${skill}

=== GLOBAL: house-rules.md (ships with every generation — do NOT repeat any of this in a mechanism note) ===
${houseRules}

=== GLOBAL: design-guidelines.md (ships with every generation — do NOT repeat any of this in a mechanism note) ===
${design}

=== GLOBAL: adaptation-ladder.md (ships with every generation — cite rungs by number, do NOT restate) ===
${ladder}

=== GLOBAL: suggested-globals.md (already-proposed facts — do not propose these again) ===
${suggested}

=== REFERENCE EXEMPLAR (match this structure exactly) ===
${exemplar}
${factsBlock}

OUTPUT CONTRACT: Return ONLY the finished example as raw markdown. Do NOT wrap the whole document in a code fence, and do NOT add any preamble or closing remarks. Begin with the "# Task" H1 line. The sanitized demo goes last, under "# Reference demo", inside an \`\`\`html fence.

If — and only if — you found a fact that belongs in the GLOBAL files rather than in this example, end with a final "## Proposed globals" section in the format that suggested-globals.md documents. It is stripped off before the example is saved. Omit the section entirely if you have nothing to propose.`;
  const user = `Convert this @wix/interact demo into an example. Source file: ${relPath}\n\n${source}`;
  return { system, user };
}

// Split a trailing "## Proposed globals" section off the example. Anything there
// is destined for the shared inbox, not for the example file.
export function splitProposedGlobals(md) {
  const m = String(md).match(/\n##\s*Proposed globals\s*\n/i);
  if (!m) return { example: String(md).trim(), proposed: '' };
  return {
    example: String(md).slice(0, m.index).trim(),
    proposed: String(md).slice(m.index + m[0].length).trim(),
  };
}

// The model occasionally wraps the whole doc in a ```markdown fence — strip it.
function stripMarkdownFence(text) {
  const t = String(text).trim();
  const m = t.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)\n```$/i);
  return (m ? m[1] : t).trim();
}

export async function convertFile(rootDir, relPath, opts) {
  const { source, skill, exemplar, houseRules = '', design = '', ladder = '', suggested = '',
          model, onLog, runAgent = realRunAgent, probe = false, probeImpl = defaultProbe,
          appendProposed = defaultAppendProposed } = opts;
  try {
    // Measured facts beat a model reading source — but a probe failure (no
    // Playwright, a demo that won't load) must never block a conversion.
    let facts = '';
    if (probe) {
      try { facts = await probeImpl(source); }
      catch (err) { onLog?.(relPath, `\n[probe skipped: ${err.message || err}]\n`); }
    }
    const { system, user } = buildConvertPrompt({ skill, exemplar, houseRules, design, ladder, suggested, facts, relPath, source });
    const onDelta = onLog ? (text) => onLog(relPath, text) : undefined;
    const raw = stripMarkdownFence(await runAgent(system, user, { model, onDelta }));
    const { example, proposed } = splitProposedGlobals(raw);
    const outPath = await writePrompt(rootDir, relPath, example);
    if (proposed) await appendProposed(relPath, proposed);
    return { path: relPath, status: 'converted', via: 'agent', outPath,
             proposed: Boolean(proposed), probed: Boolean(facts) };
  } catch (err) {
    return { path: relPath, status: 'failed', error: String(err.message || err) };
  }
}

async function defaultProbe(source) {
  const { probeHtml, summarizeForPrompt } = await import('./probe.js');
  return summarizeForPrompt(await probeHtml(source));
}

// Append-only, and never in parallel with itself — mapLimit runs conversions
// concurrently, so serialize appends behind one promise chain.
let appendQueue = Promise.resolve();
function defaultAppendProposed(relPath, proposed) {
  appendQueue = appendQueue.then(() =>
    appendFile(SUGGESTED_GLOBALS_FILE, `\n\n<!-- from ${relPath} -->\n${proposed}\n`, 'utf8')
      .catch(() => {}));           // a full inbox must never fail a conversion
  return appendQueue;
}

export async function runConvert(rootDir, files, opts) {
  const { concurrency = 4, onResult, ...rest } = opts;
  return mapLimit(files, concurrency, async (f) => {
    const result = await convertFile(rootDir, f.path, { ...rest, source: f.source });
    if (onResult) onResult(result);
    return result;
  });
}
