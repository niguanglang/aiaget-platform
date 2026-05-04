import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const SECURITY_APPROVAL_WORKBENCH_TYPES = [
  'TOOL_CALL',
  'NOTIFICATION_POLICY',
  'APPROVAL_AUDIT_ARCHIVE_DELETE',
  'OPERATION_ALERT_NOTIFICATION_ARCHIVE_DELETE',
  'SLA_DEAD_LETTER_AUDIT_ARCHIVE_DELETE',
  'NOTIFICATION_TASK_RECOVERY_AUDIT_ARCHIVE_DELETE',
] as const;

const SECURITY_APPROVAL_WORKBENCH_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'APPLIED'] as const;

const SECURITY_APPROVAL_WORKBENCH_RISK_DOMAINS = ['TOOL', 'POLICY', 'AUDIT_ARCHIVE', 'OPERATION_ALERT'] as const;

export class ListSecurityApprovalWorkbenchDto {
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
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(SECURITY_APPROVAL_WORKBENCH_TYPES)
  type?: (typeof SECURITY_APPROVAL_WORKBENCH_TYPES)[number];

  @IsOptional()
  @IsIn(SECURITY_APPROVAL_WORKBENCH_STATUSES)
  status?: (typeof SECURITY_APPROVAL_WORKBENCH_STATUSES)[number];

  @IsOptional()
  @IsIn(SECURITY_APPROVAL_WORKBENCH_RISK_DOMAINS)
  risk_domain?: (typeof SECURITY_APPROVAL_WORKBENCH_RISK_DOMAINS)[number];
}
