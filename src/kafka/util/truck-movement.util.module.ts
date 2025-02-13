import { forwardRef, Module } from '@nestjs/common';
import { TruckMovementUtil } from './truck-movement.util';
import { ManagementTruckService } from 'src/services/management_truck.service';
import { ErrorHandlerModule } from '@utils/error-handler.module';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLoggerModule } from '@utils/custom-logger.module';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [],
  providers: [
    TruckMovementUtil,
    ManagementTruckService,
    ErrorHandlerService,
    CustomLogger,
  ],
  exports: [TruckMovementUtil],
})
export class TruckMovementUtilModule {}
