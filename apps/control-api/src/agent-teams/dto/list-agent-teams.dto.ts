import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const AGENT_TEAM_STATUSES = ['DRAFT', 'ACTIVE', 'DISABLED', 'ARCHIVED'] as const;
export const AGENT_TEAM_MODES = ['SEQUENTIAL', 'PARALLEL', 'SUPERVISOR'] as const;

export class ListAgentTeamsDto {
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
  @IsIn(AGENT_TEAM_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(AGENT_TEAM_MODES)
  mode?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;
}
