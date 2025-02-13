import { Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsNumber, isString, IsArray, ValidateNested } from 'class-validator';

export class CreateLaneDto {
  @IsOptional()
  @IsString()
  lane_code?: string;

  @IsOptional()
  @IsString()
  lane_name?: string;

  @IsOptional()
  @IsString()
  reason_status?: string;

  @IsOptional()
  @IsNumber()
  max_capacity?: number;

  @IsOptional()
  @IsNumber()
  ideal_speed?: number;

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsNumber()
  travel_point_time?: number;

  @IsOptional()
  @IsNumber()
  geofence_id?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  created_by?: number;

  @IsOptional()
  @IsNumber()
  updated_by?: number;

  @IsOptional()
  @IsNumber()
  positioning?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => rulesOfSimpangBayah)
  rules?: rulesOfSimpangBayah[];
}

class rulesOfSimpangBayah{
  @IsOptional()
  @IsNumber()
  id: number;

  @IsOptional()
  @IsString()
  truck_type: string;

  @IsOptional()
  @IsString()
  action: string;
}
