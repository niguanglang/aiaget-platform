import { Type } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

import { CustomerAssessmentSixQuestionScoresDto } from './create-customer-assessment.dto';
import {
  CUSTOMER_ASSESSMENT_DECISION_STAGES,
  CUSTOMER_ASSESSMENT_STATUSES,
  CUSTOMER_ASSESSMENT_TYPES,
} from './list-customer-assessments.dto';

export class UpdateCustomerAssessmentDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  customer_name?: string;

  @IsOptional()
  @IsIn(CUSTOMER_ASSESSMENT_TYPES)
  customer_type?: string;

  @IsOptional()
  @IsIn(CUSTOMER_ASSESSMENT_DECISION_STAGES)
  decision_stage?: string;

  @IsOptional()
  @IsIn(CUSTOMER_ASSESSMENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  contact_name?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  contact_info?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  business_goal?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  process_maturity?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  data_asset_status?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  management_support?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  budget_signal?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerAssessmentSixQuestionScoresDto)
  six_question_scores?: CustomerAssessmentSixQuestionScoresDto;

  @IsOptional()
  @IsString()
  @MinLength(1)
  risk_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  next_action?: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
