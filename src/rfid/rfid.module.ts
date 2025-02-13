import { Module, forwardRef } from '@nestjs/common';
import { RfidController } from './rfid.controller';
import { RfidService } from './rfid.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RfidReaderIn } from './entities/rfid-reader-in.entity';
import { RfidReaderOut } from './entities/rfid-reader-out.entity';
import { RfidTransaction } from './entities/rfid-transaction.entity';
import { CpQueueAssignment } from '../jobs/entities/cpqueueassignments.entity';
import { ValidationService } from '@utils/validation-service';
import { Trucks } from '../trucks/entities/trucks.entity';
import { CpDevices } from 'src/cp/entities/cp_devices.entity';
import { CpDetail } from 'src/jobs/entities/cp_details.entity';
import { Lanes } from 'src/lane/entities/lane.entity';
import { Cps } from 'src/jobs/entities/cps.entity';
import { RulesOfSimpangBayah } from 'src/ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { VidiotronNotifService } from 'src/vidiotron-notif/vidiotron-notif.service';
import { VidiotronNotif } from 'src/vidiotron-notif/entities/vidiotron-notif.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { ConsumerLogs } from '../kafka/entities/consumer-logs';
import { LaneModule } from 'src/lane/lane.module';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { RfidAnomaly } from './entities/rfid-anomaly.entity';
import { RfidThreshold } from './entities/rfid-threshold.entity';
import { RfidTransactionArchieve } from './entities/rfid-transaction-archive.entity';
import { CpLog } from 'src/jobs/entities/cp_logs.entity';
import { RfidCpQueue } from './entities/rfid-cp-queue.entity';
import { QueueVidiotron } from '../vidiotron-notif/entities/vidiotron-queue.entity';
import { LuminixUtil } from '../luminix/luminix.util';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
import { TruckHistoryService } from 'src/history/truck_history_cp/truck_history_cp.service';
import { TruckHistoryCpEntity } from 'src/history/truck_history_cp/entities/truck_history_cp.entities';
import { CpQueueAssignmentsEntity } from 'src/services/entities/cpQueueAssignment.entities.entity';
import { CpQLogService } from 'src/cp-queue-assignments-log/cpQueueAssignmentsLog.service';
import { CpQueueAssignmentsLogEntity } from 'src/cp-queue-assignments-log/entities/cp_queue_assignments_log';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Module({
  imports: [
    forwardRef(() => LaneModule),
    TypeOrmModule.forFeature([
      RfidAnomaly,
      RfidThreshold,
      RfidReaderIn,
      RfidReaderOut,
      RfidTransaction,
      RfidTransactionArchieve,
      CpDevices,
      CpDetail,
      CpQueueAssignment,
      Trucks,
      Lanes,
      Cps,
      RulesOfSimpangBayah,
      CpQueueAssignment,
      RuleLaneCp,
      RuleOfCp,
      VidiotronNotif,
      ConsumerLogs,
      QueueLaneRules,
      CpLog,
      RfidCpQueue,
      QueueVidiotron,
      kafkaDTTruckCountLocation,
      TruckHistoryCpEntity,
      CpQueueAssignmentsEntity,
      CpQueueAssignmentsLogEntity
    ]),
  ],
  controllers: [RfidController],
  providers: [
    RfidService,
    ValidationService,
    VidiotronNotifService,
    LuminixUtil,
    ErrorHandlerService,
    CustomLogger,
    TruckHistoryService,
    CpQLogService,
    SocketClientService

  ],
  //exports: [RfidService],
})
export class RfidModule {}
