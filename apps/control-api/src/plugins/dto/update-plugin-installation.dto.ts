import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PluginInstallationStatus, PluginRiskLevel, PluginRuntimeStatus } from '@aiaget/shared-types';

export class UpdatePluginInstallationDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsIn(['PENDING_REVIEW', 'INSTALLED', 'ACTIVE', 'DISABLED', 'UPGRADING', 'FAILED', 'ARCHIVED'] satisfies PluginInstallationStatus[])
  status?: PluginInstallationStatus;

  @IsOptional()
  @IsIn(['RUNNING', 'STOPPED', 'UPGRADING', 'BLOCKED', 'ERROR'] satisfies PluginRuntimeStatus[])
  runtime_status?: PluginRuntimeStatus;

  @IsOptional()
  @IsObject()
  config_json?: Record<string, unknown> | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  latest_version?: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] satisfies PluginRiskLevel[])
  risk_level?: PluginRiskLevel;
}
