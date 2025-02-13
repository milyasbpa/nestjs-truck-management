import {
  IsString,
  IsOptional,
  IsEnum,
  IsJSON,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { TypeOfPortEnum } from '../../utils/enums';
import { Transform } from 'class-transformer';

export class CreatePortDto {
  @IsEnum(TypeOfPortEnum)
  typeofport?: TypeOfPortEnum = TypeOfPortEnum.SEA;

  @IsOptional()
  @IsJSON()
  geo_location?: Record<string, any>;

  @IsString()
  port_code: string;

  @IsString()
  port_name?: string;

  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  image_path?: string;

  @IsString()
  description: string; // Assuming camera_direction is a string referring to a specific direction (e.g., N, S, E, W, etc.)

  @IsNumber()
  max_total_capacity: number; // Assuming camera_direction is a string referring to a specific direction (e.g., N, S, E, W, etc.)

  @IsNumber()
  current_load: number; // Assuming camera_direction is a string referring to a specific direction (e.g., N, S, E, W, etc.)
  
  
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  @IsBoolean()
  port_status?: boolean;
}
