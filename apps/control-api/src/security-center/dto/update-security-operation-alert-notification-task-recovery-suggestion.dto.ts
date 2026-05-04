import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_RECOVERY_ACTIONS = ['ACKNOWLEDGE', 'IGNORE', 'RESOLVE'] as const;

export class UpdateSecurityOperationAlertNotificationTaskRecoverySuggestionDto {
  @IsIn(SECURITY_OPERATION_ALERT_NOTIFICATION_TASK_RECOVERY_ACTIONS)
  action!: 'ACKNOWLEDGE' | 'IGNORE' | 'RESOLVE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
