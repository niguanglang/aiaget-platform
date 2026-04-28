import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsOptional()
  @IsString()
  tenantCode = 'default';

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

