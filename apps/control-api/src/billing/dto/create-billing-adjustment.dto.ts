import { IsIn, IsNumber, IsOptional, IsString, IsUUID, MaxLength, Min } from 'class-validator';

import type { BillingAdjustmentStatus, BillingAdjustmentType } from '@aiaget/shared-types';

export class CreateBillingAdjustmentDto {
  @IsOptional()
  @IsUUID()
  invoice_id?: string | null;

  @IsIn(['CREDIT', 'DEBIT', 'REFUND', 'DISCOUNT', 'CORRECTION'] satisfies BillingAdjustmentType[])
  type!: BillingAdjustmentType;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @MaxLength(220)
  reason!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsIn(['PENDING', 'APPROVED', 'APPLIED', 'REJECTED', 'VOID'] satisfies BillingAdjustmentStatus[])
  status?: BillingAdjustmentStatus;
}
