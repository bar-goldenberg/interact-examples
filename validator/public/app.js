import { injectBase } from './preview.js';
import { mdToHtml } from './md.js';

// Version state — mutually exclusive (green / yellow / red).
const VER = {
  clean:    { cls: 'green',  label: 'Latest version', tip: 'Uses @wix/interact pinned to the latest version, with no outdated syntax.' },
  outdated: { cls: 'yellow', label: 'Old version / syntax', tip: 'Uses @wix/interact but on an old or unpinned version, or with outdated syntax.' },
  none:     { cls: 'red',    label: 'No interact', tip: 'Does not use @wix/interact at all.' },
};
function versionState(d) {
  if (!d.usesInteract) return 'none';
  if (d.isLatest && (d.oldSyntaxMarkers?.length || 0) === 0) return 'clean';
  return 'outdated';
}
function indicatorsHTML(d) {
  if (!d) return '';
  const v = VER[versionState(d)];
  let h = `<span class="ind ${v.cls}" title="${esc(v.label)}"></span>`;
  if (d.usesCustomEffect) h += `<span class="ind purple" title="Uses customEffect"></span>`;
  if (d.usesExtraJs) h += `<span class="js-badge" title="JavaScript animation not tied to a customEffect">JS</span>`;
  return h;
}

const state = {
  files: [], diag: {}, drafts: new Set(), selected: new Set(), current: null,
  filter: '', mode: 'preview', version: 'current', progress: null,
  expanded: new Set(), logs: new Map(), activity: { open: false, file: null, follow: true },
  view: 'examples', prompts: [], promptExpanded: new Set(), currentPrompt: null, promptMode: 'rendered',
};
const $ = (id) => document.getElementById(id);
const api = (path, opts) => fetch(path, opts).then((r) => r.json());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function loadFiles() { state.files = (await api('/api/files')).files; renderTree(); }
async function loadPrompts() { state.prompts = (await api('/api/prompts')).files; if (state.view === 'prompts') renderTree(); }
async function loadOptions() {
  const { options } = await api('/api/options');
  $('fixOptions').innerHTML = options.map((o) =>
    `<label class="opt"><input type="checkbox" class="cb" name="opt" value="${esc(o.id)}" ${o.default ? 'checked' : ''}/>
      <span>${esc(o.label)}</span></label>`).join('');
}

const matchesFilter = (list) => state.filter ? list.filter((f) => f.path.toLowerCase().includes(state.filter.toLowerCase())) : list;
const visibleFiles = () => matchesFilter(state.files);
const visiblePrompts = () => matchesFilter(state.prompts);

// ── File tree (shared by both views) ────────────────
function buildTree(files) {
  const root = { dirs: new Map(), files: [] };
  for (const f of files) {
    const parts = f.path.split('/');
    let node = root, prefix = '';
    for (let i = 0; i < parts.length - 1; i++) {
      prefix = prefix ? `${prefix}/${parts[i]}` : parts[i];
      if (!node.dirs.has(parts[i])) node.dirs.set(parts[i], { name: parts[i], path: prefix, dirs: new Map(), files: [] });
      node = node.dirs.get(parts[i]);
    }
    node.files.push(f);
  }
  return root;
}
const FOLDER_ICON = '<svg class="ficon" viewBox="0 0 20 20" width="13" height="13" fill="currentColor" aria-hidden="true"><path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h3.379a1.5 1.5 0 0 1 1.06.44L9 5.5h7.5A1.5 1.5 0 0 1 18 7v7.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 14.5z"/></svg>';

function fileRow(f) {
  const d = state.diag[f.path];
  const draft = state.drafts.has(f.path) ? '<span class="draft-tag">draft</span>' : '';
  const checked = state.selected.has(f.path) ? 'checked' : '';
  const active = state.current === f.path ? ' active' : '';
  const title = d ? `${f.path} — ${VER[versionState(d)].label}` : f.path;
  return `<div class="file-row${active}" data-path="${esc(f.path)}" title="${esc(title)}">
    <input type="checkbox" class="cb" ${checked}/>
    <span class="fname">${esc(f.file)}</span>
    <span class="inds">${indicatorsHTML(d)}</span>${draft}</div>`;
}
function promptRow(f) {
  const active = state.currentPrompt === f.path ? ' active' : '';
  return `<div class="file-row${active}" data-ppath="${esc(f.path)}" title="${esc(f.path)}">
    <span class="fname">${esc(f.file)}</span><span class="md-badge">md</span></div>`;
}

