import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

import { KNOWLEDGE_DOCUMENT_STATUSES } from './list-knowledge-bases.dto';

export class UpdateKnowledgeDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_DOCUMENT_STATUSES)
  status?: string;
}
