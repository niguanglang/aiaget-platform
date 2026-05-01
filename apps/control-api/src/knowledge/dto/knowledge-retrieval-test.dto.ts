import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, MinLength } from 'class-validator';

import { KNOWLEDGE_RETRIEVAL_MODES } from './list-knowledge-bases.dto';

export class KnowledgeRetrievalTestDto {
  @IsString()
  @MinLength(1)
  query!: string;

  @IsOptional()
  @IsIn(KNOWLEDGE_RETRIEVAL_MODES)
  mode?: string;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 5))
  @IsInt()
  @Min(1)
  @Max(20)
  top_k = 5;
}
