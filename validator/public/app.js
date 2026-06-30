import { injectBase } from './preview.js';

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
// Per-file indicators: version dot + additive flags (purple customEffect, blue JS).
function indicatorsHTML(d) {
  if (!d) return '';
  const v = VER[versionState(d)];
  let h = `<span class="ind ${v.cls}" title="${esc(v.label)}"></span>`;
  if (d.usesCustomEffect) h += `<span class="ind purple" title="Uses customEffect"></span>`;
  if (d.usesExtraJs) h += `<span class="js-badge" title="JavaScript animation not tied to a customEffect">JS</span>`;
  return h;
}

const state = { files: [], diag: {}, drafts: new Set(), selected: new Set(), current: null, filter: '', mode: 'preview', version: 'current', progress: null };
const $ = (id) => document.getElementById(id);
const api = (path, opts) => fetch(path, opts).then((r) => r.json());
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function loadFiles() {
  const { files } = await api('/api/files');
  state.files = files;
  renderList();
}

async function loadOptions() {
  const { options } = await api('/api/options');
  $('fixOptions').innerHTML = options.map((o) =>
    `<label class="opt"><input type="checkbox" class="cb" name="opt" value="${esc(o.id)}" ${o.default ? 'checked' : ''}/>
      <span>${esc(o.label)}</span></label>`).join('');
}

function visibleFiles() {
  if (!state.filter) return state.files;
  const q = state.filter.toLowerCase();
  return state.files.filter((f) => f.path.toLowerCase().includes(q));
}

function renderList() {
  $('fileList').innerHTML = visibleFiles().map((f) => {
    const d = state.diag[f.path];
    const draft = state.drafts.has(f.path) ? '<span class="draft-tag">draft</span>' : '';
    const checked = state.selected.has(f.path) ? 'checked' : '';
    const active = state.current === f.path ? ' active' : '';
    const title = d ? `${f.path} — ${VER[versionState(d)].label}` : f.path;
    return `<li data-path="${esc(f.path)}" class="${active.trim()}" title="${esc(title)}">
      <input type="checkbox" class="cb" ${checked}/>
      <span class="name">${esc(f.path)}</span>
      <span class="inds">${indicatorsHTML(d)}</span>${draft}</li>`;
  }).join('');
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
    const { results } = await api('/api/scan', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    state.diag = {};
    for (const r of results) state.diag[r.path] = r;
    renderSummary();
    renderList();
  } finally {
    $('scanBtn').disabled = false; $('scanBtn').textContent = 'Scan';
  }
}

function baseHrefFor(path) {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? '/' : '/' + path.slice(0, slash + 1);
}
const fetchSource = (kind, path) => api(`/api/${kind}?path=${encodeURIComponent(path)}`).then((r) => r.source);
const blankDoc = (label) => `<!doctype html><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:Inter,system-ui,sans-serif;color:#b0b0b5;background:#fff;font-size:14px">${label}</body>`;

// Resolve which file source to show for the chosen version. 'draft' with no
// draft on disk yields null (callers render a placeholder).
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

// Reflect state.mode + state.version into the viewport.
async function render() {
  const { mode, version, current } = state;
  for (const b of document.querySelectorAll('#modeTabs .tab')) b.classList.toggle('active', b.dataset.mode === mode);
  for (const b of document.querySelectorAll('#verTabs .tab')) b.classList.toggle('active', b.dataset.ver === version);
  $('topbar').classList.toggle('diff', mode === 'diff'); // hides version group for Diff

  const has = !!current;
  $('placeholder').hidden = has;
  $('preview').hidden = !(has && mode === 'preview');
  $('code').hidden = !(has && mode === 'code');
  $('diff').hidden = !(has && mode === 'diff');
  if (!has) return;

  if (mode === 'diff') { renderDiff(current); return; }

  const src = await sourceFor(current, version);
  if (mode === 'preview') {
    $('preview').srcdoc = src === null ? blankDoc('No draft yet — fix this file first')
      : injectBase(src, baseHrefFor(current));
  } else { // code
    $('code').textContent = src === null ? 'No draft yet — fix this file first.' : src;
  }
}

// ── Live fix progress (SSE) ─────────────────────────
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
    return `<div class="prog-item">${mk}<span class="nm" title="${esc(t)}">${esc(path)}</span></div>`;
  }).join('');
  $('fixProgress').innerHTML = `<div class="prog-head">${head}</div><div class="prog-list">${items}</div>`;
}

