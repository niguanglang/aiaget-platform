import assert from 'node:assert/strict';
import test from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { PluginsService } from './plugins.service';

const currentUser = {
  id: '00000000-0000-0000-0000-000000000001',
  tenantId: '00000000-0000-0000-0000-000000000002',
  email: 'operator@example.com',
  roles: ['tenant_admin'],
  roleIds: [],
  permissions: [],
  departmentId: null,
};

test('install blocks invalid custom manifest before writing plugin records and records failure event', async () => {
  let pluginUpsertCalled = false;
  const recordedEvents: unknown[] = [];
  const service = new PluginsService(
    {
      plugin: {
        upsert: () => {
          pluginUpsertCalled = true;
          throw new Error('plugin upsert should not be called for invalid manifest');
        },
      },
    } as never,
    {} as never,
    {
      recordEvent: (event: unknown) => {
        recordedEvents.push(event);
        return Promise.resolve(event);
      },
    } as never,
  );

  await assert.rejects(
    () => service.install(currentUser, {
      code: 'ticket-suite',
      source_type: 'CUSTOM',
      manifest_json: {
        schema_version: '1.0',
        code: 'ticket-suite',
        version: '1.2.0',
        tools: [
          {
            code: 'create-ticket',
            name: '创建工单',
            method: 'POST',
            url: 'https://plugins.example.com/tools/create-ticket',
          },
        ],
      },
    }),
    BadRequestException,
  );

  assert.equal(pluginUpsertCalled, false);
  assert.equal(recordedEvents.length, 1);
  assert.equal((recordedEvents[0] as { eventType?: string }).eventType, 'plugin.manifest.validation_failed');
  assert.equal((recordedEvents[0] as { status?: string }).status, 'FAILED');
});
