import { IsIn, IsOptional, IsString } from 'class-validator';

const SECURITY_OPERATION_ALERT_NOTIFICATION_STATUSES = ['SENT', 'PARTIAL', 'SKIPPED', 'FAILED'] as const;

export class ListSecurityOperationAlertNotificationsDto {
  @IsOptional()
  @IsIn(SECURITY_OPERATION_ALERT_NOTIFICATION_STATUSES)
  status?: 'SENT' | 'PARTIAL' | 'SKIPPED' | 'FAILED';

  @IsOptional()
  @IsString()
  alert_category?: string;

  @IsOptional()
  @IsString()
  keyword?: string;
}
