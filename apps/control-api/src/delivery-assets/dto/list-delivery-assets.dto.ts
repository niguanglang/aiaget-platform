import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DELIVERY_ASSET_TYPES = [
  'SOLUTION_TEMPLATE',
  'ACCEPTANCE_CHECKLIST',
  'RISK_CHECKLIST',
  'PROMPT_SOP',
  'CUSTOMER_CASE',
  'REPORT_ARCHIVE',
] as const;
export const DELIVERY_ASSET_STATUSES = ['DRAFT', 'REVIEWING', 'PUBLISHED', 'RETIRED', 'ARCHIVED'] as const;
export const DELIVERY_ASSET_VISIBILITIES = ['PRIVATE', 'TEAM', 'TENANT', 'PUBLIC'] as const;

export class ListDeliveryAssetsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 20;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(DELIVERY_ASSET_TYPES)
  asset_type?: string;

  @IsOptional()
  @IsIn(DELIVERY_ASSET_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(DELIVERY_ASSET_VISIBILITIES)
  visibility?: string;

  @IsOptional()
  @IsString()
  owner_id?: string;

  @IsOptional()
  @IsString()
  delivery_review_id?: string;

  @IsOptional()
  @IsString()
  solution_package_id?: string;

  @IsOptional()
  @IsString()
  skill_id?: string;

  @IsOptional()
  @IsString()
  agent_id?: string;

  @IsOptional()
  @IsString()
  knowledge_id?: string;
}
