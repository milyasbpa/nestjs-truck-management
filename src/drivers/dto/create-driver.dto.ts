import { IsString, IsEnum, IsOptional, IsNumber } from 'class-validator';
 
import { Type } from 'class-transformer';
enum TypeofDrivingLicenseEnum {
  SIM_B1 = 'SIM-B1',
  SIM_B2 = 'SIM-B2',
  OTHERS = 'OTHERS',
}
export class CreateDriverDto {
  @IsString({ message: 'Driver Name is required!' })
  driver_name: string;

  @Type(() => String)
  @IsEnum(TypeofDrivingLicenseEnum, {
    message: 'The value must be followwing : SIM-B1, SIM-B2, OTHERS',
  })
  typeofdriving_license: TypeofDrivingLicenseEnum;

  @IsOptional()
  is_active: boolean = true;

  @Type(() => Number)
  @IsNumber()
  created_by: number;

  @Type(() => Number)
  @IsOptional()
  updated_by: number;
}
