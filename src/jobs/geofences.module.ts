import { forwardRef, Module } from '@nestjs/common';
import { TruckMonitoringService } from './trucksmonitor.service';
import { QueueLaneModule } from 'src/queue_lane/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeofencesService } from './geofences.services';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
@Module({
  imports: [
    //forwardRef(() => CacheManagerModule),
    TypeOrmModule.forFeature([]),
  ],
  providers: [GeofencesService, ErrorHandlerService, CustomLogger],
  exports: [GeofencesService],
})
export class GeofencesModule {}
