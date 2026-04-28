import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { PROMPT_STATUSES, PROMPT_TYPES } from './list-prompt-templates.dto';

export class UpdatePromptTemplateDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(PROMPT_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(PROMPT_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
