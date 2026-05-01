import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { KNOWLEDGE_VISIBILITIES } from './list-knowledge-bases.dto';

export class CreateKnowledgeBaseDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_VISIBILITIES)
  visibility?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
