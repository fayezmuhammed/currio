#!/usr/bin/env node
/**
 * Sanity checks on the built extension: every file the manifest references
 * exists, and the content script is a classic script with no module syntax.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const dist = resolve(import.meta.dirname, '../dist');
const manifest = JSON.parse(readFileSync(resolve(dist, 'manifest.json'), 'utf8'));
const errors = [];

const referenced = [
  manifest.background.service_worker,
  manifest.action.default_popup,
  'onboarding/index.html',
  ...manifest.content_scripts.flatMap((cs) => cs.js),
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
];
for (const file of referenced) {
  if (!existsSync(resolve(dist, file))) errors.push(`Missing ${file}`);
}

const contentPath = resolve(dist, 'content.js');
if (existsSync(contentPath)) {
  const content = readFileSync(contentPath, 'utf8');
  if (/^\s*(import|export)\s/m.test(content)) errors.push('content.js contains ES module syntax');
  if (/\beval\s*\(|new Function\s*\(/.test(content)) errors.push('content.js uses eval/new Function');
  console.log(`content.js     ${(statSync(contentPath).size / 1024).toFixed(1)} kB`);
}
const bgPath = resolve(dist, 'background.js');
if (existsSync(bgPath)) console.log(`background.js  ${(statSync(bgPath).size / 1024).toFixed(1)} kB`);

for (const page of ['popup/index.html', 'onboarding/index.html']) {
  const path = resolve(dist, page);
  if (existsSync(path) && /<script(?![^>]*\bsrc=)[^>]*>/i.test(readFileSync(path, 'utf8'))) {
    errors.push(`${page} contains an inline script`);
  }
}

if (errors.length) {
  console.error(`\n✗ dist/ verification failed:\n  ${errors.join('\n  ')}`);
  process.exit(1);
}
console.log('✓ dist/ verified');
