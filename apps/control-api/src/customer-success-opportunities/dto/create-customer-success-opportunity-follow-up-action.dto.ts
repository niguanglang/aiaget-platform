import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCustomerSuccessOpportunityFollowUpActionDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsDateString()
  due_at?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
