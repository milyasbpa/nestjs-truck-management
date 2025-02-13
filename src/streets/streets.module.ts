import { Module } from '@nestjs/common';
import { StreetsService } from './streets.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Streets } from './entities/streates.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([Streets])],
  providers: [
    StreetsService,
    ErrorHandlerService,
    CustomLogger,
  ],
  exports: [StreetsService],
})
export class StreetsModule {}
