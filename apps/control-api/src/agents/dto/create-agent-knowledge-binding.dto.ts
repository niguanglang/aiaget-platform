import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateAgentKnowledgeBindingDto {
  @IsString()
  knowledge_id!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  weight?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  recall_top_k?: number;
}
