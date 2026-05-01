import { IsString, MinLength } from 'class-validator';

export class StorageObjectKeyDto {
  @IsString()
  @MinLength(1)
  key!: string;
}
