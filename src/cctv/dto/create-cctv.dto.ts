import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsJSON,
} from 'class-validator';

enum StatusEnum {
  ACTIVE = 'ACTIVE',
  NOT_ACTIVE = 'NOT ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

export class CreateCctvDto {
 
  @IsString()
  cctv_id?: string;

  @IsOptional()
  @IsString()
  cctv_name?: string;

  @IsOptional()
  @IsString()
  location_cctv?: string;

  @IsOptional()
  @IsJSON()
  geo_location?: Record<string, any>;

  
  @IsString()
  camera_direction: string; // Assuming camera_direction is a string referring to a specific direction (e.g., N, S, E, W, etc.)

  @IsOptional()
  @IsEnum(StatusEnum)
  status?: StatusEnum = StatusEnum.ACTIVE;

  @IsOptional()
  @IsString()
  url_stream?: string;

  @IsOptional()
  @IsDateString()
  installation_date?: Date;

  @IsOptional()
  @IsString()
  description?: string;
}
