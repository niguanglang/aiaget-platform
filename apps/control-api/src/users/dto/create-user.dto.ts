import { IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

const USER_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  name!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: 'ACTIVE' | 'DISABLED';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleCodes?: string[];
}