function applyResult(r) {
  if (!state.progress) return;
  state.progress.items.set(r.path, { status: r.status, error: r.error });
  state.progress.done++;
  if (r.status !== 'fixFailed') state.drafts.add(r.path);
  renderProgress();
  renderList();
}

function handleFrame(frame) {
  const ev = /event:\s*(.+)/.exec(frame);
  const dt = /data:\s*([\s\S]+)/.exec(frame);
  if (!ev || !dt) return;
  if (ev[1].trim() !== 'result') return;
  try { applyResult(JSON.parse(dt[1])); } catch { /* ignore malformed frame */ }
}

async function runFix() {
  const paths = [...state.selected];
  if (!paths.length) { $('applyStatus').textContent = 'Select files first.'; return; }
  const optionIds = [...document.querySelectorAll('input[name=opt]:checked')].map((c) => c.value);
  const customPrompt = $('customPrompt').value;
  state.progress = { running: true, total: paths.length, done: 0, startedAt: Date.now(), endedAt: null,
    items: new Map(paths.map((p) => [p, { status: 'pending' }])) };
  $('fixBtn').disabled = true; $('applyStatus').textContent = '';
  renderProgress();
  progTimer = setInterval(renderProgress, 500);
  try {
    const res = await fetch('/api/fix', {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ paths, optionIds, customPrompt }) });
    if (res.body && res.headers.get('content-type')?.includes('text/event-stream')) {
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) { handleFrame(buf.slice(0, i)); buf = buf.slice(i + 2); }
      }
    } else {
      const data = await res.json();
      (data.results || []).forEach(applyResult);
    }
  } finally {
    state.progress.running = false;
    state.progress.endedAt = Date.now();
    clearInterval(progTimer);
    renderProgress();
    $('fixBtn').disabled = false;
    renderList();
    // surface the freshly-written draft for the open file
    if (state.current && state.drafts.has(state.current)) state.version = 'draft';
    render();
  }
}

async function applyOrDiscard(endpoint) {
  const paths = [...state.selected].filter((p) => state.drafts.has(p));
  if (!paths.length) { $('applyStatus').textContent = 'No drafts in selection.'; return; }
  const data = await api(`/api/${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paths }) });
  const results = data.results || [];
  const succeeded = results.filter((r) => r.ok).map((r) => r.path);
  const failed = results.filter((r) => !r.ok);
  for (const p of succeeded) state.drafts.delete(p);
  const verb = endpoint === 'apply' ? 'Applied' : 'Discarded';
  let msg = `${verb} ${succeeded.length} draft(s).`;
  if (failed.length) msg += ` Failed ${failed.length}: ${failed.map((r) => r.path).join(', ')}`;
  $('applyStatus').textContent = msg;
  renderList();
  // the draft is gone for applied/discarded files — fall back to Current
  if (state.current && succeeded.includes(state.current)) state.version = 'current';
  render();
}

// ── events ──────────────────────────────────────────
$('fileList').addEventListener('click', (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const path = li.dataset.path;
  if (e.target.classList.contains('cb')) {
    if (state.selected.has(path)) state.selected.delete(path); else state.selected.add(path);
    return;
  }
  state.current = path;
  renderList();
  render();
});
$('filter').addEventListener('input', (e) => { state.filter = e.target.value.trim(); renderList(); });
$('scanBtn').onclick = scan;
$('selectAllBtn').onclick = () => {
  const vis = visibleFiles();
  const allSelected = vis.length && vis.every((f) => state.selected.has(f.path));
  if (allSelected) vis.forEach((f) => state.selected.delete(f.path));
  else vis.forEach((f) => state.selected.add(f.path));
  renderList();
};
$('fixBtn').onclick = runFix;
$('applyBtn').onclick = () => applyOrDiscard('apply');
$('discardBtn').onclick = () => applyOrDiscard('discard');
for (const b of document.querySelectorAll('#modeTabs .tab')) b.onclick = () => { state.mode = b.dataset.mode; render(); };
for (const b of document.querySelectorAll('#verTabs .tab')) b.onclick = () => { state.version = b.dataset.ver; render(); };

loadFiles();
loadOptions();
