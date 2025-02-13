import { ScheduleModule } from '@nestjs/schedule';
import { JobService } from './job.service';
import { Module, forwardRef } from '@nestjs/common';
import { JobController } from './job.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronSchedule } from './entities/cronschedule.entity';
import { StreetsModule } from 'src/streets/streets.module';
import { EncryptionService } from '@utils/crypto.service';
import { LastTruckMovement } from './entities/truckmovement.entity';
import { CpQueueAssignment } from './entities/cpqueueassignments.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { Cps } from './entities/cps.entity';
import { TrucksService } from '../trucks/trucks.service';
import { Trucks } from '../trucks/entities/trucks.entity';
import { CPStatusService } from './cpstatus.services';
import { CpDetail } from './entities/cp_details.entity';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { VidiotronNotif } from '../vidiotron-notif/entities/vidiotron-notif.entity';
import { LaneService } from '../lane/lane.service';
import { ValidationService } from '@utils/validation-service';
import { Lanes } from '../lane/entities/lane.entity';
import { RulesOfSimpangBayah } from '../ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { CpDevices } from 'src/cp/entities/cp_devices.entity';
import { CpUnits } from 'src/cp/entities/cp_units.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { CpModule } from 'src/cp/cp.module';
import { KafkaService } from 'src/kafka/kafka.service';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { Vidiotron } from '../vidiotron-notif/entities/vidiotron.entity';
import { LuminixService } from '../luminix/luminix.service';
import { TruckMovementUtil } from '../kafka/util/truck-movement.util';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { CpDevicesLog } from 'src/cp/entities/cp_devices_log';
import { ConsumerLogs } from '../kafka/entities/consumer-logs';
import { VideotroNotifMappingService } from 'src/vidiotron-notif/videotro-notif-mapping.service';
import { TruckMonitorModule } from './trucksmonitor.module';
import { TruckToCPModule } from './truckToCP.module';
import { GeofencesModule } from './geofences.module';
import { ManagementTruckModule } from 'src/services/management_truck.module';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { VidiotronService } from '../vidiotron-notif/vidiotron.service';
import { CpQueues } from './entities/cp_queues.entity';
import { SimpangBayahModule } from 'src/services/simpangbayah.module';
import { MutexService } from '@utils/mutex.service';
import { CpTonages } from 'src/cp/entities/cp_tonages';
import { CpTonagesLog } from 'src/cp/entities/cp_tonages_log';
import { TruckToCOPModule } from './truckToCOP.module';
import { DeviceSBModule } from 'src/kafka/util/device_sb.module';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { QueueVidiotronModule } from 'src/queue_vidiotron/queue_vidiotron.module';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';
import { LuminixUtil } from '../luminix/luminix.util';
import { LanesActivityLog } from 'src/lane/entities/lanes_activity_log.entity';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
import { SocketClientService } from 'src/websocket/websocket-client.service';

//import { QueryLoaderService } from '@utils/query-loader.service';

@Module({
  imports: [
    forwardRef(() => SimpangBayahModule),
    forwardRef(() => QueueVidiotronModule),

    TypeOrmModule.forFeature([
      CronSchedule,
      LastTruckMovement,
      CpQueueAssignment,
      Cps,
      CpDetail,
      Trucks,
      VidiotronNotif,
      Lanes,
      RulesOfSimpangBayah,
      Cps,
      CpDevices,
      CpUnits,
      RuleOfCp,
      RuleLaneCp,
      Vidiotron,
      QueueLaneRules,
      CpDevicesLog,
      ConsumerLogs,
      CpQueues,
      CpTonages,
      CpTonagesLog,
      QueueVidiotron,
      LanesActivityLog,
      kafkaDTTruckCountLocation,
    ]),
    ScheduleModule.forRoot(),
    StreetsModule,
    CpModule,
    TruckMonitorModule,
    TruckToCPModule,
    TruckToCOPModule,
    GeofencesModule,
    ManagementTruckModule,
    forwardRef(() => CustomCacheModule),
    forwardRef(() => DeviceSBModule),
    // forwardRef(()=>EventModule),
  ],
  providers: [
    JobService,
    EncryptionService,
    CustomLogger,
    VehiclesService,
    CPStatusService,
    ErrorHandlerService,
    LuminixService,
    VideotroNotifMappingService,
    TrucksService,
    VidiotronNotifService,
    LaneService,
    ValidationService,
    KafkaService,
    TruckMovementUtil,
    VidiotronService,
    MutexService,
    QueueVidiotronService,
    LuminixUtil,
    SocketClientService,
  ],
  controllers: [JobController],
  exports: [JobService],
})
export class JobModule {}
