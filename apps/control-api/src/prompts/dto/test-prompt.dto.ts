import { IsObject, IsOptional, IsString } from 'class-validator';

export class TestPromptDto {
  @IsObject()
  inputs!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  model_provider_id?: string | null;

  @IsOptional()
  @IsString()
  model_config_id?: string | null;
}
