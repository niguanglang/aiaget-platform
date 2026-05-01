import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const CONVERSATION_STATUSES = ['ACTIVE', 'ARCHIVED'] as const;

export class ListConversationsDto {
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
  @IsString()
  agent_id?: string;

  @IsOptional()
  @IsIn(CONVERSATION_STATUSES)
  status?: string;
}
