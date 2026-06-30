import { injectBase } from './preview.js';

// category → status-dot modifier class
const SDOT = {
  'Outdated version': 's-outdated', 'Not using interact': 's-nointeract',
  'Uses extra JS': 's-extrajs', 'Uses customEffect': 's-custom', 'Clean & current': 's-clean',
};
// stable order for the summary chips
const CAT_ORDER = ['Outdated version', 'Uses extra JS', 'Uses customEffect', 'Not using interact', 'Clean & current'];

const state = { files: [], diag: {}, drafts: new Set(), selected: new Set(), current: null, filter: '' };
const $ = (id) => document.getElementById(id);
const api = (path, opts) => fetch(path, opts).then((r) => r.json());
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

async function loadFiles() {
  const { files } = await api('/api/files');
  state.files = files;
  renderList();
}

async function loadOptions() {
  const { options } = await api('/api/options');
  $('fixOptions').innerHTML = options.map((o) =>
    `<label class="opt"><input type="checkbox" class="sel" name="opt" value="${esc(o.id)}" ${o.default ? 'checked' : ''}/>
      <span>${esc(o.label)}</span></label>`
  ).join('');
}

function visibleFiles() {
  if (!state.filter) return state.files;
  const q = state.filter.toLowerCase();
  return state.files.filter((f) => f.path.toLowerCase().includes(q));
}

function renderList() {
  const rows = visibleFiles().map((f) => {
    const d = state.diag[f.path];
    const dotClass = d ? (SDOT[d.category] || '') : '';
    const draft = state.drafts.has(f.path) ? '<span class="draft-tag">draft</span>' : '';
    const checked = state.selected.has(f.path) ? 'checked' : '';
    const active = state.current === f.path ? ' active' : '';
    const title = d ? `${f.path} — ${d.category}` : f.path;
    return `<li data-path="${esc(f.path)}" class="${active.trim()}" title="${esc(title)}">
      <input type="checkbox" class="sel" ${checked}/>
      <span class="status-dot ${dotClass}"></span>
      <span class="name">${esc(f.path)}</span>${draft}</li>`;
  }).join('');
  $('fileList').innerHTML = rows;
}

function renderSummary(summary, total) {
  const chips = CAT_ORDER.filter((c) => summary[c]).map((c) =>
    `<span class="stat"><span class="dot ${SDOT[c]}"></span><b>${summary[c]}</b></span>`
  ).join('');
  $('summary').innerHTML = `<span class="stat"><b>${total}</b> files</span>${chips}`;
}

async function scan() {
  $('scanBtn').disabled = true; $('scanBtn').textContent = 'Scanning…';
  try {
    const { results, summary, total } = await api('/api/scan', {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
    state.diag = {};
    for (const r of results) state.diag[r.path] = r;
    renderSummary(summary, total);
    renderList();
  } finally {
    $('scanBtn').disabled = false; $('scanBtn').textContent = 'Scan';
  }
}

function baseHrefFor(path) {
  const slash = path.lastIndexOf('/');
  return slash === -1 ? '/' : '/' + path.slice(0, slash + 1);
}

async function showPreview(path, { draft = false } = {}) {
  const url = draft ? `/api/draft?path=${encodeURIComponent(path)}`
                    : `/api/file?path=${encodeURIComponent(path)}`;
  const { source } = await api(url);
  $('preview').srcdoc = injectBase(source, baseHrefFor(path));
  $('code').textContent = source;
}

async function showDiff(path) {
  const res = await fetch(`/api/diff?path=${encodeURIComponent(path)}`);
  if (!res.ok) { $('diff').innerHTML = '<div class="empty">No draft for this file yet.</div>'; return; }
  const { parts } = await res.json();
  $('diff').innerHTML = parts.map((p) => {
    const safe = esc(p.value);
    if (p.added) return `<ins>${safe}</ins>`;
    if (p.removed) return `<del>${safe}</del>`;
    return `<span>${safe}</span>`;
  }).join('');
}

function selectTab(tab) {
  for (const b of document.querySelectorAll('.tab')) b.classList.toggle('active', b.dataset.tab === tab);
  $('preview').hidden = tab !== 'preview';
  $('code').hidden = tab !== 'code';
  $('diff').hidden = tab !== 'diff';
  if (!state.current) return;
  if (tab === 'diff') showDiff(state.current);
  if (tab === 'preview') showPreview(state.current, { draft: state.drafts.has(state.current) });
}

async function runFix() {
  const paths = [...state.selected];
  if (!paths.length) { $('fixStatus').textContent = 'Select files first.'; return; }
  const optionIds = [...document.querySelectorAll('input[name=opt]:checked')].map((c) => c.value);
  const customPrompt = $('customPrompt').value;
  $('fixBtn').disabled = true;
  $('fixStatus').textContent = `Fixing ${paths.length} file(s)…`;
  try {
    const { results, error } = await api('/api/fix', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ paths, optionIds, customPrompt }) });
    if (error) { $('fixStatus').textContent = `Error: ${error}`; return; }
    for (const r of results) if (r.status !== 'fixFailed') state.drafts.add(r.path);
    $('fixStatus').innerHTML = results.map((r) => {
      const mark = r.status === 'fixed' ? '<span class="res-ok">✓</span>'
        : r.status === 'needsReview' ? '<span class="res-warn">⚠</span>'
        : '<span class="res-fail">✗</span>';
      return `${mark} ${esc(r.path)}${r.error ? ` — ${esc(r.error)}` : ''}`;
    }).join('\n');
    renderList();
    if (state.current && state.drafts.has(state.current)) selectTab('diff');
  } finally {
    $('fixBtn').disabled = false;
  }
}

async function applyOrDiscard(endpoint) {
  const paths = [...state.selected].filter((p) => state.drafts.has(p));
  if (!paths.length) { $('fixStatus').textContent = 'No drafts in selection.'; return; }
  const data = await api(`/api/${endpoint}`, { method: 'POST',
    headers: { 'content-type': 'application/json' }, body: JSON.stringify({ paths }) });
  const results = data.results || [];
  const succeeded = results.filter((r) => r.ok).map((r) => r.path);
  const failed = results.filter((r) => !r.ok);
  for (const p of succeeded) state.drafts.delete(p);
  const verb = endpoint === 'apply' ? 'Applied' : 'Discarded';
  let msg = `${verb} ${succeeded.length} draft(s).`;
  if (failed.length) msg += ` Failed ${failed.length}: ${failed.map((r) => r.path).join(', ')}`;
  $('fixStatus').textContent = msg;
  renderList();
  if (state.current && succeeded.includes(state.current)) showPreview(state.current);
}

// ── events ──────────────────────────────────────────
$('fileList').addEventListener('click', (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const path = li.dataset.path;
  if (e.target.classList.contains('sel')) {
    if (state.selected.has(path)) state.selected.delete(path); else state.selected.add(path);
    return;
  }
  state.current = path;
  renderList();
  selectTab(document.querySelector('.tab.active')?.dataset.tab || 'preview');
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
for (const b of document.querySelectorAll('.tab')) b.onclick = () => selectTab(b.dataset.tab);

loadFiles();
loadOptions();
