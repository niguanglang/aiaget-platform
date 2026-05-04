import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

import type { BillingQuotaAction, BillingQuotaPolicyStatus } from '@aiaget/shared-types';

export class UpdateBillingQuotaPolicyDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  limit_value?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  warn_threshold?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  hard_threshold?: number;

  @IsOptional()
  @IsIn(['WARN', 'THROTTLE', 'REQUIRE_APPROVAL', 'BLOCK'] satisfies BillingQuotaAction[])
  action?: BillingQuotaAction;

  @IsOptional()
  @IsIn(['ACTIVE', 'DISABLED', 'DELETED'] satisfies BillingQuotaPolicyStatus[])
  status?: BillingQuotaPolicyStatus;
}
