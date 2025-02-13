import { Type } from 'class-transformer';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
} from 'class-validator';

export class CpExitTypeDto {
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

export interface GetCpExitTypeOptionListDTO {
  limit: number;
  page: number;
  search?: string;
}
