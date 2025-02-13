import { Optional } from '@nestjs/common';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveRerouteCPQueueDTO {
 
  @Optional()
  @IsString()
  assignment_id: string;
 
  @IsString()
  @IsNotEmpty({ message: 'field lane_id from is required' })
  lane_id_from: string;
  @IsString()
  @IsNotEmpty({ message: 'field lane_id to is required' })
  lane_id_to: string;
  @IsString()
  @IsNotEmpty({ message: 'field truck_id is required' })
  truck_id: string;
  @IsNumber()
  @IsNotEmpty({ message: 'field updated_by is required' })
  user_id: string;
}
