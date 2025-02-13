import { Transform } from 'class-transformer';
import { IsBoolean, IsIn, IsNotEmpty, IsOptional } from 'class-validator';

export class DragDropPayLoadDto {
  @IsNotEmpty({
    message: 'type_from must be filled with "cp", "lane", or "outside".',
  })
  @IsIn(['cp', 'lane', 'outside'], {
    message: 'type_from must be either "cp", "lane", or "outside".',
  })
  type_from: string;

  @IsNotEmpty({
    message: 'type_to must be filled with "cp", "lane", or "outside".',
  })
  @IsIn(['cp', 'lane', 'outside'], {
    message: 'type_to must be either "cp", "lane", or "outside".',
  })
  type_to: string;

  @IsOptional()
  cplane_id_from: string;

  @IsOptional()
  cplane_id_to: string;

  @IsNotEmpty({ message: 'truck_id is required!' })
  truck_id: string;

  @IsOptional()
  assignment_id: string;

  @IsNotEmpty({ message: 'user_id is required!' })
  user_id: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  key_encrypted: boolean;
}

