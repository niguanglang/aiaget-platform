import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const NOTIFICATION_POLICY_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'RESERVED', 'NOT_REQUIRED'] as const;

export class ListNotificationPolicyApprovalsDto {
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
  @IsIn(NOTIFICATION_POLICY_APPROVAL_STATUSES)
  status?: (typeof NOTIFICATION_POLICY_APPROVAL_STATUSES)[number];
}
