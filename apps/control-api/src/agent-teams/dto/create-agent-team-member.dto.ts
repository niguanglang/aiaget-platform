import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const AGENT_TEAM_MEMBER_STATUSES = ['ACTIVE', 'DISABLED'] as const;

export class CreateAgentTeamMemberDto {
  @IsString()
  agent_id!: string;

  @IsString()
  @MaxLength(80)
  role!: string;

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
