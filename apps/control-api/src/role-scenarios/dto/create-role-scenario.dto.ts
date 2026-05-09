import { IsArray, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator';

import {
  ROLE_SCENARIO_PRIORITIES,
  ROLE_SCENARIO_STATUSES,
  ROLE_SCENARIO_TYPES,
} from './list-role-scenarios.dto';

export class CreateRoleScenarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  role_name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  department_name!: string;

  @IsOptional()
  @IsIn(ROLE_SCENARIO_TYPES)
  scenario_type?: string;

  @IsOptional()
  @IsIn(ROLE_SCENARIO_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(ROLE_SCENARIO_PRIORITIES)
  priority?: string;

  @IsString()
  @MinLength(1)
  pain_point!: string;

  @IsString()
  @MinLength(1)
  business_goal!: string;

  @IsString()
  @MinLength(1)
  workflow_summary!: string;

  @IsString()
  @MinLength(1)
  expected_outcome!: string;

  @IsString()
  @MinLength(1)
  sample_deliverable!: string;

  @IsString()
  @MinLength(1)
  acceptance_criteria!: string;

  @IsString()
  @MinLength(1)
  roi_metric!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  impact_score?: number;

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
  agent_id?: string | null;

  @IsOptional()
  @IsString()
  skill_id?: string | null;

  @IsOptional()
  @IsString()
  knowledge_id?: string | null;

  @IsOptional()
  @IsString()
  tool_id?: string | null;

  @IsOptional()
  @IsString()
  prompt_id?: string | null;
}
