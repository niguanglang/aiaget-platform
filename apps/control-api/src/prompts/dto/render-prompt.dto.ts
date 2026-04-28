import { IsObject } from 'class-validator';

export class RenderPromptDto {
  @IsObject()
  inputs!: Record<string, unknown>;
}
