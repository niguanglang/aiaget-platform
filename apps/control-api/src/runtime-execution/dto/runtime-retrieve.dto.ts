import { IsOptional, IsString } from 'class-validator';

export class RuntimeRetrieveDto {
  @IsString()
  tenant_id!: string;

  @IsString()
  user_id!: string;

  @IsString()
  agent_id!: string;

  @IsString()
  query!: string;

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
