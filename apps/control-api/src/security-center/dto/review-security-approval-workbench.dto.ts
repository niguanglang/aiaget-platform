import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewSecurityApprovalWorkbenchDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision!: 'APPROVE' | 'REJECT';

  @IsOptional()
  @IsString()
  decision_note?: string | null;
}