function renderNodes(node, depth, forceOpen, expanded, rowFn) {
  const pad = (n) => `style="padding-left:${8 + n * 14}px"`;
  let html = '';
  for (const dir of [...node.dirs.values()].sort((a, b) => a.name.localeCompare(b.name))) {
    const open = forceOpen || expanded.has(dir.path);
    html += `<div class="folder-row" data-folder="${esc(dir.path)}" ${pad(depth)}>
      <span class="chev">${open ? '▾' : '▸'}</span>${FOLDER_ICON}<span class="fname">${esc(dir.name)}</span></div>`;
    if (open) html += `<div class="folder-children">${renderNodes(dir, depth + 1, forceOpen, expanded, rowFn)}</div>`;
  }
  for (const f of node.files.sort((a, b) => a.file.localeCompare(b.file))) {
    html += `<div ${pad(depth)} class="file-wrap">${rowFn(f)}</div>`;
  }
  return html;
}

function renderTree() {
  const isEx = state.view === 'examples';
  const files = isEx ? visibleFiles() : visiblePrompts();
  const expanded = isEx ? state.expanded : state.promptExpanded;
  const rowFn = isEx ? fileRow : promptRow;
  const empty = !isEx && !files.length
    ? '<div style="padding:16px;color:var(--text-3);font-size:12px;line-height:1.5">No prompts yet. Select example(s) and click <b>Convert to prompt</b>.</div>' : '';
  $('fileTree').innerHTML = empty || renderNodes(buildTree(files), 0, !!state.filter, expanded, rowFn);
}

function renderSummary() {
  const ds = Object.values(state.diag);
  if (!ds.length) { $('summary').innerHTML = ''; return; }
  let green = 0, yellow = 0, red = 0, purple = 0, js = 0;
  for (const d of ds) {
    const v = versionState(d);
    if (v === 'clean') green++; else if (v === 'outdated') yellow++; else red++;
    if (d.usesCustomEffect) purple++;
    if (d.usesExtraJs) js++;
  }
  const chip = (cls, n, label, tip) =>
    `<span class="stat tip" data-tip="${esc(label)} — ${esc(tip)}"><span class="ind ${cls}"></span><b>${n}</b></span>`;
  $('summary').innerHTML =
    `<span class="stat tip" data-tip="Total animation files scanned"><b>${ds.length}</b> files</span>` +
    chip('green', green, VER.clean.label, VER.clean.tip) +
    chip('yellow', yellow, VER.outdated.label, VER.outdated.tip) +
    chip('red', red, VER.none.label, VER.none.tip) +
    chip('purple', purple, 'customEffect', 'Files that use a customEffect.') +
    `<span class="stat tip" data-tip="JavaScript animation — files with JS not tied to a customEffect"><span class="js-badge sm">JS</span><b>${js}</b></span>`;
}

