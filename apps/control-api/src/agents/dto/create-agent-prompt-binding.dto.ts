import { IsIn, IsString } from 'class-validator';

const AGENT_PROMPT_BINDING_TYPES = ['SYSTEM', 'USER', 'ASSISTANT', 'TOOL'] as const;

export class CreateAgentPromptBindingDto {
  @IsString()
  prompt_id!: string;

  @IsIn(AGENT_PROMPT_BINDING_TYPES)
  prompt_type!: string;
}
