import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const PLATFORM_USAGE_ALERT_ACTIONS = ['ACKNOWLEDGE', 'ESCALATE', 'CLOSE'] as const;

export class UpdatePlatformUsageAlertDto {
  @IsIn(PLATFORM_USAGE_ALERT_ACTIONS)
  action!: 'ACKNOWLEDGE' | 'ESCALATE' | 'CLOSE';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
