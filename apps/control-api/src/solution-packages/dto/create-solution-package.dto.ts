import { IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
  SOLUTION_PACKAGE_CUSTOMER_TYPES,
  SOLUTION_PACKAGE_PRIORITIES,
  SOLUTION_PACKAGE_STAGES,
  SOLUTION_PACKAGE_STATUSES,
} from './list-solution-packages.dto';

export class CreateSolutionPackageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  customer_name!: string;

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

  @IsString()
  @MinLength(1)
  executive_summary!: string;

  @IsString()
  @MinLength(1)
  business_objectives!: string;

  @IsString()
  @MinLength(1)
  scope_summary!: string;

  @IsString()
  @MinLength(1)
  scenario_blueprint!: string;

  @IsString()
  @MinLength(1)
  delivery_roadmap!: string;

  @IsString()
  @MinLength(1)
  acceptance_plan!: string;

  @IsString()
  @MinLength(1)
  roi_summary!: string;

  @IsString()
  @MinLength(1)
  risk_mitigation!: string;

  @IsString()
  @MinLength(1)
  commercial_strategy!: string;

  @IsString()
  @MinLength(1)
  next_milestone!: string;

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
