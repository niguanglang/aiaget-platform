import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';

import { PROMPT_VARIABLE_TYPES } from './list-prompt-templates.dto';

export class UpdatePromptVariableDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z_][a-zA-Z0-9_]{0,99}$/)
  name?: string;

  @IsOptional()
  @IsIn(PROMPT_VARIABLE_TYPES)
  variable_type?: string;

  @IsOptional()
  @IsString()
  default_value?: string | null;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  sort_order?: number;
}
