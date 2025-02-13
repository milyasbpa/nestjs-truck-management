import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';
export class CreateTrucksDto {
  
  @Transform(({ value }) => Number(value))
  @IsNumber()
  id: number;

  @IsString()
  nomor_lambung: string;
  
  @Transform(({ value }) => Number(value))
  @IsNumber()
  capacity_in_tons: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  year_made: number;

  @Transform(({ value }) => value === 'true' || value === '1')
  @IsBoolean()
  status: boolean;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsString()
  typeoftruck?: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  created_by?: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  updated_by?: number;
}
