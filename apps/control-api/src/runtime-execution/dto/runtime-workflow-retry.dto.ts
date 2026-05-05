import { IsIn, IsString } from 'class-validator';

export class RuntimeWorkflowRetryDto {
  @IsIn(['knowledge_task'])
  task_type!: 'knowledge_task';

  @IsString()
  task_id!: string;
}
