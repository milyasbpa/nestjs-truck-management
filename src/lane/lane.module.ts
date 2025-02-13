import { forwardRef, Module } from '@nestjs/common';
import { LaneController } from './lane.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lanes } from './entities/lane.entity';
import { LaneService } from './lane.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { CpQueueAssignment } from '../jobs/entities/cpqueueassignments.entity';
import { ValidationService } from '@utils/validation-service';
import { RulesOfSimpangBayah } from 'src/ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { Cps } from '../jobs/entities/cps.entity';
import { Trucks } from '../trucks/entities/trucks.entity';
import { TrucksService } from '../trucks/trucks.service';
import { VidiotronNotif } from '../vidiotron-notif/entities/vidiotron-notif.entity';
import { KafkaService } from 'src/kafka/kafka.service';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { ConsumerLogs } from '../kafka/entities/consumer-logs';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { RfidModule } from 'src/rfid/rfid.module';
import { VideotronNotifMappingModule } from 'src/vidiotron-notif/videotro-notif-mapping.module';
import { TruckMovementUtilModule } from 'src/kafka/util/truck-movement.util.module';
import { TruckMonitorModule } from 'src/jobs/trucksmonitor.module';
import { ManagementTruckModule } from 'src/services/management_truck.module';
import { VidiotronNotifModule } from 'src/vidiotron-notif/vidiotron-notif.module';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { CpQueues } from '../jobs/entities/cp_queues.entity';
import { MutexService } from '@utils/mutex.service';
import { DeviceSBModule } from 'src/kafka/util/device_sb.module';
import { QueueVidiotronModule } from 'src/queue_vidiotron/queue_vidiotron.module';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { LuminixService } from 'src/luminix/luminix.service';
import { Vidiotron } from 'src/vidiotron-notif/entities/vidiotron.entity';
import { VidiotronLane } from 'src/vidiotron-notif/entities/vidiotron-lane.entity';
import { LanesActivityLog } from './entities/lanes_activity_log.entity';
import { LuminixUtil } from 'src/luminix/luminix.util';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
import { SimpangBayahService } from 'src/services/simpangbayah.service';
import { LuminixModule } from 'src/luminix/luminix.module';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Module({
  imports: [
    forwardRef(() => LaneModule),
    forwardRef(() => RfidModule),
    forwardRef(() => DeviceSBModule),
    TypeOrmModule.forFeature([
      Lanes,
      CpQueueAssignment,
      Cps,
      RulesOfSimpangBayah,
      Trucks,
      VidiotronNotif,
      RuleLaneCp,
      RuleOfCp,
      ConsumerLogs,
      QueueLaneRules,
      CpQueues,
      QueueVidiotron,
      Vidiotron,
      VidiotronLane,
      LanesActivityLog,
      kafkaDTTruckCountLocation,
    ]),
    TruckMovementUtilModule,
    TruckMonitorModule,
    ManagementTruckModule,
    VidiotronNotifModule,
    VideotronNotifMappingModule,
    forwardRef(() => CustomCacheModule),
    forwardRef(() => QueueVidiotronModule),
  ],
  providers: [
    LaneService,
    ValidationService,
    KafkaService,
    ErrorHandlerService,
    TrucksService,
    CustomLogger,
    MutexService,
    QueueVidiotronService,
    LuminixService,
    LuminixUtil,
    VehiclesService,
    SimpangBayahService,
    SocketClientService,
  ],
  exports: [LaneService],
  controllers: [LaneController],
})
export class LaneModule {}
