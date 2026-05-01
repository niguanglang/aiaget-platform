import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateAgentKnowledgeBindingDto {
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
