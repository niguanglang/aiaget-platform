import { ArrayUnique, IsArray, IsString } from 'class-validator';

export class UpdateMenuRoleBindingDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  menu_ids!: string[];
}
