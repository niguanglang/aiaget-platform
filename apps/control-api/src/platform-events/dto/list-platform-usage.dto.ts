import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { PLATFORM_EVENT_WINDOWS } from './get-platform-usage-overview.dto';

export const PLATFORM_USAGE_PERIODS = ['hour', 'day'] as const;

export class ListPlatformUsageDto {
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
  @IsIn(PLATFORM_EVENT_WINDOWS)
  window?: string;

  @IsOptional()
  @IsString()
  subject_type?: string;

  @IsOptional()
  @IsString()
  resource_type?: string;

  @IsOptional()
  @IsString()
  metric_type?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  billable?: boolean;

  @IsOptional()
  @IsString()
  trace_id?: string;

  @IsOptional()
  @IsString()
  request_id?: string;

  @IsOptional()
  @IsString()
  event_id?: string;

  @IsOptional()
  @IsString()
  source_system?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
