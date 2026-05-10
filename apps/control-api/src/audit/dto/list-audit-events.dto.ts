import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { AUDIT_WINDOWS } from './get-audit-overview.dto';

export const AUDIT_EVENT_SOURCE_TYPES = ['login', 'operation', 'approval_audit', 'billing'] as const;
export const AUDIT_EVENT_STATUSES = ['SUCCESS', 'FAILED', 'DEGRADED'] as const;

export class ListAuditEventsDto {
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
  @IsIn(AUDIT_WINDOWS)
  window?: string;

  @IsOptional()
  @IsIn(AUDIT_EVENT_SOURCE_TYPES)
  source_type?: string;

  @IsOptional()
  @IsIn(AUDIT_EVENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
