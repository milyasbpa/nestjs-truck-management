import { forwardRef, Module } from '@nestjs/common';
import { LuminixService } from './luminix.service';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VidiotronNotif } from '../vidiotron-notif/entities/vidiotron-notif.entity';
import { Vidiotron } from '../vidiotron-notif/entities/vidiotron.entity';
import { Lanes } from '../lane/entities/lane.entity';
import { VideotroNotifMappingService } from '../vidiotron-notif/videotro-notif-mapping.service';
import { Cps } from '../jobs/entities/cps.entity';
import { LuminixController } from './luminix.controller';
import { TrucksService } from 'src/trucks/trucks.service';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { LaneService } from 'src/lane/lane.service';
import { RulesOfSimpangBayah } from 'src/ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { CpQueueAssignment } from 'src/jobs/entities/cpqueueassignments.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { ValidationService } from '@utils/validation-service';
import { KafkaService } from 'src/kafka/kafka.service';
import { ConsumerLogs } from 'src/kafka/entities/consumer-logs';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { TruckMovementUtilModule } from 'src/kafka/util/truck-movement.util.module';
import { TruckMonitorModule } from 'src/jobs/trucksmonitor.module';
import { ManagementTruckModule } from 'src/services/management_truck.module';
import { VidiotronNotifModule } from 'src/vidiotron-notif/vidiotron-notif.module';
import { VideotronNotifMappingModule } from 'src/vidiotron-notif/videotro-notif-mapping.module';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { MutexService } from '@utils/mutex.service';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { DeviceSBModule } from 'src/kafka/util/device_sb.module';
import { QueueVidiotronModule } from 'src/queue_vidiotron/queue_vidiotron.module';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';
import { LuminixUtil } from './luminix.util';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
import { KafkaModule } from 'src/kafka/kafka.module';
import { SimpangBayahService } from 'src/services/simpangbayah.service';
import { CpQueues } from 'src/jobs/entities/cp_queues.entity';
import { LanesActivityLog } from 'src/lane/entities/lanes_activity_log.entity';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ConsumerLogs,
      RuleLaneCp,
      RuleOfCp,
      QueueLaneRules,
      CpQueueAssignment,
      VidiotronNotif,
      Vidiotron,
      Lanes,
      Cps,
      Trucks,
      RulesOfSimpangBayah,
      QueueVidiotron,
      kafkaDTTruckCountLocation,
      CpQueues,
      LanesActivityLog,
    ]),
    TruckMovementUtilModule,
    TruckMonitorModule,
    ManagementTruckModule,
    VidiotronNotifModule,
    VideotronNotifMappingModule,
    forwardRef(() => CustomCacheModule),
    forwardRef(() => DeviceSBModule),
    // forwardRef(()=>EventModule),
    QueueVidiotronModule,
  ],
  controllers: [LuminixController],
  providers: [
    KafkaService,
    LuminixService,
    MutexService,
    ErrorHandlerService,
    CustomLogger,
    QueueVidiotronService,
    LuminixUtil,
    VehiclesService,
    SimpangBayahService,
    LaneService,
    ValidationService,
    TrucksService,
    SocketClientService,
  ],
  exports: [LuminixService],
})
export class LuminixModule {}
