import { IsOptional, IsString, MaxLength } from 'class-validator';

import type { RollbackPluginInput } from '@aiaget/shared-types';

export class RollbackPluginDto implements RollbackPluginInput {
  @IsOptional()
  @IsString()
  version_id?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  version?: string;

  @IsOptional()
  @IsString()
  change_note?: string | null;
}
