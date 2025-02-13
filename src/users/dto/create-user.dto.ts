import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { CreateUserRolesDto } from './create-user-roles.dto';

export class CreateUserDto {
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email must be valid' })
  email: string;
  @IsNotEmpty({ message: 'name is required' })
  name: string;
  @IsNotEmpty({ message: 'username is required' })
  username: string;
  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password must be string' })
  @IsStrongPassword(
    {
      minLength: 12,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'password is too weeak,It muast be at least 12 characters long and include uppercase,lowercase,numbers, and special characters.',
    },
  )
  password?: string;
  @IsNotEmpty({ message: 'created_by is required' })
  created_by: string;
  @IsOptional()
  avatar?: string;
  roles: CreateUserRolesDto[]; // Array role ID yang dipilih
}
