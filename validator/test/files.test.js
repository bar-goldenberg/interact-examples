// validator/test/files.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listAnimationFiles } from '../lib/files.js';

async function makeRepo() {
  const root = await mkdtemp(join(tmpdir(), 'iv-files-'));
  await mkdir(join(root, 'Gallery-and-Carousel'), { recursive: true });
  await mkdir(join(root, 'analysis'), { recursive: true });
  await mkdir(join(root, 'node_modules', 'x'), { recursive: true });
  await mkdir(join(root, 'interactor-examples', 'gallery'), { recursive: true });
  await writeFile(join(root, 'explorer.html'), '<html></html>');
  await writeFile(join(root, 'Gallery-and-Carousel', 'A.html'), '<html></html>');
  await writeFile(join(root, 'Gallery-and-Carousel', 'notes.txt'), 'x');
  await writeFile(join(root, 'Gallery-and-Carousel', 'skip.md'), '# not an example dir');
  await writeFile(join(root, 'README.md'), '# repo doc, not an example');
  await writeFile(join(root, 'interactor-examples', 'gallery', 'CardSpread.md'), '# example');
  await writeFile(join(root, 'analysis', 'B.html'), '<html></html>');
  await writeFile(join(root, 'node_modules', 'x', 'C.html'), '<html></html>');
  return root;
}

test('lists html animations and ignores excluded dirs/files', async () => {
  const root = await makeRepo();
  const files = await listAnimationFiles(root);
  const paths = files.map((f) => f.path).sort();
  // .html everywhere (minus ignored dirs); .md only under an allowlisted dir.
  assert.deepEqual(paths, ['Gallery-and-Carousel/A.html', 'interactor-examples/gallery/CardSpread.md']);
});

test('.md is listed only under an EXAMPLE_MD_DIRS folder, never repo docs', async () => {
  const root = await makeRepo();
  const paths = (await listAnimationFiles(root)).map((f) => f.path);
  assert.ok(paths.includes('interactor-examples/gallery/CardSpread.md'), 'allowlisted .md shown');
  assert.ok(!paths.includes('README.md'), 'root doc excluded');
  assert.ok(!paths.includes('Gallery-and-Carousel/skip.md'), '.md outside allowlist excluded');
});
