import { IsInt, Min } from 'class-validator';

export class RollbackAgentDto {
  @IsInt()
  @Min(1)
  version!: number;
}

