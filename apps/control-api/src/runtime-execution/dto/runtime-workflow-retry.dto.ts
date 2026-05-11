import { IsIn, IsString } from 'class-validator';
import type { RuntimeWorkflowTaskType } from '@aiaget/shared-types';

export class RuntimeWorkflowRetryDto {
  @IsIn([
    'knowledge_task',
    'agent_team_run',
    'channel_release_automation',
    'channel_release_self_healing',
    'plugin_rollback',
    'plugin_hook_execution',
  ])
  task_type!: RuntimeWorkflowTaskType;

  @IsString()
  task_id!: string;
}