async function scan() {
  $('scanBtn').disabled = true; $('scanBtn').textContent = 'Scanning…';
  try {
    const { results } = await api('/api/scan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    state.diag = {};
    for (const r of results) state.diag[r.path] = r;
    renderSummary();
    renderTree();
  } finally {
    $('scanBtn').disabled = false; $('scanBtn').textContent = 'Scan';
  }
}

// ── Viewport ────────────────────────────────────────
function baseHrefFor(path) { const s = path.lastIndexOf('/'); return s === -1 ? '/' : '/' + path.slice(0, s + 1); }
const fetchSource = (kind, path) => api(`/api/${kind}?path=${encodeURIComponent(path)}`).then((r) => r.source);
const fetchPrompt = (path) => api(`/api/prompt?path=${encodeURIComponent(path)}`).then((r) => r.source);
const blankDoc = (label) => `<!doctype html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,system-ui,sans-serif;color:#b0b0b5;background:#fff;font-size:14px">${label}</body>`;

async function sourceFor(path, version) {
  if (version === 'draft') return state.drafts.has(path) ? fetchSource('draft', path) : null;
  return fetchSource('file', path);
}
async function renderDiff(path) {
  const res = await fetch(`/api/diff?path=${encodeURIComponent(path)}`);
  if (!res.ok) { $('diff').innerHTML = '<div style="color:var(--text-3)">No draft for this file yet — fix it first.</div>'; return; }
  const { parts } = await res.json();
  $('diff').innerHTML = parts.map((p) => {
    const safe = esc(p.value);
    if (p.added) return `<ins>${safe}</ins>`;
    if (p.removed) return `<del>${safe}</del>`;
    return `<span>${safe}</span>`;
  }).join('');
}

function renderTopbar() {
  const mt = $('modeTabs'), vt = $('verTabs');
  if (state.view === 'examples') {
    mt.innerHTML = ['preview', 'code', 'diff'].map((m) =>
      `<button data-mode="${m}" class="tab${state.mode === m ? ' active' : ''}">${m[0].toUpperCase() + m.slice(1)}</button>`).join('');
    vt.style.display = '';
    for (const b of vt.querySelectorAll('.tab')) b.classList.toggle('active', b.dataset.ver === state.version);
    $('topbar').classList.toggle('diff', state.mode === 'diff');
  } else {
    mt.innerHTML = [['rendered', 'Rendered'], ['raw', 'Raw']].map(([m, lbl]) =>
      `<button data-mode="${m}" class="tab${state.promptMode === m ? ' active' : ''}">${lbl}</button>`).join('');
    vt.style.display = 'none';
    $('topbar').classList.remove('diff');
  }
}

async function render() {
  renderTopbar();
  $('placeholder').querySelector('p').textContent = state.view === 'prompts' ? 'Select a prompt to view' : 'Select a file to preview';
  if (state.view === 'prompts') return renderPromptView();
  return renderExampleView();
}

async function renderExampleView() {
  const { mode, version, current } = state;
  $('markdown').hidden = true;
  const has = !!current;
  $('placeholder').hidden = has;
  $('preview').hidden = !(has && mode === 'preview');
  $('code').hidden = !(has && mode === 'code');
  $('diff').hidden = !(has && mode === 'diff');
  if (!has) return;
  if (mode === 'diff') { renderDiff(current); return; }
  const src = await sourceFor(current, version);
  if (mode === 'preview') $('preview').srcdoc = src === null ? blankDoc('No draft yet — fix this file first') : injectBase(src, baseHrefFor(current));
  else $('code').textContent = src === null ? 'No draft yet — fix this file first.' : src;
}

async function renderPromptView() {
  $('preview').hidden = true; $('diff').hidden = true;
  const has = !!state.currentPrompt;
  $('placeholder').hidden = has;
  $('markdown').hidden = !(has && state.promptMode === 'rendered');
  $('code').hidden = !(has && state.promptMode === 'raw');
  if (!has) return;
  const src = await fetchPrompt(state.currentPrompt);
  if (state.promptMode === 'rendered') $('markdown').innerHTML = mdToHtml(src);
  else $('code').textContent = src;
}

// ── Live progress (SSE) ─────────────────────────────
let progTimer = null;
function renderProgress() {
  const p = state.progress;
  if (!p) { $('fixProgress').innerHTML = ''; return; }
  const elapsed = Math.round(((p.endedAt || Date.now()) - p.startedAt) / 1000);
  const head = p.running
    ? `<span class="spinner"></span><span>Working…</span><span class="count">${p.done}/${p.total} · ${elapsed}s</span>`
    : `<span class="mk mk-ok">✓</span><span>Finished</span><span class="count">${p.done}/${p.total} · ${elapsed}s</span>`;
  const items = [...p.items.entries()].map(([path, st]) => {
    const mk = st.status === 'pending' ? '<span class="spinner"></span>'
      : st.status === 'fixed' ? '<span class="mk mk-ok">✓</span>'
      : st.status === 'needsReview' ? '<span class="mk mk-warn">⚠</span>'
      : '<span class="mk mk-fail">✗</span>';
    const t = `${path}${st.error ? ' — ' + st.error : ''}`;
    const via = st.via ? `<span class="via">${esc(st.via)}</span>` : '';
    return `<div class="prog-item">${mk}<span class="nm" title="${esc(t)}">${esc(path.split('/').pop())}</span>${via}</div>`;
  }).join('');
  $('fixProgress').innerHTML = `<div class="prog-head">${head}</div><div class="prog-list">${items}</div>`;
}

function appendLog(path, text) {
  state.logs.set(path, (state.logs.get(path) || '') + text);
  if (state.activity.follow) state.activity.file = path;
  if (state.activity.open) renderActivity();
}

async function streamSSE(res, onEvent) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf('\n\n')) >= 0) {
      const frame = buf.slice(0, i); buf = buf.slice(i + 2);
      const ev = /event:\s*(.+)/.exec(frame);
      const dt = /data:\s*([\s\S]+)/.exec(frame);
      if (!ev || !dt) continue;
      let d; try { d = JSON.parse(dt[1]); } catch { continue; }
      onEvent(ev[1].trim(), d);
    }
  }
}

