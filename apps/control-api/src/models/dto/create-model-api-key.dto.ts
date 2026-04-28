import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateModelApiKeyDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsString()
  @MinLength(8)
  api_key!: string;
}
