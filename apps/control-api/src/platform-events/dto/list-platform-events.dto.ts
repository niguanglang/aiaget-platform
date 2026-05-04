import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { PLATFORM_EVENT_WINDOWS } from './get-platform-usage-overview.dto';

export const PLATFORM_EVENT_STATUSES = ['SUCCESS', 'FAILED', 'DEGRADED', 'PENDING', 'WAITING_HUMAN', 'APPROVED', 'REJECTED'] as const;
export const PLATFORM_EVENT_SEVERITIES = ['INFO', 'WARN', 'ERROR'] as const;

export class ListPlatformEventsDto {
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
  event_type?: string;

  @IsOptional()
  @IsString()
  resource_type?: string;

  @IsOptional()
  @IsIn(PLATFORM_EVENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(PLATFORM_EVENT_SEVERITIES)
  severity?: string;

  @IsOptional()
  @IsString()
  trace_id?: string;

  @IsOptional()
  @IsString()
  request_id?: string;

  @IsOptional()
  @IsString()
  source_system?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
