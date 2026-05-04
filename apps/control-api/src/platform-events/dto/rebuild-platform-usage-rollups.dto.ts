import { IsIn, IsOptional } from 'class-validator';

import { PLATFORM_EVENT_WINDOWS } from './get-platform-usage-overview.dto';

export class RebuildPlatformUsageRollupsDto {
  @IsOptional()
  @IsIn(PLATFORM_EVENT_WINDOWS)
  window?: string;
}
