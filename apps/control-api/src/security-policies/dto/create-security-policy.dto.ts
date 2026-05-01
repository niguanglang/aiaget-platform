import { IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

import { SECURITY_POLICY_EFFECTS } from './list-security-policies.dto';

export class CreateSecurityPolicyDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsIn(SECURITY_POLICY_EFFECTS)
  effect!: string;

  @IsString()
  @MaxLength(80)
  resource_type!: string;

  @IsString()
  @MaxLength(120)
  action!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  priority?: number;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown> | null;
}
