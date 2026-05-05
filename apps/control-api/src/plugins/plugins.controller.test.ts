import assert from 'node:assert/strict';
import test from 'node:test';

import { PluginsController } from './plugins.controller';

test('controller exposes manifest validation contract before installation writes', () => {
  const controller = new PluginsController({} as never);

  assert.equal(typeof (controller as unknown as { validateManifest?: unknown }).validateManifest, 'function');
});
