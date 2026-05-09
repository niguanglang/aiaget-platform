import assert from 'node:assert/strict';
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
