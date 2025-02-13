import { forwardRef, Module } from '@nestjs/common';
import { TruckLogService } from './truck-logs.services';
import { TruckLogsController } from './truck-logs.controller';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { DatabaseService } from '@utils/database.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [],
  providers: [
    TruckLogService,
    DatabaseService,
    CustomLogger,
    ErrorHandlerService,
  ],
  exports: [TruckLogService],
  controllers: [TruckLogsController],
})
export class TruckLogModule {}
