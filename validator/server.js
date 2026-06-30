import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { listAnimationFiles } from './lib/files.js';
import { detect } from './lib/detect.js';
import { readOriginal, readDraft, computeDiff, applyDraft, discardDraft } from './lib/drafts.js';
import { runFix } from './lib/fix.js';
import { FIX_OPTIONS } from './lib/prompt.js';
import { loadSpecText } from './lib/spec.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function createApp(rootDir) {
  const root = resolve(rootDir);
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  app.use(express.static(join(__dirname, 'public')));

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
    try {
      const { paths, optionIds = [], customPrompt = '' } = req.body;
      if (!Array.isArray(paths) || !paths.length) return bad(res, 'paths required');
      const specText = await loadSpecText(root);
      const files = [];
      const readFailures = [];
      for (const p of paths) {
        try {
          files.push({ path: p, source: await readOriginal(root, p) });
        } catch (err) {
          readFailures.push({ path: p, status: 'fixFailed', error: String(err.message || err) });
        }
      }
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
