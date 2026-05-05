import { IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RuntimeAgentTeamRunDto {
  @IsString()
  run_id!: string;

  @IsOptional()
  @IsString()
  handoff_id?: string | null;

  @IsOptional()
  @IsString()
  decision_note?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  next_round_index?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completed_member_ids?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previous_outputs?: string[];
}
