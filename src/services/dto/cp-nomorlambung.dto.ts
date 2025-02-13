import { IsEmpty, IsNotEmpty, IsString } from 'class-validator';

export class CpQAssigmentNomorLambungDto {
  @IsNotEmpty({ message: 'assignment_id is required' })
  @IsString()
  assignment_id: string;

  @IsString()
  nomor_lambung: string;
}
