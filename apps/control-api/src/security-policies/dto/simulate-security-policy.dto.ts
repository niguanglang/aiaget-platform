import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SimulateSecurityPolicyDto {
  @IsObject()
  subject!: Record<string, unknown>;

  @IsObject()
  resource!: Record<string, unknown>;

  @IsString()
  @MaxLength(120)
  action!: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, unknown> | null;
}
