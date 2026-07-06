import { readPrompt, writePromptRaw } from './prompts.js';

const historyRel = (promptRel) => `${promptRel}.history.json`;

export async function readLoop(rootDir, promptRel) {
  const raw = await readPrompt(rootDir, historyRel(promptRel));
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      return { working: parsed.working, rounds: parsed.rounds || [] };
    } catch { /* fall through to defaults */ }
  }
  const md = await readPrompt(rootDir, promptRel);
  return { working: md ?? '', rounds: [] };
}

async function save(rootDir, promptRel, loop) {
  await writePromptRaw(rootDir, historyRel(promptRel), JSON.stringify(loop, null, 2));
}

export async function recordRound(rootDir, promptRel, { guideline, sections, score, notes, newWorking }) {
  const loop = await readLoop(rootDir, promptRel);
  const round = loop.rounds.length + 1;
  loop.rounds.push({ round, guideline, sections: sections || [], score, notes });
  loop.working = newWorking;
  await save(rootDir, promptRel, loop);
  return { round };
}

export async function rollback(rootDir, promptRel, round) {
  const loop = await readLoop(rootDir, promptRel);
  const target = loop.rounds.find((r) => r.round === round);
  if (!target) throw new Error(`no round ${round}`);
  loop.working = target.guideline;
  await save(rootDir, promptRel, loop);
  return { working: loop.working };
}

export async function finalize(rootDir, promptRel) {
  const loop = await readLoop(rootDir, promptRel);
  await writePromptRaw(rootDir, promptRel, loop.working);
}
