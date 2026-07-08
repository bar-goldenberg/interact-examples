// Build a self-contained HTML document that renders a section with a generated
// @wix/interact-experience config, using the vendored renderer. The config is
// embedded as a JSON string in a data attribute (script-tag-safe).
export function buildRenderDoc({ html, css, config }) {
  const safeConfig = String(config).replace(/<\/script>/gi, '<\\/script>');
  return `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0}${css || ''}</style></head>
<body>
<div id="__root">${html || ''}</div>
<script type="application/json" id="__config">${safeConfig}</script>
<script type="module">
  import { createExperience } from '/vendor/render-runtime.js';
  try {
    const config = JSON.parse(document.getElementById('__config').textContent);
    createExperience(config, { root: document.getElementById('__root') });
  } catch (e) {
    document.body.insertAdjacentHTML('afterbegin',
      '<pre style="color:#b00;font:12px monospace;padding:8px;white-space:pre-wrap">render error: ' + (e && e.message || e) + '</pre>');
  }
</script>
</body></html>`;
}
