import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const MENU_TYPES = ['DIRECTORY', 'MENU', 'BUTTON'] as const;
export const MENU_STATUS_FILTERS = ['ENABLED', 'DISABLED'] as const;

export class ListMenusDto {
  @IsOptional()
  @Transform(({ value }) => Number(value ?? 1))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value ?? 100))
  @IsInt()
  @Min(1)
  @Max(500)
  page_size = 100;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsIn(MENU_TYPES)
  type?: string;

  @IsOptional()
  @IsIn(MENU_STATUS_FILTERS)
  status?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    return value === 'true' || value === true;
  })
  @IsBoolean()
  visible?: boolean;
}
