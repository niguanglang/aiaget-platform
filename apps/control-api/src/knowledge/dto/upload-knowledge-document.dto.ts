import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import { KNOWLEDGE_SOURCE_TYPES } from './list-knowledge-bases.dto';

export class UploadKnowledgeDocumentDto {
  @IsString()
  @MaxLength(220)
  title!: string;

  @IsIn(KNOWLEDGE_SOURCE_TYPES)
  source_type!: string;

  @IsString()
  @MinLength(1)
  content!: string;

  @IsOptional()
  @IsString()
  file_name?: string | null;

  @IsOptional()
  @IsString()
  mime_type?: string | null;
}
