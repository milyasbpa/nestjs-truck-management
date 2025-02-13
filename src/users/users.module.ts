import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { PasswordService } from '@utils/password.service';
@Module({
  providers: [UsersService, ErrorHandlerService, CustomLogger, PasswordService],
  //exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
