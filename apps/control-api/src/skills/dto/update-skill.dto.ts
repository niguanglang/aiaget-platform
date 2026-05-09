import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { SKILL_CATEGORIES, SKILL_STATUSES } from './list-skills.dto';

export class UpdateSkillDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(SKILL_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsIn(SKILL_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(1)
  trigger_scenario?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  input_requirements?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  execution_steps?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  output_format?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  quality_criteria?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  boundary_rules?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
