import { IsString, MaxLength, MinLength } from 'class-validator';

export class StartAgentTeamRunDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  objective!: string;
}
