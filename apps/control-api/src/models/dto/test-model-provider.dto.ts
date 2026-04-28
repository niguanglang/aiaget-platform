import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class TestModelProviderDto {
  @IsOptional()
  @IsString()
  model_config_id?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  prompt!: string;
}
