import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

import type { ChannelPublishRolloutInput } from '@aiaget/shared-types';

export class UpdateChannelRolloutDto implements ChannelPublishRolloutInput {
  @IsOptional()
  @IsBoolean()
  rollout_enabled?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  rollout_percentage?: number;
}
