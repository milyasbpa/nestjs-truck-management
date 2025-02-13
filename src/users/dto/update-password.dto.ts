import { IsNotEmpty, IsStrongPassword } from 'class-validator';

export class PasswordUserDto {
  @IsNotEmpty({ message: 'password is required' })
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
  password: string;
}
