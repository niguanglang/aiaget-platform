import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const APPROVAL_AUDIT_WINDOWS = ['24h', '7d', '30d'] as const;
const APPROVAL_AUDIT_SOURCE_TYPES = ['TOOL_APPROVAL', 'NOTIFICATION_POLICY', 'APPROVAL_AUDIT_ARCHIVE'] as const;
const APPROVAL_AUDIT_EVENT_TYPES = [
  'REQUEST_CREATED',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'APPLIED',
  'EXECUTION_FAILED',
  'ARCHIVED',
  'DOWNLOAD_URL_CREATED',
  'DELETE_REQUESTED',
  'DELETE_APPLIED',
] as const;
const APPROVAL_AUDIT_EVENT_STATUSES = ['INFO', 'SUCCESS', 'FAILED', 'WARNING'] as const;

export class ListApprovalAuditEventsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number;

  @IsOptional()
  @IsIn(APPROVAL_AUDIT_WINDOWS)
  window?: (typeof APPROVAL_AUDIT_WINDOWS)[number];

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(APPROVAL_AUDIT_SOURCE_TYPES)
  source_type?: (typeof APPROVAL_AUDIT_SOURCE_TYPES)[number];

  @IsOptional()
  @IsIn(APPROVAL_AUDIT_EVENT_TYPES)
  event_type?: (typeof APPROVAL_AUDIT_EVENT_TYPES)[number];

  @IsOptional()
  @IsIn(APPROVAL_AUDIT_EVENT_STATUSES)
  event_status?: (typeof APPROVAL_AUDIT_EVENT_STATUSES)[number];

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  trace_only?: boolean;
}
