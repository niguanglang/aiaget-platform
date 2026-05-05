import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateBillingInvoiceStatusDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  paid_amount?: number;

  @IsOptional()
  @IsDateString()
  paid_at?: string;
}
