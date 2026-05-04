import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewNotificationPolicyApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  decision_note?: string | null;
}
