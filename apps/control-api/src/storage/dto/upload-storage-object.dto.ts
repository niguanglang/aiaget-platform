import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UploadStorageObjectDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  file_name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  folder?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  content_type?: string | null;

  @IsString()
  @MinLength(1)
  content_base64!: string;
}
