import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewAgentTeamHandoffDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  decision_note?: string | null;
}
