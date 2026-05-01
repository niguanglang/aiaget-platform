import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewToolApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  decision_note?: string | null;
}
