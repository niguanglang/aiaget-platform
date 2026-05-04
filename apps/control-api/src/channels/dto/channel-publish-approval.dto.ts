import { IsOptional, IsString, MaxLength } from 'class-validator';

import type { ChannelPublishApprovalInput } from '@aiaget/shared-types';

export class ChannelPublishApprovalDto implements ChannelPublishApprovalInput {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string | null;
}
