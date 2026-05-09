import { IsString } from 'class-validator';

export class RuntimePluginRollbackDto {
  @IsString()
  plugin_id!: string;

  @IsString()
  version_id!: string;

  @IsString()
  version!: string;

  @IsString()
  workflow_id?: string | null;

  @IsString()
  run_id?: string | null;
}
