#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const testFiles = listTestFiles(new URL('../apps/control-api/src/', import.meta.url))
  .map((file) => file.replace(new URL('../apps/control-api/', import.meta.url).pathname, ''));

if (testFiles.length === 0) {
  console.error('No Control API test files were discovered.');
  process.exitCode = 1;
} else {
  const result = spawnSync('tsx', ['--test', ...testFiles], {
    cwd: new URL('../apps/control-api/', import.meta.url),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  process.exitCode = typeof result.status === 'number' ? result.status : 1;
}

function listTestFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory)) {
    const path = new URL(entry, directory);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...listTestFiles(new URL(`${entry}/`, directory)));
    } else if (entry.endsWith('.test.ts')) {
      files.push(path.pathname);
    }
  }
  return files.sort();
}