function startRun(paths) {
  state.progress = { running: true, total: paths.length, done: 0, startedAt: Date.now(), endedAt: null,
    items: new Map(paths.map((p) => [p, { status: 'pending' }])) };
  state.logs = new Map();
  state.activity.follow = true;
  if (state.activity.open) renderActivity();
  renderProgress();
  progTimer = setInterval(renderProgress, 500);
}
function endRun() {
  state.progress.running = false;
  state.progress.endedAt = Date.now();
  clearInterval(progTimer);
  renderProgress();
}

function applyResult(r) {
  if (!state.progress) return;
  state.progress.items.set(r.path, { status: r.status, error: r.error, via: r.via });
  state.progress.done++;
  if (r.status !== 'fixFailed') state.drafts.add(r.path);
  renderProgress();
  renderTree();
}
function applyConvertResult(r) {
  if (!state.progress) return;
  const status = r.status === 'converted' ? 'fixed' : r.status === 'failed' ? 'fixFailed' : r.status;
  state.progress.items.set(r.path, { status, error: r.error, via: r.via });
  state.progress.done++;
  renderProgress();
}

async function runFix() {
  const paths = [...state.selected];
  if (!paths.length) { $('applyStatus').textContent = 'Select files first.'; return; }
  const optionIds = [...document.querySelectorAll('input[name=opt]:checked')].map((c) => c.value);
  const customPrompt = $('customPrompt').value;
  startRun(paths);
  $('fixBtn').disabled = true; $('convertBtn').disabled = true; $('applyStatus').textContent = '';
  try {
    const res = await fetch('/api/fix', {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ paths, optionIds, customPrompt }) });
    if (res.body && res.headers.get('content-type')?.includes('text/event-stream')) {
      await streamSSE(res, (type, d) => { if (type === 'result') applyResult(d); else if (type === 'log') appendLog(d.path, d.text); });
    } else { (await res.json()).results?.forEach(applyResult); }
  } finally {
    endRun();
    $('fixBtn').disabled = false; $('convertBtn').disabled = false;
    renderTree();
    if (state.view === 'examples' && state.current && state.drafts.has(state.current)) state.version = 'draft';
    render();
  }
}

async function runConvert() {
  const paths = [...state.selected];
  if (!paths.length) { $('applyStatus').textContent = 'Select example files first.'; return; }
  startRun(paths);
  $('fixBtn').disabled = true; $('convertBtn').disabled = true; $('applyStatus').textContent = '';
  try {
    const res = await fetch('/api/convert', {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ paths }) });
    if (res.body && res.headers.get('content-type')?.includes('text/event-stream')) {
      await streamSSE(res, (type, d) => { if (type === 'result') applyConvertResult(d); else if (type === 'log') appendLog(d.path, d.text); });
    } else { (await res.json()).results?.forEach(applyConvertResult); }
  } finally {
    endRun();
    $('fixBtn').disabled = false; $('convertBtn').disabled = false;
    await loadPrompts();
    $('applyStatus').textContent += '  Prompts updated — see the Prompts tab.';
  }
}

