import { IsIn, IsOptional, IsString } from 'class-validator';

const AGENT_MODEL_BINDING_TYPES = ['DEFAULT'] as const;

export class CreateAgentModelBindingDto {
  @IsString()
  model_id!: string;

  @IsOptional()
  @IsIn(AGENT_MODEL_BINDING_TYPES)
  binding_type?: string;
}
