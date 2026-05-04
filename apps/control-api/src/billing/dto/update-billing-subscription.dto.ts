import { IsBoolean, IsIn, IsOptional, IsUUID } from 'class-validator';

import type { BillingCycle, BillingSubscriptionStatus } from '@aiaget/shared-types';

export class UpdateBillingSubscriptionDto {
  @IsOptional()
  @IsUUID('4')
  plan_id?: string;

  @IsOptional()
  @IsIn(['MONTHLY', 'YEARLY'] satisfies BillingCycle[])
  billing_cycle?: BillingCycle;

  @IsOptional()
  @IsIn(['TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED'] satisfies BillingSubscriptionStatus[])
  status?: BillingSubscriptionStatus;

  @IsOptional()
  @IsBoolean()
  auto_renew?: boolean;
}
