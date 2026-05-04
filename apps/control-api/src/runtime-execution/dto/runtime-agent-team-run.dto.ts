import { IsString } from 'class-validator';

export class RuntimeAgentTeamRunDto {
  @IsString()
  run_id!: string;
}
