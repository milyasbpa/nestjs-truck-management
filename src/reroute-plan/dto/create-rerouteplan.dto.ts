import { IsString, IsDateString, IsInt, IsNotEmpty } from 'class-validator';

export class CreateReroutePlanDto {
  @IsInt()
  truck_id: number;

  @IsInt()
  original_route_id: number;

  @IsInt()
  new_route_id: number;

  @IsNotEmpty({ message: ' The reaseon must be not empty!' })
  @IsString()
  reason: string;

  @IsDateString()
  reroute_time: Date;
}
