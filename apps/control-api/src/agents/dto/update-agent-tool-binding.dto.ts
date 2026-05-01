import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAgentToolBindingDto {
  @IsOptional()
  @IsBoolean()
  require_approval?: boolean;
}
