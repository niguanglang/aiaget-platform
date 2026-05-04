import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const PLATFORM_USAGE_ALERT_NOTIFICATION_CHANNELS = ['IN_APP', 'WEBHOOK'] as const;

export class NotifyPlatformUsageAlertDto {
  @IsOptional()
  @IsArray()
  @IsIn(PLATFORM_USAGE_ALERT_NOTIFICATION_CHANNELS, { each: true })
  channels?: Array<'IN_APP' | 'WEBHOOK'>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
