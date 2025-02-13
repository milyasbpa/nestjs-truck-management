import { IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateCronScheduleDTO {
  @IsString({ message: 'Schedule Name is required!' })
  cron_name: string;

  @IsString({ message: 'Schedule format is required!' })
  schedule: string;

  @IsOptional()
  is_active: boolean = true;

  @Type(() => Number)
  @IsOptional()
  changes_by: number;
}
