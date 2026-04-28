import { IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

import { PROMPT_TYPES } from './list-prompt-templates.dto';

export class CreatePromptTemplateDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsIn(PROMPT_TYPES)
  type!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
