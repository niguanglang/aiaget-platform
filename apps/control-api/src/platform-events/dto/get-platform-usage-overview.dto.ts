import { IsIn, IsOptional } from 'class-validator';

export const PLATFORM_EVENT_WINDOWS = ['24h', '7d', '30d'] as const;

export class GetPlatformUsageOverviewDto {
  @IsOptional()
  @IsIn(PLATFORM_EVENT_WINDOWS)
  window?: string;
}
