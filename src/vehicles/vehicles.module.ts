import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  providers: [VehiclesService, ErrorHandlerService, CustomLogger],
  //exports: [VehiclesService],
})
export class VehiclesModule {}
