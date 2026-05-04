import { IsArray, IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import type { UpdateChannelSenderPolicyInput } from '@aiaget/shared-types';

export class UpdateChannelSenderPolicyDto implements UpdateChannelSenderPolicyInput {
  @IsOptional()
  @IsBoolean()
  auto_retry_enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  manual_retry_enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  max_retry_count?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(3600)
  retry_backoff_seconds?: number;

  @IsOptional()
  @IsArray()
  retry_on_statuses?: number[];

  @IsOptional()
  @IsBoolean()
  alert_on_failure?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  retention_days?: number;
}
