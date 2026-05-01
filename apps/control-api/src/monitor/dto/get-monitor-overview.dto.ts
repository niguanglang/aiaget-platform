import { IsIn, IsOptional } from 'class-validator';

import { MONITOR_WINDOWS } from './list-monitor-events.dto';

export class GetMonitorOverviewDto {
  @IsOptional()
  @IsIn(MONITOR_WINDOWS)
  window?: string;
}
