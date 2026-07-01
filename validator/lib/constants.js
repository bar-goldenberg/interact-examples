export const LATEST_VERSION = '2.5.1';
// The /web subpath is required — it exports the <interact-element> custom element.
export const INTERACT_CDN = `https://esm.sh/@wix/interact@${LATEST_VERSION}/web`;
export const PRESETS_CDN = 'https://esm.sh/@wix/motion-presets';
export const DRAFTS_DIR = '.drafts';

// Directories never scanned for animation files.
export const IGNORED_DIRS = new Set([
  'node_modules', '.git', '.drafts', '.backups',
  'analysis', 'explorer-screenshots', 'docs', 'validator', '.cursor',
]);

// Files at any level that are not animations.
export const IGNORED_FILES = new Set(['explorer.html']);
