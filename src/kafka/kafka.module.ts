import { forwardRef, Global, Module } from '@nestjs/common';
import { KafkaController } from './kafka.controller';
import { KafkaService } from './kafka.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ValidationService } from '@utils/validation-service';
import { ConsumerLogs } from './entities/consumer-logs';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { JobModule } from 'src/jobs/job.module';
import { LaneModule } from 'src/lane/lane.module';
import { TruckMonitoringService } from 'src/jobs/trucksmonitor.service';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { TruckMovementUtilModule } from './util/truck-movement.util.module';
import { TruckMonitorModule } from 'src/jobs/trucksmonitor.module';
import { ManagementTruckModule } from 'src/services/management_truck.module';
import { VideotronNotifMappingModule } from 'src/vidiotron-notif/videotro-notif-mapping.module';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { SimpangBayahModule } from 'src/services/simpangbayah.module';
import { MutexService } from '@utils/mutex.service';
import { DeviceSBModule } from './util/device_sb.module';
import { QueueVidiotronModule } from 'src/queue_vidiotron/queue_vidiotron.module';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { VidiotronNotif } from '../vidiotron-notif/entities/vidiotron-notif.entity';
import { LuminixUtil } from '../luminix/luminix.util';
import { LuminixService } from 'src/luminix/luminix.service';
import { Vidiotron } from 'src/vidiotron-notif/entities/vidiotron.entity';
import { Lanes } from 'src/lane/entities/lane.entity';
import { Cps } from 'src/jobs/entities/cps.entity';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsumerLogs,
      QueueLaneRules,
      QueueVidiotron,
      VidiotronNotif,
      Vidiotron,
      Lanes,
      kafkaDTTruckCountLocation,
      Cps,
    ]),
    JobModule,
    LaneModule,
    TruckMovementUtilModule,
    forwardRef(() => TruckMonitorModule),
    ManagementTruckModule,
    forwardRef(() => VideotronNotifMappingModule),
    CustomCacheModule,
    forwardRef(() => SimpangBayahModule),
    forwardRef(() => DeviceSBModule),
    forwardRef(() => QueueVidiotronModule),
  ],
  controllers: [KafkaController],
  providers: [
    KafkaService,
    ValidationService,
    TruckMonitoringService,
    ErrorHandlerService,
    CustomLogger,
    MutexService,
    QueueVidiotronService,
    VidiotronNotifService,
    LuminixUtil,
    LuminixService,
    VehiclesService,
  ],
})
export class KafkaModule {}
