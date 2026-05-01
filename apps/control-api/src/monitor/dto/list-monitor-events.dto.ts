import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const MONITOR_WINDOWS = ['24h', '7d'] as const;
export const MONITOR_MODULES = [
  'agent',
  'prompt',
  'model',
  'knowledge',
  'tool',
  'conversation',
  'user',
  'tenant',
  'auth',
  'system',
] as const;
export const MONITOR_EVENT_STATUSES = ['SUCCESS', 'FAILED', 'DEGRADED'] as const;
export const MONITOR_EVENT_SOURCE_TYPES = [
  'operation',
  'model_call',
  'tool_call',
  'knowledge_recall',
  'conversation_run',
  'conversation_step',
] as const;
export const MONITOR_RUN_STEP_TYPES = ['prompt', 'tool', 'knowledge', 'model', 'response'] as const;

export class ListMonitorEventsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size = 20;

  @IsOptional()
  @IsIn(MONITOR_WINDOWS)
  window?: string;

  @IsOptional()
  @IsIn(MONITOR_MODULES)
  module?: string;

  @IsOptional()
  @IsIn(MONITOR_EVENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(MONITOR_EVENT_SOURCE_TYPES)
  source_type?: string;

  @IsOptional()
  @IsIn(MONITOR_RUN_STEP_TYPES)
  step_type?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
