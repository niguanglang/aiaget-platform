import { IsInt, Min } from 'class-validator';

export class RollbackPromptDto {
  @IsInt()
  @Min(1)
  version!: number;
}
