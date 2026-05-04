import { IsIn, IsOptional, IsString } from 'class-validator';

import { PLATFORM_EVENT_WINDOWS } from './get-platform-usage-overview.dto';

const PLATFORM_USAGE_ALERT_NOTIFICATION_STATUSES = ['SENT', 'PARTIAL', 'SKIPPED', 'FAILED'] as const;

export class ListPlatformUsageAlertNotificationsDto {
  @IsOptional()
  @IsIn(PLATFORM_EVENT_WINDOWS)
  window?: string;

  @IsOptional()
  @IsIn(PLATFORM_USAGE_ALERT_NOTIFICATION_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  alert_id?: string;
}
