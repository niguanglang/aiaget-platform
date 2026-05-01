import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const SECURITY_POLICY_EFFECTS = ['ALLOW', 'DENY'] as const;
export const SECURITY_POLICY_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;
export const SECURITY_POLICY_DECISIONS = ['ALLOW', 'DENY', 'NO_MATCH'] as const;
export const SECURITY_POLICY_OPERATORS = ['eq', 'neq', 'in', 'not_in', 'contains', 'exists'] as const;

export class ListSecurityPoliciesDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(SECURITY_POLICY_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(SECURITY_POLICY_EFFECTS)
  effect?: string;

  @IsOptional()
  @IsString()
  resource_type?: string;
}
