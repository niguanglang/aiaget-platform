import assert from 'node:assert/strict';
import test from 'node:test';

import { validateSync } from 'class-validator';

import { RuntimeWorkflowRetryDto } from './dto/runtime-workflow-retry.dto';

test('RuntimeWorkflowRetryDto accepts plugin hook execution recovery task type', () => {
  const dto = new RuntimeWorkflowRetryDto();
  dto.task_type = 'plugin_hook_execution';
  dto.task_id = 'plugin-hook-execution-1';

  const errors = validateSync(dto);

  assert.equal(errors.length, 0);
});
