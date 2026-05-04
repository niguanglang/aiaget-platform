import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const SECURITY_CENTER_EVENT_SOURCES = [
  'DATA_SCOPE',
  'RESOURCE_ACL',
  'SECURITY_POLICY',
  'OPERATION',
  'APPROVAL_WORKBENCH',
] as const;
export const SECURITY_CENTER_EVENT_WINDOWS = ['1h', '24h', '7d', '30d'] as const;

export class ListSecurityCenterEventsDto {
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
  @IsIn(SECURITY_CENTER_EVENT_WINDOWS)
  window?: string;

  @IsOptional()
  @IsIn(SECURITY_CENTER_EVENT_SOURCES)
  source?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  trace_only?: boolean;
}
