import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { UserService } from '../service/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entity/user';
import { PasswordService } from '@utils/password.service';
import { UsersService } from 'src/users/users.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_AUTH_KEY,
        signOptions: { expiresIn: process.env.JWT_AUTH_EXPIRED },
      }),
    }),
    HttpModule,
  ],
  controllers: [AuthController],
  providers: [LocalStrategy, JwtStrategy, UserService, PasswordService, UsersService,CustomLogger, ErrorHandlerService],
})
export class AuthModule {}
