import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import {
  AGENT_TEAM_FAILURE_POLICIES,
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

  @IsOptional()
  @IsString()
  supervisor_model_id?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  supervisor_prompt?: string | null;

  @IsOptional()
  @IsIn(AGENT_TEAM_FAILURE_POLICIES)
  failure_policy?: string;

  @IsOptional()
  @IsBoolean()
  quality_gate_enabled?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  quality_threshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000000)
  budget_token_limit?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000000)
  budget_cost_limit?: number | null;
}