async function applyOrDiscard(endpoint) {
  const paths = [...state.selected].filter((p) => state.drafts.has(p));
  if (!paths.length) { $('applyStatus').textContent = 'No drafts in selection.'; return; }
  const data = await api(`/api/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paths }) });
  const results = data.results || [];
  const succeeded = results.filter((r) => r.ok).map((r) => r.path);
  const failed = results.filter((r) => !r.ok);
  for (const p of succeeded) state.drafts.delete(p);
  let msg = `${endpoint === 'apply' ? 'Applied' : 'Discarded'} ${succeeded.length} draft(s).`;
  if (failed.length) msg += ` Failed ${failed.length}: ${failed.map((r) => r.path).join(', ')}`;
  $('applyStatus').textContent = msg;
  renderTree();
  if (state.current && succeeded.includes(state.current)) state.version = 'current';
  render();
}

// ── Agent activity modal ────────────────────────────
function renderActivity() {
  const paths = [...state.logs.keys()];
  if (state.activity.file && !state.logs.has(state.activity.file)) state.activity.file = null;
  if (!state.activity.file && paths.length) state.activity.file = paths[paths.length - 1];
  $('activityFile').innerHTML = paths.length
    ? paths.map((p) => `<option value="${esc(p)}" ${p === state.activity.file ? 'selected' : ''}>${esc(p.split('/').pop())}</option>`).join('')
    : '<option>— no agent runs yet —</option>';
  const body = $('activityBody');
  if (!paths.length) {
    const running = state.progress && state.progress.running;
    body.textContent = running
      ? 'Waiting for the model to start streaming…\n\nThe claude CLI takes a few seconds to spin up before the first token. If nothing appears after that, your validator server may predate this feature — restart it (Ctrl-C, then `npm start`).'
      : 'No agent output yet. Run a fix or a convert that needs the model.\n\nMechanical fixes (version pin, tag rename) are done by the deterministic codemod and produce no reasoning.';
  } else {
    body.textContent = state.logs.get(state.activity.file) || '(waiting for output…)';
    body.scrollTop = body.scrollHeight;
  }
}
function openActivity() { state.activity.open = true; $('activityModal').hidden = false; renderActivity(); }
function closeActivity() { state.activity.open = false; $('activityModal').hidden = true; }

// ── events ──────────────────────────────────────────
$('fileTree').addEventListener('click', (e) => {
  const folder = e.target.closest('.folder-row');
  if (folder) {
    const set = state.view === 'examples' ? state.expanded : state.promptExpanded;
    const p = folder.dataset.folder;
    if (set.has(p)) set.delete(p); else set.add(p);
    renderTree();
    return;
  }
  const row = e.target.closest('.file-row');
  if (!row) return;
  if (state.view === 'examples') {
    const path = row.dataset.path;
    if (e.target.classList.contains('cb')) {
      if (state.selected.has(path)) state.selected.delete(path); else state.selected.add(path);
      return;
    }
    state.current = path; renderTree(); render();
  } else {
    state.currentPrompt = row.dataset.ppath; renderTree(); render();
  }
});
$('filter').addEventListener('input', (e) => { state.filter = e.target.value.trim(); renderTree(); });
$('scanBtn').onclick = scan;
$('selectAllBtn').onclick = () => {
  const vis = visibleFiles();
  const all = vis.length && vis.every((f) => state.selected.has(f.path));
  if (all) vis.forEach((f) => state.selected.delete(f.path)); else vis.forEach((f) => state.selected.add(f.path));
  renderTree();
};
$('fixBtn').onclick = runFix;
$('convertBtn').onclick = runConvert;
$('applyBtn').onclick = () => applyOrDiscard('apply');
$('discardBtn').onclick = () => applyOrDiscard('discard');
$('modeTabs').addEventListener('click', (e) => {
  const b = e.target.closest('.tab'); if (!b) return;
  if (state.view === 'examples') state.mode = b.dataset.mode; else state.promptMode = b.dataset.mode;
  render();
});
$('verTabs').addEventListener('click', (e) => {
  const b = e.target.closest('.tab'); if (!b) return;
  state.version = b.dataset.ver; render();
});
for (const b of document.querySelectorAll('#viewTabs .vt')) b.onclick = () => {
  state.view = b.dataset.view;
  for (const x of document.querySelectorAll('#viewTabs .vt')) x.classList.toggle('active', x === b);
  if (state.view === 'prompts') loadPrompts();
  renderTree();
  render();
};
$('toggleLeft').onclick = () => $('listPane').classList.toggle('collapsed');
$('toggleRight').onclick = () => $('fixPane').classList.toggle('collapsed');
$('activityBtn').onclick = openActivity;
$('activityClose').onclick = closeActivity;
$('activityModal').addEventListener('click', (e) => { if (e.target.id === 'activityModal') closeActivity(); });
$('activityFile').onchange = (e) => { state.activity.file = e.target.value; state.activity.follow = false; renderActivity(); };

loadFiles();
loadOptions();
loadPrompts();
renderTopbar();
