import { injectBase } from './preview.js';

const BADGE = {
  'Outdated version': 'outdated', 'Not using interact': 'nointeract',
  'Uses extra JS': 'extrajs', 'Uses customEffect': 'custom', 'Clean & current': 'clean',
};

const state = { files: [], diag: {}, drafts: new Set(), selected: new Set(), current: null };
const $ = (id) => document.getElementById(id);
const api = (path, opts) => fetch(path, opts).then((r) => r.json());

async function loadFiles() {
  const { files } = await api('/api/files');
  state.files = files;
  renderList();
}

async function loadOptions() {
  const { options } = await api('/api/options');
  $('fixOptions').innerHTML = options.map((o) =>
    `<label><input type="checkbox" name="opt" value="${o.id}" ${o.default ? 'checked' : ''}/> ${o.label}</label>`
  ).join('<br/>');
}

function renderList() {
  $('fileList').innerHTML = state.files.map((f) => {
    const d = state.diag[f.path];
    const cat = d ? d.category : '';
    const badge = cat ? `<span class="badge ${BADGE[cat]}">${cat}</span>` : '';
    const draft = state.drafts.has(f.path) ? '<span class="badge draft">draft</span>' : '';
    const checked = state.selected.has(f.path) ? 'checked' : '';
    return `<li data-path="${f.path}" class="${state.current === f.path ? 'active' : ''}">
      <input type="checkbox" class="sel" ${checked}/>
      <span class="name">${f.path}</span>${badge}${draft}</li>`;
  }).join('');
}

async function scan() {
  const { results, summary, total } = await api('/api/scan', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' });
  state.diag = {};
  for (const r of results) state.diag[r.path] = r;
  $('summary').textContent = `${total} files · ` +
    Object.entries(summary).map(([k, v]) => `${k}: ${v}`).join('  ·  ');
  renderList();
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
  if (!res.ok) { $('diff').textContent = 'No draft for this file.'; return; }
  const { parts } = await res.json();
  $('diff').innerHTML = parts.map((p) => {
    const safe = p.value.replace(/</g, '&lt;');
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
  if (state.current && tab === 'diff') showDiff(state.current);
  if (state.current && tab === 'preview') {
    showPreview(state.current, { draft: state.drafts.has(state.current) });
  }
}

async function runFix() {
  const paths = [...state.selected];
  if (!paths.length) { $('fixStatus').textContent = 'Select files first.'; return; }
  const optionIds = [...document.querySelectorAll('input[name=opt]:checked')].map((c) => c.value);
  const customPrompt = $('customPrompt').value;
  $('fixStatus').textContent = `Fixing ${paths.length} file(s)…`;
  const { results, error } = await api('/api/fix', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ paths, optionIds, customPrompt }) });
  if (error) { $('fixStatus').textContent = `Error: ${error}`; return; }
  for (const r of results) if (r.status !== 'fixFailed') state.drafts.add(r.path);
  $('fixStatus').textContent = results.map((r) =>
    `${r.status === 'fixed' ? '✓' : r.status === 'needsReview' ? '⚠' : '✗'} ${r.path}` +
    (r.error ? ` — ${r.error}` : '')).join('\n');
  renderList();
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
  if (failed.length) {
    msg += ` Failed ${failed.length}: ${failed.map((r) => r.path).join(', ')}`;
  }
  $('fixStatus').textContent = msg;
  renderList();
  if (state.current && succeeded.includes(state.current)) showPreview(state.current);
}

$('fileList').addEventListener('click', (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const path = li.dataset.path;
  if (e.target.classList.contains('sel')) {
    if (state.selected.has(path)) state.selected.delete(path); else state.selected.add(path);
    return;
  }
  state.current = path;
  renderList();
  selectTab('preview');
});
$('scanBtn').onclick = scan;
$('selectAllBtn').onclick = () => {
  if (state.selected.size === state.files.length) state.selected.clear();
  else state.files.forEach((f) => state.selected.add(f.path));
  renderList();
};
$('fixBtn').onclick = runFix;
$('applyBtn').onclick = () => applyOrDiscard('apply');
$('discardBtn').onclick = () => applyOrDiscard('discard');
for (const b of document.querySelectorAll('.tab')) b.onclick = () => selectTab(b.dataset.tab);

loadFiles();
loadOptions();
