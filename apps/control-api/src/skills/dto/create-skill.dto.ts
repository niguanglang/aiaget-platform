import { IsArray, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { SKILL_CATEGORIES } from './list-skills.dto';

export class CreateSkillDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsOptional()
  @IsIn(SKILL_CATEGORIES)
  category?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsString()
  @MinLength(1)
  trigger_scenario!: string;

  @IsString()
  @MinLength(1)
  input_requirements!: string;

  @IsString()
  @MinLength(1)
  execution_steps!: string;

  @IsString()
  @MinLength(1)
  output_format!: string;

  @IsString()
  @MinLength(1)
  quality_criteria!: string;

  @IsString()
  @MinLength(1)
  boundary_rules!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
