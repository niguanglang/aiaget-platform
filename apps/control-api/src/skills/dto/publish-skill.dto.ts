import { IsOptional, IsString } from 'class-validator';

export class PublishSkillDto {
  @IsOptional()
  @IsString()
  change_note?: string | null;
}
