import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  collectExternalSdkPackageIssues,
  collectExternalSdkPublishDocIssues,
} from '../validate-external-sdk-package.mjs';

test('external API SDK package is ready for npm packaging', async () => {
  assert.deepEqual(await collectExternalSdkPackageIssues(), []);
});

test('external API SDK docs include publish readiness commands and current status', async () => {
  assert.deepEqual(await collectExternalSdkPublishDocIssues(), []);
});

test('external API SDK release gate reports missing behavior tests, example typecheck, and release examples', async () => {
  const workspace = await testWorkspace();
  const packageDir = path.join(workspace, 'packages/external-api-sdk');
  await mkdir(packageDir, { recursive: true });
  await writeFile(
    path.join(packageDir, 'package.json'),
    JSON.stringify(
      {
        name: '@aiaget/external-api-sdk',
        version: '0.1.0',
        description: 'TypeScript SDK for AIAGET Enterprise Agent Platform external APIs.',
        license: 'MIT',
        type: 'module',
        types: './dist/index.d.ts',
        files: ['dist', 'README.md', 'package.json'],
        exports: {
          '.': {
            types: './dist/index.d.ts',
            default: './dist/index.js',
          },
        },
        publishConfig: {
          access: 'public',
        },
        scripts: {
          build: 'tsc -p tsconfig.json',
          typecheck: 'tsc -p tsconfig.json --noEmit',
          prepack: 'pnpm build',
          'pack:check': 'pnpm typecheck && pnpm build && npm pack --dry-run',
        },
      },
      null,
      2,
    ),
  );

  assert.deepEqual(await collectExternalSdkPackageIssues(path.join(packageDir, 'package.json')), [
    'package.json scripts must include test',
    'package.json scripts must include typecheck:examples',
    'SDK example is missing: examples/idempotency-chat.ts',
    'SDK example is missing: examples/webhook-verify.ts',
  ]);
});

async function testWorkspace() {
  return await mkdir(path.join(tmpdir(), `aiaget-sdk-package-test-${process.pid}-${Date.now()}`), {
    recursive: true,
  });
}
