import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

import { MENU_TYPES } from './list-menus.dto';

export class CreateMenuDto {
  @IsOptional()
  @IsString()
  parent_id?: string | null;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{1,99}$/)
  code!: string;

  @IsIn(MENU_TYPES)
  type!: string;

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
