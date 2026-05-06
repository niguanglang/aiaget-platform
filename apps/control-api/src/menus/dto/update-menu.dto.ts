import { IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { MENU_TYPES } from './list-menus.dto';

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  parent_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsIn(MENU_TYPES)
  type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  path?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  component?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  icon?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  permission_code?: string | null;

  @IsOptional()
  @IsBoolean()
  is_external?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  external_url?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  redirect_path?: string | null;

  @IsOptional()
  @IsBoolean()
  keep_alive?: boolean;

  @IsOptional()
  @IsBoolean()
  affix?: boolean;

  @IsOptional()
  @IsBoolean()
  hide_breadcrumb?: boolean;

  @IsOptional()
  @IsObject()
  route_meta?: Record<string, unknown> | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  sort_order?: number;

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
