import assert from 'node:assert/strict';
import test from 'node:test';

import { PlatformEventsService } from './platform-events.service';

test('recordEvent reuses an existing tenant event when dedupeKey matches', async () => {
  const createdEvents: Array<Record<string, unknown>> = [];
  const storedEvents = new Map<string, Record<string, unknown>>();
  const prisma = {
    platformEvent: {
      findFirst: async (args: { where: { tenantId: string; dedupeKey?: string | null } }) => {
        const key = `${args.where.tenantId}:${args.where.dedupeKey ?? ''}`;
        return storedEvents.get(key) ?? null;
      },
      create: async (args: { data: Record<string, unknown> }) => {
        const event: Record<string, unknown> = {
          id: `event-${createdEvents.length + 1}`,
          ...args.data,
          occurredAt: args.data.occurredAt instanceof Date ? args.data.occurredAt : new Date('2026-05-07T01:00:00.000Z'),
        };
        createdEvents.push(event);
        storedEvents.set(`${event.tenantId}:${event.dedupeKey}`, event);
        return event;
      },
      findMany: async () => [],
    },
    platformEventRelation: {
      findFirst: async () => null,
      create: async () => ({ id: 'relation-1' }),
    },
  };
  const service = new PlatformEventsService(prisma as never);
  const input = {
    tenantId: 'tenant-1',
    resourceType: 'AGENT_TEAM',
    resourceId: 'team-1',
    eventSource: 'AGENT_TEAM',
    eventType: 'agent.team.run.finished',
    status: 'SUCCESS',
    sourceSystem: 'agent_team_run',
    sourceId: 'run-1',
    dedupeKey: 'agent_team_run:run-1:agent.team.run.finished',
  };

  const first = await service.recordEvent(input);
  const second = await service.recordEvent(input);

  assert.equal(createdEvents.length, 1);
  assert.equal(first.id, 'event-1');
  assert.equal(second.id, 'event-1');
});
