import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import type { ChannelReleaseBatchInput } from '@aiaget/shared-types';

export class ChannelReleaseBatchDto implements ChannelReleaseBatchInput {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  target_rollout_percentage?: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}
