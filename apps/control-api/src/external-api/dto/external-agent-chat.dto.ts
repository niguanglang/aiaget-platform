import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class ExternalAgentChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  title?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  idempotency_key?: string | null;
}
