import { IsIn, IsOptional } from 'class-validator';

import {
  SYSTEM_SETTING_CATEGORIES,
  SYSTEM_SETTING_LIST_STATUSES,
} from '../system-settings.constants';

export class ListSystemSettingsDto {
  @IsOptional()
  @IsIn(SYSTEM_SETTING_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsIn(SYSTEM_SETTING_LIST_STATUSES)
  status?: string;
}
