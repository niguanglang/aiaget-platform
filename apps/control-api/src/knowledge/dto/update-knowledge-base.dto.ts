import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { KNOWLEDGE_BASE_STATUSES, KNOWLEDGE_VISIBILITIES } from './list-knowledge-bases.dto';

export class UpdateKnowledgeBaseDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_VISIBILITIES)
  visibility?: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_BASE_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;
}
