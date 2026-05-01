import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { SECURITY_POLICY_EFFECTS, SECURITY_POLICY_STATUSES } from './list-security-policies.dto';

export class UpdateSecurityPolicyDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(SECURITY_POLICY_EFFECTS)
  effect?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  resource_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  action?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  priority?: number;

  @IsOptional()
  @IsIn(SECURITY_POLICY_STATUSES)
  status?: string;

  @IsOptional()
  @IsObject()
  conditions?: Record<string, unknown> | null;
}
