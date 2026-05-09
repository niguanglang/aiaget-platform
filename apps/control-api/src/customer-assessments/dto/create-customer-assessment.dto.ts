import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

import {
  CUSTOMER_ASSESSMENT_DECISION_STAGES,
  CUSTOMER_ASSESSMENT_STATUSES,
  CUSTOMER_ASSESSMENT_TYPES,
} from './list-customer-assessments.dto';

export class CustomerAssessmentSixQuestionScoresDto {
  @IsInt()
  @Min(1)
  @Max(5)
  customer_type_clarity!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  decision_intent!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  business_goal!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  process_maturity!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  data_assets!: number;

  @IsInt()
  @Min(1)
  @Max(5)
  management_budget!: number;
}

export class CreateCustomerAssessmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  customer_name!: string;

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

  @IsString()
  @MinLength(1)
  business_goal!: string;

  @IsString()
  @MinLength(1)
  process_maturity!: string;

  @IsString()
  @MinLength(1)
  data_asset_status!: string;

  @IsString()
  @MinLength(1)
  management_support!: string;

  @IsString()
  @MinLength(1)
  budget_signal!: string;

  @ValidateNested()
  @Type(() => CustomerAssessmentSixQuestionScoresDto)
  six_question_scores!: CustomerAssessmentSixQuestionScoresDto;

  @IsString()
  @MinLength(1)
  risk_summary!: string;

  @IsString()
  @MinLength(1)
  next_action!: string;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
