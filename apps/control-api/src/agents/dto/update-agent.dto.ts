import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { AGENT_STATUSES } from './list-agents.dto';

export class UpdateAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  avatar_url?: string | null;

  @IsOptional()
  @IsString()
  category_id?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;

  @IsOptional()
  @IsIn(AGENT_STATUSES)
  status?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(512)
  @Max(200000)
  max_context_tokens?: number;

  @IsOptional()
  @IsBoolean()
  enable_stream?: boolean;

  @IsOptional()
  @IsBoolean()
  enable_log?: boolean;
}

