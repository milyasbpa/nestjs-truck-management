import { CustomLogger } from './../utils/custom-logger.service';
import { forwardRef, Module } from '@nestjs/common';
import { CPStatusService } from './cpstatus.services';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLoggerModule } from '@utils/custom-logger.module';
@Module({
  imports: [
  ],
  providers: [CPStatusService, ErrorHandlerService,CustomLogger],
  exports: [CPStatusService],
})
export class CPStatusModule {}
