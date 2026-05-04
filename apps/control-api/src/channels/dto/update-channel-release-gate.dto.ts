import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import type { ChannelReleaseGatePolicyInput } from '@aiaget/shared-types';

export class UpdateChannelReleaseGateDto implements ChannelReleaseGatePolicyInput {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100000)
  min_evaluated_count?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  min_allowed_rate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  max_blocked_count?: number;

  @IsOptional()
  @IsBoolean()
  auto_promote_enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(168)
  observation_window_hours?: number;
}
