import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

class AssignmentItemDTO {
  @IsString()
  @IsNotEmpty({ message: 'nomor_lambung is required' })
  nomor_lambung: string;

  @IsIn(['cp', 'lane'])
  @IsString()
  assign_to: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsNotEmpty({ message: 'id_lane_or_cp is required' })
  id_lane_or_cp: number;

  
  @IsString()
  @IsNotEmpty({ message: 'user_id is required' })
  user_id: string;
}

export class CreateCpQueueAssignmentDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignmentItemDTO)
  assignments: AssignmentItemDTO[];
}
