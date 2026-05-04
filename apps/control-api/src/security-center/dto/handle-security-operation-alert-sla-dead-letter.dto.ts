import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_ACTIONS = ['CLAIM', 'REQUEUE', 'CLOSE'] as const;

export class HandleSecurityOperationAlertSlaDeadLetterDto {
  @IsIn(SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_ACTIONS)
  action!: 'CLAIM' | 'REQUEUE' | 'CLOSE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
