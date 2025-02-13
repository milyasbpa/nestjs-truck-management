import { decryptJSAES } from '@utils/functions.service';
import { Transform } from 'class-transformer';
import { IsString, IsOptional, IsBoolean, IsInt, IsIn } from 'class-validator';
export class CreateRuleOfSimpangBayahLaneDto {
  @Transform(({ value }) => {
    try {
      return Number(decryptJSAES(value));
    } catch (error) {
      throw new Error('Invalid Encrypted ID');
    }
  })
  @IsOptional()
  @IsInt()
  lane_id?: number;

  @IsOptional()
  @IsString()
  @IsIn(['SDT', 'DDT', 'DT'])
  truck_type?: string;

  @IsOptional()
  @IsBoolean()
  is_deleted?: boolean;

  @IsOptional()
  @IsInt()
  created_by?: number;
}
