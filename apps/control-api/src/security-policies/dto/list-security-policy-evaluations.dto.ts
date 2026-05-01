import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

import { SECURITY_POLICY_DECISIONS } from './list-security-policies.dto';

export class ListSecurityPolicyEvaluationsDto {
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
  @IsIn(SECURITY_POLICY_DECISIONS)
  decision?: string;

  @IsOptional()
  @IsString()
  action?: string;
}
