import { IsObject, IsOptional, IsString } from 'class-validator';

export class RuntimeToolCallDto {
  @IsString()
  tenant_id!: string;

  @IsString()
  user_id!: string;

  @IsString()
  agent_id!: string;

  @IsOptional()
  @IsString()
  conversation_id?: string | null;

  @IsString()
  tool_id!: string;

  @IsOptional()
  @IsObject()
  input?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  request_id?: string | null;

  @IsOptional()
  @IsString()
  trace_id?: string | null;

  @IsOptional()
  @IsString()
  parent_span_id?: string | null;

  @IsOptional()
  @IsString()
  traceparent?: string | null;
}
