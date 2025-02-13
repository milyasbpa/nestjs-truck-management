import {
  IsOptional,
  IsNumber,
  IsObject,
  IsDecimal,
  IsEnum,
} from 'class-validator';
import { TrafficStatusEnum } from '../../utils/enums';
export class CreateRoutesDto {
  @IsNumber()
  lane_id?: number;

  @IsOptional()
  @IsObject()
  start_location?: Record<string, any>;

  @IsOptional()
  @IsObject()
  end_location?: Record<string, any>;

  @IsOptional()
  @IsNumber()
  estimated_time?: number;

  @IsOptional()
  @IsDecimal()
  distance_km?: number;

  @IsOptional()
  @IsEnum(TrafficStatusEnum)
  traffic_status?: TrafficStatusEnum;

  @IsOptional()
  @IsNumber()
  cctv_id?: number;

  @IsOptional()
  createdat?: Date;

  @IsOptional()
  auditupdate?: Date;
}
