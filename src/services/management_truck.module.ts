import { forwardRef, Module } from '@nestjs/common';
import { ManagementTruckService } from './management_truck.service';
import { ErrorHandlerModule } from '@utils/error-handler.module';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [
  ],
  providers: [ManagementTruckService,ErrorHandlerService,CustomLogger],
  exports: [ManagementTruckService],
})
export class ManagementTruckModule {}
