import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['created_by','password'] as const),
) {
  @IsNotEmpty({ message: 'updated_by parameter is required' })
  updated_by?: string;
}
