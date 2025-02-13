import { IsOptional } from 'class-validator';
export class TruckLogsPayloadDto {
  @IsOptional()
  assignment_id: string;
  @IsOptional()
  truck_id: string;
  @IsOptional()
  status: string;
  @IsOptional()
  start_date: string;
  @IsOptional()
  end_date: string;
}
