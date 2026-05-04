import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewSecurityOperationAlertSlaDeadLetterAuditArchiveApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  decision_note?: string | null;
}
