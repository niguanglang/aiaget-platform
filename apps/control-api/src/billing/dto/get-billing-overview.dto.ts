import { IsIn, IsOptional } from 'class-validator';

export const BILLING_WINDOWS = ['24h', '7d'] as const;

export class GetBillingOverviewDto {
  @IsOptional()
  @IsIn(BILLING_WINDOWS)
  window?: string;
}
