import { IsOptional, IsString } from 'class-validator';

export class RuntimeChannelReleaseAutomationDto {
  @IsString()
  channel_id!: string;

  @IsOptional()
  @IsString()
  workflow_id?: string | null;

  @IsOptional()
  @IsString()
  run_id?: string | null;
}
