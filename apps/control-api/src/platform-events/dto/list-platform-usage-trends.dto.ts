import { IsIn, IsOptional, IsString } from 'class-validator';

import { PLATFORM_EVENT_WINDOWS } from './get-platform-usage-overview.dto';
import { PLATFORM_USAGE_PERIODS } from './list-platform-usage.dto';

export class ListPlatformUsageTrendsDto {
  @IsOptional()
  @IsIn(PLATFORM_EVENT_WINDOWS)
  window?: string;

  @IsOptional()
  @IsIn(PLATFORM_USAGE_PERIODS)
  period?: string;

  @IsOptional()
  @IsString()
  metric_type?: string;

  @IsOptional()
  @IsString()
  resource_type?: string;
}
