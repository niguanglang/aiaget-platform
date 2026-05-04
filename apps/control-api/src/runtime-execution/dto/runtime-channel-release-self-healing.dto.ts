import { IsOptional, IsString } from 'class-validator';

export class RuntimeChannelReleaseSelfHealingDto {
  @IsString()
  channel_id!: string;

  @IsOptional()
  @IsString()
  workflow_id?: string | null;

  @IsOptional()
  @IsString()
  run_id?: string | null;
}
