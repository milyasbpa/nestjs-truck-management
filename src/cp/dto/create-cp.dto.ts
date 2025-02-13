import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  //
  ArrayNotEmpty,
  IsInt,
  IsNotEmpty,
} from 'class-validator';

class UnitOrDevice {
  @IsOptional()
  @IsNumber()
  id?: string;
  @IsString()
  device_id: string;
  @IsOptional()
  @IsString()
  device_name?: string;
  @IsString()
  item_id: string;
  @IsOptional()
  @IsString()
  item_name?: string;
  @IsOptional()
  @IsString()
  action?: string;
}

class RuleOfCp {
  @IsOptional()
  @IsNumber()
  id: string;
  @IsString()
  truck_type?: string;
  @IsOptional()
  @IsNumber()
  max_capacity?: number;
}

class RuleLaneCp {
  @IsNumber()
  queue_lane_id: number;

  @IsString()
  name_queue_lane: string;
}

class CpEntrance {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids?: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  geofence?: number[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rfid?: string;
}

class CpExit {
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  ids?: number[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  geofence?: number[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rfid?: string;
}

export class CreateCpDto {
  @IsOptional()
  @IsString()
  cp_name?: string;

  @IsOptional()
  @IsNumber()
  max_capacity?: number;

  @IsOptional()
  @IsNumber()
  current_load?: number;

  @IsNumber()
  @IsOptional()
  positioning?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitOrDevice)
  devices?: UnitOrDevice[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UnitOrDevice)
  devices_tonages?: UnitOrDevice[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleOfCp)
  rules_capacity_truck?: RuleOfCp[];

  @IsOptional()
  @IsArray()
  rules_type_truck?: [];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleLaneCp)
  rules_lane?: RuleLaneCp[];

  @IsOptional()
  @IsBoolean()
  status?: boolean;

  @IsOptional()
  @IsBoolean()
  in_lane?: boolean;

  @IsOptional()
  @IsBoolean()
  out_lane?: boolean;

  @IsOptional()
  @IsBoolean()
  dumping_area?: boolean;

  @IsOptional()
  @IsString()
  reason_status?: string;

  @IsOptional()
  @IsString()
  reason_in_lane?: string;

  @IsOptional()
  @IsString()
  reason_out_lane?: string;

  @IsOptional()
  @IsString()
  reason_dumping_area?: string;

  @IsOptional()
  @IsNumber()
  created_by?: number;

  @IsOptional()
  @IsNumber()
  updated_by?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => CpEntrance)
  cp_entrance?: CpEntrance;

  @IsOptional()
  @ValidateNested()
  @Type(() => CpExit)
  cp_exit?: CpExit;
}
