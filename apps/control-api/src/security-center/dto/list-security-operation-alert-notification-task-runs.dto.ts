import { IsIn, IsOptional, IsString } from 'class-validator';

const SECURITY_OPERATION_ALERT_NOTIFICATION_TASKS = ['AUTO_NOTIFY', 'AUTO_RETRY'] as const;
const SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_STATUSES = ['SUCCESS', 'FAILED', 'SKIPPED'] as const;

export class ListSecurityOperationAlertNotificationTaskRunsDto {
  @IsOptional()
  @IsIn(SECURITY_OPERATION_ALERT_NOTIFICATION_TASKS)
  task?: 'AUTO_NOTIFY' | 'AUTO_RETRY';

  @IsOptional()
  @IsIn(SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_STATUSES)
  status?: 'SUCCESS' | 'FAILED' | 'SKIPPED';

  @IsOptional()
  @IsString()
  keyword?: string;
}
