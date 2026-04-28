import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateAgentDto {
  @IsString()
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,99}$/)
  code!: string;

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

