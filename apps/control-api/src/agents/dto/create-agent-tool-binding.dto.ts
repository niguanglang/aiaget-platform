import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateAgentToolBindingDto {
  @IsString()
  tool_id!: string;

  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;
}
