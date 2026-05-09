import { IsString } from 'class-validator';

export class RuntimePluginHookExecutionDto {
  @IsString()
  event_id!: string;

  @IsString()
  plugin_id!: string;

  @IsString()
  hook_id!: string;

  @IsString()
  workflow_id?: string | null;

  @IsString()
  run_id?: string | null;
}
