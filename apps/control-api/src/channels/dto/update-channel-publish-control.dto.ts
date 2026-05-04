import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

import type { UpdateChannelPublishControlInput } from '@aiaget/shared-types';

export class UpdateChannelPublishControlDto implements UpdateChannelPublishControlInput {
  @IsOptional()
  @IsBoolean()
  approval_required?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  approval_note?: string | null;
}
