import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export const AGENT_TEAM_HANDOFF_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'AUTO'] as const;

export class CreateAgentTeamHandoffDto {
  @IsOptional()
  @IsString()
  from_member_id?: string | null;

  @IsOptional()
  @IsString()
  to_member_id?: string | null;

  @IsOptional()
  @IsString()
  from_agent_id?: string | null;

  @IsOptional()
  @IsString()
  to_agent_id?: string | null;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  reason!: string;

  @IsOptional()
  @IsIn(AGENT_TEAM_HANDOFF_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decision_note?: string | null;
}
