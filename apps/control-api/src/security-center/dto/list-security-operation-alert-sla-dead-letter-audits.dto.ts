import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

const SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_ACTIONS = ['CLAIM', 'REQUEUE', 'CLOSE'] as const;
const SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_STATUSES = ['OPEN', 'CLAIMED', 'REQUEUED', 'CLOSED'] as const;

export class ListSecurityOperationAlertSlaDeadLetterAuditsDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 8))
  @IsInt()
  @Min(1)
  @Max(50)
  page_size = 8;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  alert_category?: string;

  @IsOptional()
  @IsIn(SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_ACTIONS)
  action?: 'CLAIM' | 'REQUEUE' | 'CLOSE';

  @IsOptional()
  @IsIn(SECURITY_OPERATION_ALERT_SLA_DEAD_LETTER_STATUSES)
  disposition_status?: 'OPEN' | 'CLAIMED' | 'REQUEUED' | 'CLOSED';
}
