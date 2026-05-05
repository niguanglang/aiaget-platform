import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BillingAdjustmentActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;
}

export class VoidBillingAdjustmentDto {
  @IsString()
  @MaxLength(500)
  reason!: string;
}
