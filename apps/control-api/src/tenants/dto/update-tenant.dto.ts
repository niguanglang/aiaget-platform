import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { TENANT_STATUSES } from './list-tenants.dto';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(TENANT_STATUSES)
  status?: string;
}
