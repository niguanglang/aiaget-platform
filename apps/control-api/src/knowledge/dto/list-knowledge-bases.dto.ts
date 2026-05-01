import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const KNOWLEDGE_BASE_STATUSES = ['ACTIVE', 'DISABLED', 'ARCHIVED'] as const;
export const KNOWLEDGE_VISIBILITIES = ['PRIVATE', 'TENANT', 'PUBLIC'] as const;
export const KNOWLEDGE_DOCUMENT_STATUSES = ['PENDING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'] as const;
export const KNOWLEDGE_SOURCE_TYPES = ['TEXT', 'MARKDOWN', 'PDF', 'WORD', 'EXCEL', 'HTML', 'URL', 'FAQ'] as const;
export const KNOWLEDGE_TASK_TYPES = ['PROCESS', 'PARSE', 'SEGMENT', 'EMBED', 'INDEX', 'REBUILD'] as const;
export const KNOWLEDGE_RETRIEVAL_MODES = ['VECTOR', 'KEYWORD', 'HYBRID'] as const;

export class ListKnowledgeBasesDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 20))
  @IsInt()
  @Min(1)
  @Max(100)
  page_size = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_BASE_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_VISIBILITIES)
  visibility?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
