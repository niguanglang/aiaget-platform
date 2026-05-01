import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  agent_id!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string | null;
}
