import { IsIn, IsOptional } from 'class-validator';

export const AUDIT_WINDOWS = ['24h', '7d'] as const;

export class GetAuditOverviewDto {
  @IsOptional()
  @IsIn(AUDIT_WINDOWS)
  window?: string;
}
