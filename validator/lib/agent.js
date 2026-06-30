import { spawn } from 'node:child_process';
import { writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Strips a fenced code block (```html … ``` or bare ``` … ```) if one is
// present anywhere in the text; otherwise returns the trimmed text unchanged.
export function extractHtml(text) {
  const t = String(text).trim();
  const fence = t.match(/```(?:html)?\s*\n([\s\S]*?)\n```/i);
  return (fence ? fence[1] : t).trim();
}

// Collect a child process's stdout/stderr, feeding `stdin` to it.
function spawnCollect(cmd, args, stdin) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (c) => { stdout += c; });
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
    child.stdin.on('error', () => {}); // ignore EPIPE if the CLI exits early
    child.stdin.write(stdin);
    child.stdin.end();
  });
}

// One-shot rewrite via the local `claude` CLI (reuses the machine's
// `claude login` — no API key). The system prompt goes to a temp file to
// dodge arg-size limits; the user prompt is piped on stdin. Tools are
// stripped via --exclude-dynamic-system-prompt-sections so it's a pure
// text-in / text-out LLM call. Returns the assistant's final text.
export async function runAgent(system, user, { model } = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'iv-agent-'));
  const sysFile = join(dir, 'system.txt');
  await writeFile(sysFile, system, 'utf8');

  const args = ['-p', '--output-format', 'json',
    '--system-prompt-file', sysFile,
    '--exclude-dynamic-system-prompt-sections'];
  if (model) args.push('--model', model);

  try {
    const { code, stdout, stderr } = await spawnCollect('claude', args, user);
    if (code !== 0) throw new Error(`claude exited ${code}: ${stderr.slice(0, 500)}`);
    let parsed;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      throw new Error(`could not parse claude output: ${stdout.slice(0, 300)}`);
    }
    // `--output-format json` yields an array of messages; the final result
    // lives in the element with type 'result'. Older CLIs returned that
    // object directly, so handle both shapes.
    const result = Array.isArray(parsed)
      ? parsed.find((m) => m && m.type === 'result')
      : parsed;
    if (!result || result.is_error || typeof result.result !== 'string') {
      throw new Error(`claude error: ${result?.subtype || result?.error || 'no result field'}`);
    }
    return result.result;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
