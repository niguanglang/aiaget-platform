import { IsOptional, IsString } from 'class-validator';

export class CreateAgentVersionDto {
  @IsOptional()
  @IsString()
  change_note?: string;
}

