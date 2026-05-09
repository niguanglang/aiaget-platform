import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
  SOLUTION_PACKAGE_CUSTOMER_TYPES,
  SOLUTION_PACKAGE_PRIORITIES,
  SOLUTION_PACKAGE_STAGES,
  SOLUTION_PACKAGE_STATUSES,
} from './list-solution-packages.dto';

export class UpdateSolutionPackageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  customer_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  industry?: string | null;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_CUSTOMER_TYPES)
  customer_type?: string;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_STAGES)
  package_stage?: string;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(SOLUTION_PACKAGE_PRIORITIES)
  priority?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  executive_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  business_objectives?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  scope_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  scenario_blueprint?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  delivery_roadmap?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  acceptance_plan?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  roi_summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  risk_mitigation?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  commercial_strategy?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  next_milestone?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  package_score?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;

  @IsOptional()
  @IsString()
  customer_assessment_id?: string | null;

  @IsOptional()
  @IsString()
  role_scenario_id?: string | null;
}
