export const LATEST_VERSION = '2.4.0';
export const INTERACT_CDN = `https://esm.sh/@wix/interact@${LATEST_VERSION}`;
export const PRESETS_CDN = 'https://esm.sh/@wix/motion-presets';
export const DRAFTS_DIR = '.drafts';

// Directories never scanned for animation files.
export const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.drafts', '.backups',
  'analysis', 'explorer-screenshots', 'docs', 'validator', '.cursor',
]);

// Files at any level that are not animations.
export const IGNORED_FILES = new Set(['explorer.html']);
