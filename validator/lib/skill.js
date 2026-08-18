import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EXAMPLE_SKILL_DIR, GLOBALS_DIR } from './constants.js';

// Load the interact-example-builder skill's instructions, its exemplar, and the
// shared globals, so a headless `claude -p` run can follow it without relying on
// dynamic skill auto-loading (which we strip for a clean text-in/text-out call).
//
// The globals matter as much as the skill text: the skill tells the agent to read
// house-rules.md and adaptation-ladder.md to apply its dedupe test (a platform
// fact already stated globally must NOT be repeated in an example's mechanism
// note). Headless it cannot read anything, so they have to be pasted in.
// suggested-globals.md is included for the same reason — a fact already proposed
// by an earlier conversion should not be proposed again.
export async function loadConvertSkill() {
  const read = (p) => readFile(p, 'utf8').catch(() => '');
  const [skill, exemplar, houseRules, design, ladder, suggested] = await Promise.all([
    readFile(join(EXAMPLE_SKILL_DIR, 'SKILL.md'), 'utf8'),
    read(join(EXAMPLE_SKILL_DIR, 'reference', '3d-small-carousel.example.md')),
    read(join(GLOBALS_DIR, 'house-rules.md')),
    read(join(GLOBALS_DIR, 'design-guidelines.md')),
    read(join(GLOBALS_DIR, 'adaptation-ladder.md')),
    read(join(GLOBALS_DIR, 'suggested-globals.md')),
  ]);
  return { skill, exemplar, houseRules, design, ladder, suggested };
}
