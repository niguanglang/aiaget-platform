import { IsISO8601, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CloseWonCustomerSuccessOpportunityDto {
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  reason?: string | null;

  @IsOptional()
  @IsISO8601()
  closed_at?: string | null;
}
