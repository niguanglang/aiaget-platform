import { IsObject, IsOptional } from 'class-validator';

export class TestToolDto {
  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;
}
