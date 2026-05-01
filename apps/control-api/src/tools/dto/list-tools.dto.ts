import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const TOOL_TYPES = ['HTTP'] as const;
export const TOOL_STATUSES = ['ACTIVE', 'DISABLED', 'DELETED'] as const;
export const TOOL_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export const TOOL_RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH'] as const;
export const TOOL_AUTH_TYPES = ['NONE', 'BEARER', 'API_KEY_HEADER', 'API_KEY_QUERY', 'BASIC'] as const;

export class ListToolsDto {
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
  @IsIn(TOOL_TYPES)
  tool_type?: string;

  @IsOptional()
  @IsIn(TOOL_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(TOOL_RISK_LEVELS)
  risk_level?: string;
}
