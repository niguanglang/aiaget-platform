import { IsOptional, IsString } from 'class-validator';

export class PublishPromptDto {
  @IsOptional()
  @IsString()
  change_note?: string | null;
}
