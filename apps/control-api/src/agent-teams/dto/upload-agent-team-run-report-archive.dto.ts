import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import type { AgentTeamRunReportArchiveReportType } from '@aiaget/shared-types';

const reportTypes: AgentTeamRunReportArchiveReportType[] = ['ACCEPTANCE', 'OPERATION', 'ANALYSIS', 'CUSTOM'];

export class UploadAgentTeamRunReportArchiveDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  file_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  content_type?: string | null;

  @IsString()
  @MinLength(1)
  content_base64!: string;

  @IsString()
  @IsIn(reportTypes)
  report_type!: AgentTeamRunReportArchiveReportType;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  run_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  archive_reason?: string | null;
}
