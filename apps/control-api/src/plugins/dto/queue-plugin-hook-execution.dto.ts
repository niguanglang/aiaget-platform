import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import type { QueuePluginHookExecutionInput } from '@aiaget/shared-types';

export class QueuePluginHookExecutionDto implements QueuePluginHookExecutionInput {
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  source_event_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trace_id?: string | null;
}
