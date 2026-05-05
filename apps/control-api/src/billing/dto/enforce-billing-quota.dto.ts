import { IsIn, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

import type { BillingQuotaMetricType, BillingQuotaPeriod, BillingQuotaSubjectType } from '@aiaget/shared-types';

export class EnforceBillingQuotaDto {
  @IsIn(['TENANT', 'API_KEY', 'AGENT', 'MODEL', 'PLUGIN'] satisfies BillingQuotaSubjectType[])
  subject_type!: BillingQuotaSubjectType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  subject_id?: string | null;

  @IsIn(['COST', 'TOKEN', 'MODEL_CALL', 'API_CALL', 'AGENT_RUN', 'STORAGE_GB'] satisfies BillingQuotaMetricType[])
  metric_type!: BillingQuotaMetricType;

  @IsOptional()
  @IsIn(['DAY', 'MONTH'] satisfies BillingQuotaPeriod[])
  period?: BillingQuotaPeriod;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usage_delta?: number;
}
