import { IsIn, IsObject, IsOptional } from 'class-validator';
import type { PluginHookStatus } from '@aiaget/shared-types';

export class UpdatePluginHookDto {
  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'DELETED'] satisfies PluginHookStatus[])
  status?: PluginHookStatus;

  @IsOptional()
  @IsObject()
  config_json?: Record<string, unknown> | null;
}
