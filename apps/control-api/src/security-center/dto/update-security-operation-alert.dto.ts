import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SECURITY_OPERATION_ALERT_ACTIONS = ['ACKNOWLEDGE', 'ESCALATE', 'CLOSE'] as const;

export class UpdateSecurityOperationAlertDto {
  @IsIn(SECURITY_OPERATION_ALERT_ACTIONS)
  action!: 'ACKNOWLEDGE' | 'ESCALATE' | 'CLOSE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
