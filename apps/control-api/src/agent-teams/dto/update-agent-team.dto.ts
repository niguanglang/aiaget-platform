import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import {
  AGENT_TEAM_HANDOFF_POLICIES,
  AGENT_TEAM_MODES,
  AGENT_TEAM_STATUSES,
} from './create-agent-team.dto';

export class UpdateAgentTeamDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @IsOptional()
  @IsString()
  owner_id?: string | null;

  @IsOptional()
  @IsIn(AGENT_TEAM_STATUSES)
  status?: string;

  @IsOptional()
  @IsIn(AGENT_TEAM_MODES)
  mode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(20)
  max_rounds?: number;

  @IsOptional()
  @IsInt()
  @Min(30)
  @Max(86400)
  timeout_seconds?: number;

  @IsOptional()
  @IsIn(AGENT_TEAM_HANDOFF_POLICIES)
  handoff_policy?: string;
}
