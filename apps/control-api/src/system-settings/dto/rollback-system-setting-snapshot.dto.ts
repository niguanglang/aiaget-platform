import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RollbackSystemSettingSnapshotDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string | null;
}
