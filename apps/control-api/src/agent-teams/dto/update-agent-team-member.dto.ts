import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { AGENT_TEAM_MEMBER_STATUSES } from './create-agent-team-member.dto';

export class UpdateAgentTeamMemberDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  responsibility?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000)
  execution_order?: number;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsIn(AGENT_TEAM_MEMBER_STATUSES)
  status?: string;
}
