import { IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { ROLE_MUTATION_STATUSES } from './list-roles.dto';

export class CreateRoleDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{1,79}$/)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @IsOptional()
  @IsIn(ROLE_MUTATION_STATUSES)
  status?: 'ACTIVE' | 'DISABLED';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permission_ids?: string[];
}
