#!/usr/bin/env node
/**
 * Watch mode: rebuilds extension pages + service worker and the content
 * script into dist/ on every change. Reload the extension at
 * chrome://extensions after a rebuild (content scripts need a page reload).
 */
import { spawn } from 'node:child_process';

const env = { ...process.env, NODE_ENV: 'development' };
const run = (args) =>
  spawn('npx', ['vite', 'build', '--watch', '--mode', 'development', ...args], { stdio: 'inherit', env, shell: process.platform === 'win32' });

const pages = run([]);
// Give the first build a head start: it empties dist/ before writing.
setTimeout(() => {
  const content = run(['--config', 'vite.content.config.ts']);
  const stop = () => {
    pages.kill();
    content.kill();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}, 2500);
