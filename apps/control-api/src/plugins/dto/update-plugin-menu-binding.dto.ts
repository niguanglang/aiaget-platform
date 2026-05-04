import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdatePluginMenuBindingDto {
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sort_order?: number;
}
