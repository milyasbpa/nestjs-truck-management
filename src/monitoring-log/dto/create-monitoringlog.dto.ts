import { IsOptional, IsEnum, IsJSON, IsNumber } from 'class-validator';
import { ActivityStatusEnum } from 'src/utils/enums';

export class CreateMonitoringLogDto {
  @IsNumber()
  activity_id?: number;

  @IsOptional()
  @IsJSON()
  geo_location?: Record<string, any>;

  @IsEnum(ActivityStatusEnum, {
    message: `The status of activity must be one of the following : IDLE, ENROUTE, REROUTED, COMPLETED`,
  })
  status?: ActivityStatusEnum = ActivityStatusEnum.IDLE;

  @IsOptional()
  @IsJSON()
  other_info?: Record<string, any>;
}
