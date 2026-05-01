import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { ROLE_MUTATION_STATUSES } from './list-roles.dto';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsIn(ROLE_MUTATION_STATUSES)
  status?: 'ACTIVE' | 'DISABLED';
}
