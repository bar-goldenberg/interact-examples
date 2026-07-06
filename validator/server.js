import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { listAnimationFiles } from './lib/files.js';
import { detect } from './lib/detect.js';
import { readOriginal, readDraft, computeDiff, applyDraft, discardDraft } from './lib/drafts.js';
import { runFix } from './lib/fix.js';
import { runConvert } from './lib/convert.js';
import { listPrompts, readPrompt } from './lib/prompts.js';
import { loadConvertSkill } from './lib/skill.js';
import { FIX_OPTIONS } from './lib/prompt.js';
import { loadSpecText } from './lib/spec.js';
import { listSections, generate, pingStatus } from './lib/playground.js';
import { readLoop, recordRound, rollback, finalize } from './lib/loop-store.js';
import { refineGuideline } from './lib/refine.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(rootDir) {
  const root = resolve(rootDir);
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.static(join(__dirname, 'public')));
  app.use('/vendor', express.static(join(__dirname, 'vendor')));

  const bad = (res, msg) => res.status(400).json({ error: msg });

  app.get('/api/options', (_req, res) => {
    res.json({ options: FIX_OPTIONS.map(({ id, label, default: d }) => ({ id, label, default: d })) });
  });

  app.get('/api/files', async (_req, res) => {
    res.json({ files: await listAnimationFiles(root) });
  });

  app.get('/api/file', async (req, res) => {
    try {
      res.json({ source: await readOriginal(root, String(req.query.path)) });
    } catch (err) {
      bad(res, String(err.message || err));
    }
  });

  app.get('/api/draft', async (req, res) => {
    try {
      const source = await readDraft(root, String(req.query.path));
      if (source === null) return res.status(404).json({ error: 'no draft' });
      res.json({ source });
    } catch (err) { bad(res, String(err.message || err)); }
  });

  app.post('/api/scan', async (req, res) => {
    try {
      const all = await listAnimationFiles(root);
      const wanted = Array.isArray(req.body.paths) && req.body.paths.length
        ? all.filter((f) => req.body.paths.includes(f.path)) : all;
      const results = [];
      for (const f of wanted) {
        results.push(detect(f.path, await readOriginal(root, f.path)));
      }
      const summary = {};
      for (const r of results) summary[r.category] = (summary[r.category] || 0) + 1;
      res.json({ results, summary, total: results.length });
    } catch (err) { bad(res, String(err.message || err)); }
  });

  app.post('/api/fix', async (req, res) => {
    const { paths, optionIds = [], customPrompt = '' } = req.body;
    if (!Array.isArray(paths) || !paths.length) return bad(res, 'paths required');
    const specText = await loadSpecText(root);

    // Read sources defensively — a bad path becomes a fixFailed result.
    const files = [];
    const readFailures = [];
    for (const p of paths) {
      try {
        files.push({ path: p, source: await readOriginal(root, p) });
      } catch (err) {
        readFailures.push({ path: p, status: 'fixFailed', error: String(err.message || err) });
      }
    }

    // Streaming mode: emit a result per file as it finishes (Server-Sent
    // Events) so the UI can show live progress. Opt-in via Accept header.
    if ((req.headers.accept || '').includes('text/event-stream')) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      send('start', { total: paths.length, paths });
      for (const rf of readFailures) send('result', rf);
      try {
        await runFix(root, files, { optionIds, customPrompt, specText,
          onResult: (r) => send('result', r),
          onLog: (path, text, kind) => send('log', { path, text, kind }) });
        send('done', { ok: true });
      } catch (err) {
        send('error', { error: String(err.message || err) });
      }
      return res.end();
    }

    // Non-streaming mode (default): one JSON response with all results.
    try {
      const fixResults = await runFix(root, files, { optionIds, customPrompt, specText });
      res.json({ results: [...readFailures, ...fixResults] });
    } catch (err) { res.status(500).json({ error: String(err.message || err) }); }
  });

  app.get('/api/diff', async (req, res) => {
    try {
      const p = String(req.query.path);
      const draft = await readDraft(root, p);
      if (draft === null) return res.status(404).json({ error: 'no draft' });
      const original = await readOriginal(root, p);
      res.json({ parts: computeDiff(original, draft) });
    } catch (err) { bad(res, String(err.message || err)); }
  });

  app.post('/api/apply', async (req, res) => {
    const results = [];
    for (const p of req.body.paths || []) {
      try {
        await applyDraft(root, p);
        results.push({ path: p, ok: true });
      } catch (err) {
        results.push({ path: p, ok: false, error: String(err.message || err) });
      }
    }
    res.json({ results });
  });

  app.post('/api/discard', async (req, res) => {
    const results = [];
    for (const p of req.body.paths || []) {
      try {
        await discardDraft(root, p);
        results.push({ path: p, ok: true });
      } catch (err) {
        results.push({ path: p, ok: false, error: String(err.message || err) });
      }
    }
    res.json({ results });
  });

  // ── Prompts (convert-to-prompt output) ─────────────
  app.get('/api/prompts', async (_req, res) => {
    res.json({ files: await listPrompts(root) });
  });

  app.get('/api/prompt', async (req, res) => {
    try {
      const source = await readPrompt(root, String(req.query.path));
      if (source === null) return res.status(404).json({ error: 'no prompt' });
      res.json({ source });
    } catch (err) { bad(res, String(err.message || err)); }
  });

  app.post('/api/convert', async (req, res) => {
    const { paths } = req.body;
    if (!Array.isArray(paths) || !paths.length) return bad(res, 'paths required');
    const { skill, exemplar } = await loadConvertSkill();

    const files = [];
    const readFailures = [];
    for (const p of paths) {
      try { files.push({ path: p, source: await readOriginal(root, p) }); }
      catch (err) { readFailures.push({ path: p, status: 'failed', error: String(err.message || err) }); }
    }

    if ((req.headers.accept || '').includes('text/event-stream')) {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
      const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      send('start', { total: paths.length, paths });
      for (const rf of readFailures) send('result', rf);
      try {
        await runConvert(root, files, { skill, exemplar,
          onResult: (r) => send('result', r),
          onLog: (path, text) => send('log', { path, text }) });
        send('done', { ok: true });
      } catch (err) { send('error', { error: String(err.message || err) }); }
      return res.end();
    }

    try {
      const results = await runConvert(root, files, { skill, exemplar });
      res.json({ results: [...readFailures, ...results] });
    } catch (err) { res.status(500).json({ error: String(err.message || err) }); }
  });

  app.get('/api/playground/status', async (_req, res) => { res.json({ up: await pingStatus({}) }); });

  app.get('/api/playground/sections', async (_req, res) => {
    const sections = await listSections();
    res.json({ sections: sections.map((s) => ({ id: s.id })) });
  });

  app.get('/api/loop', async (req, res) => {
    try { res.json(await readLoop(root, String(req.query.promptPath))); }
    catch (err) { bad(res, String(err.message || err)); }
  });

  app.post('/api/loop/run', async (req, res) => {
    const { promptPath, sections } = req.body;
    if (!promptPath || !Array.isArray(sections) || !sections.length) return bad(res, 'promptPath and sections required');
    const { working } = await readLoop(root, promptPath);
    const all = await listSections();
    const chosen = all.filter((s) => sections.includes(s.id));
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    send('start', { sections: chosen.map((s) => s.id) });
    await Promise.all(chosen.map(async (s) => {
      try {
        const { config } = await generate({ html: s.html, css: s.css, guideline: working });
        send('result', { id: s.id, config, html: s.html, css: s.css });
      } catch (err) {
        send('result', { id: s.id, error: String(err.message || err) });
      }
    }));
    send('done', { ok: true });
    res.end();
  });

  app.post('/api/loop/refine', async (req, res) => {
    const { promptPath, score, notes, sections, configs } = req.body;
    if (!promptPath) return bad(res, 'promptPath required');
    const { working } = await readLoop(root, promptPath);
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    const send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    try {
      const guideline = await refineGuideline({ guideline: working, score, notes, onDelta: (t) => send('log', { text: t }) });
      await recordRound(root, promptPath, { guideline: working, sections: configs || [], score, notes, newWorking: guideline });
      send('done', { guideline });
    } catch (err) { send('error', { error: String(err.message || err) }); }
    res.end();
  });

  app.post('/api/loop/finalize', async (req, res) => {
    try { await finalize(root, String(req.body.promptPath)); res.json({ ok: true }); }
    catch (err) { bad(res, String(err.message || err)); }
  });

  app.post('/api/loop/rollback', async (req, res) => {
    try { res.json(await rollback(root, String(req.body.promptPath), Number(req.body.round))); }
    catch (err) { bad(res, String(err.message || err)); }
  });

  return app;
}

// Self-start when run directly (repo root is the parent of validator/).
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(__dirname, '..');
  const port = process.env.PORT || 4500;
  createApp(root).listen(port, () => {
    console.log(`Interact Validator on http://localhost:${port} (root: ${root})`);
  });
}
