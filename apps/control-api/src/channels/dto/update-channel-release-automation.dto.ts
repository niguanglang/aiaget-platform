import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import type { ChannelReleaseAutomationPolicyInput } from '@aiaget/shared-types';

export class UpdateChannelReleaseAutomationDto implements ChannelReleaseAutomationPolicyInput {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  require_auto_promote_policy?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  min_interval_minutes?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  max_runs_per_day?: number;

  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;
}
