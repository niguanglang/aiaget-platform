import { IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

const SECURITY_OPERATION_ALERT_NOTIFICATION_CHANNELS = ['IN_APP', 'WEBHOOK'] as const;

export class NotifySecurityOperationAlertDto {
  @IsOptional()
  @IsArray()
  @IsIn(SECURITY_OPERATION_ALERT_NOTIFICATION_CHANNELS, { each: true })
  channels?: Array<'IN_APP' | 'WEBHOOK'>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
