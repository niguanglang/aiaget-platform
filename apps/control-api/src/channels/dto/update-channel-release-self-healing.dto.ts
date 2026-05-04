import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import type { ChannelReleaseSelfHealingPolicyInput } from '@aiaget/shared-types';

export class UpdateChannelReleaseSelfHealingDto implements ChannelReleaseSelfHealingPolicyInput {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  dry_run?: boolean;

  @IsOptional()
  @IsBoolean()
  auto_rollback_enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  max_error_requests?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  min_allowed_rate?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  observation_window_hours?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  cooldown_minutes?: number;
}
