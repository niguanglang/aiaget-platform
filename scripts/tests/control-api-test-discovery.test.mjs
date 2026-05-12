import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';
import test from 'node:test';

const workspaceRoot = new URL('../..', import.meta.url);

test('root test command runs every Control API test file through the package test script', () => {
  const rootPackageJson = JSON.parse(readFileSync(new URL('package.json', workspaceRoot), 'utf8'));
  const controlApiPackageJson = JSON.parse(readFileSync(new URL('apps/control-api/package.json', workspaceRoot), 'utf8'));
  const testRunnerSource = readFileSync(new URL('scripts/run-control-api-tests.mjs', workspaceRoot), 'utf8');
  const rootTestScript = rootPackageJson.scripts?.test ?? '';
  const controlApiTestScript = controlApiPackageJson.scripts?.test ?? '';

  assert.match(rootTestScript, /--filter @aiaget\/control-api test/);
  assert.match(controlApiTestScript, /run-control-api-tests\.mjs/);
  assert.match(testRunnerSource, /\.test\.ts/);
  assert.match(testRunnerSource, /tsx.+--test/s);

  const discoveredTests = listTestFiles(new URL('apps/control-api/src/', workspaceRoot))
    .map((file) => relative(new URL('apps/control-api/', workspaceRoot).pathname, file).replaceAll('\\', '/'));

  assert.equal(discoveredTests.length > 40, true, 'expected broad Control API test discovery');
  for (const testFile of discoveredTests) {
    assert.equal(
      controlApiTestScript.includes(testFile),
      false,
      `Control API test script should discover ${testFile} instead of hard-coding it`,
    );
  }
});

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
