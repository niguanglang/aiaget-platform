import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export const TOOL_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const TOOL_APPROVAL_SOURCES = ['TEST', 'RUNTIME'] as const;

export class ListToolApprovalsDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  page_size?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  keyword?: string;

  @IsOptional()
  @IsString()
  @IsIn(TOOL_APPROVAL_STATUSES)
  status?: (typeof TOOL_APPROVAL_STATUSES)[number];

  @IsOptional()
  @IsString()
  @IsIn(TOOL_APPROVAL_SOURCES)
  trigger_source?: (typeof TOOL_APPROVAL_SOURCES)[number];

  @IsOptional()
  @IsString()
  tool_id?: string;
}
