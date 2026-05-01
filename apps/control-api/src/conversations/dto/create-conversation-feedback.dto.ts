import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class CreateConversationFeedbackDto {
  @IsOptional()
  @IsString()
  run_id?: string | null;

  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string | null;
}
