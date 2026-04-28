import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const MODEL_PROVIDER_TYPES = ['OPENAI_COMPATIBLE', 'AZURE_OPENAI', 'ANTHROPIC', 'LOCAL'] as const;
export const MODEL_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;
export const MODEL_CAPABILITIES = ['chat', 'embedding', 'rerank', 'vision', 'tool_call'] as const;

export class ListModelProvidersDto {
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
  @IsIn(MODEL_PROVIDER_TYPES)
  provider_type?: string;

  @IsOptional()
  @IsIn(MODEL_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(MODEL_CAPABILITIES)
  capability?: string;
}
