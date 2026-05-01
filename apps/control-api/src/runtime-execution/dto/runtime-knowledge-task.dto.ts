import { IsOptional, IsString } from 'class-validator';

export class RuntimeKnowledgeTaskDto {
  @IsString()
  task_id!: string;

  @IsOptional()
  @IsString()
  workflow_id?: string | null;

  @IsOptional()
  @IsString()
  run_id?: string | null;
}
