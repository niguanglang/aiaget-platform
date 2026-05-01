import { IsIn, IsOptional } from 'class-validator';

import { SYSTEM_SETTING_MUTATION_STATUSES } from '../system-settings.constants';

export class UpdateSystemSettingDto {
  @IsOptional()
  value?: unknown;

  @IsOptional()
  @IsIn(SYSTEM_SETTING_MUTATION_STATUSES)
  status?: 'ACTIVE' | 'DISABLED';
}
