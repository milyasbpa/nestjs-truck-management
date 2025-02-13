import { TruckHistoryService } from './../../history/truck_history_cp/truck_history_cp.service';
import { forwardRef, Module } from '@nestjs/common';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { DeviceSBService } from './device_sb.services';
import { DeviceSBController } from './device_sb.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { SimpangBayahService } from 'src/services/simpangbayah.service';
import { MutexService } from '@utils/mutex.service';
import { VidiotronNotifModule } from 'src/vidiotron-notif/vidiotron-notif.module';
import { TruckMonitorModule } from 'src/jobs/trucksmonitor.module';
import { CpQueueAssignment } from 'src/jobs/entities/cpqueueassignments.entity';
import { LaneModule } from 'src/lane/lane.module';
import { LaneService } from 'src/lane/lane.service';
import { Lanes } from 'src/lane/entities/lane.entity';
import { Cps } from 'src/jobs/entities/cps.entity';
import { RulesOfSimpangBayah } from 'src/ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { ValidationService } from '@utils/validation-service';
import { TrucksService } from 'src/trucks/trucks.service';
import { KafkaService } from '../kafka.service';
import { LanesActivityLog } from 'src/lane/entities/lanes_activity_log.entity';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { TruckMovementUtil } from './truck-movement.util';
import { ManagementTruckService } from 'src/services/management_truck.service';
import { LuminixService } from 'src/luminix/luminix.service';
import { ConsumerLogs } from '../entities/consumer-logs';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';
import { LuminixUtil } from 'src/luminix/luminix.util';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
import { Vidiotron } from 'src/vidiotron-notif/entities/vidiotron.entity';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { VideotroNotifMappingService } from 'src/vidiotron-notif/videotro-notif-mapping.service';
import { VidiotronNotif } from 'src/vidiotron-notif/entities/vidiotron-notif.entity';
import { VidiotronService } from 'src/vidiotron-notif/vidiotron.service';
import { CpQLogService } from 'src/cp-queue-assignments-log/cpQueueAssignmentsLog.service';
import { CpQueueAssignmentsLogEntity } from 'src/cp-queue-assignments-log/entities/cp_queue_assignments_log';
import { TruckHistoryCpEntity } from 'src/history/truck_history_cp/entities/truck_history_cp.entities';
import { CpQueueAssignmentsEntity } from 'src/services/entities/cpQueueAssignment.entities.entity';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QueueLaneRules,
      CpQueueAssignment,
      Lanes,
      Cps,
      RulesOfSimpangBayah,
      RuleLaneCp,
      RuleOfCp,
      LanesActivityLog,
      Trucks,
      ConsumerLogs,
      kafkaDTTruckCountLocation,
      Vidiotron,
      QueueVidiotron,
      VidiotronNotif,
      CpQueueAssignmentsLogEntity,
      TruckHistoryCpEntity,
      CpQueueAssignmentsEntity,
    ]),
    forwardRef(() => VidiotronNotifModule),
    forwardRef(() => TruckMonitorModule),
    forwardRef(() => LaneModule),
  ],

  providers: [
    DeviceSBService,
    ErrorHandlerService,
    CustomLogger,
    LaneService,
    SimpangBayahService,
    MutexService,
    ValidationService,
    TrucksService,
    KafkaService,
    TruckMovementUtil,
    ManagementTruckService,
    LuminixService,
    QueueVidiotronService,
    LuminixUtil,
    VehiclesService,
    Vidiotron,
    VideotroNotifMappingService,
    VidiotronService,
    CpQLogService,
    TruckHistoryService,
    SocketClientService,
  ],
  exports: [DeviceSBService],
  controllers: [DeviceSBController],
})
export class DeviceSBModule {}
