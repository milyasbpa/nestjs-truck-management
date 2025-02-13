import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CpEntranceTypeDto {
  @IsOptional()
  @IsNumber()
  limit?: number;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsString()
  search?: string;
}

export interface CpEntraceTypeOptionListDTO {
  limit: number;
  page: number;
  search?: string;
}
