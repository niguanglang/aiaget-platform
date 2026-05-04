import { IsArray, IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PluginRiskLevel, PluginSourceType } from '@aiaget/shared-types';

export class CreatePluginInstallationDto {
  @IsString()
  @MaxLength(120)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  provider?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  latest_version?: string;

  @IsOptional()
  @IsIn(['MARKET', 'CUSTOM'] satisfies PluginSourceType[])
  source_type?: PluginSourceType;

  @IsOptional()
  @IsObject()
  manifest_json?: Record<string, unknown> | null;

  @IsOptional()
  @IsObject()
  config_json?: Record<string, unknown> | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permission_preview?: string[];

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] satisfies PluginRiskLevel[])
  risk_level?: PluginRiskLevel;
}
