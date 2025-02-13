import { RulesOfSimpangBayah } from './../ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VidiotronNotif } from './entities/vidiotron-notif.entity';
import { VidiotronNotifService } from './vidiotron-notif.service';
import { VidiotronNotifController } from './vidiotron-notif.controller';
import { Vidiotron } from './entities/vidiotron.entity';
import { VidiotronController } from './vidiotron.controller';
import { VidiotronService } from './vidiotron.service';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { Lanes } from 'src/lane/entities/lane.entity';
import { Cps } from 'src/jobs/entities/cps.entity';
import { CpQueueAssignment } from 'src/jobs/entities/cpqueueassignments.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { CustomLogger } from '@utils/custom-logger.service';
import { ConsumerLogs } from 'src/kafka/entities/consumer-logs';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { QueueVidiotron } from './entities/vidiotron-queue.entity';
import { LuminixUtil } from '../luminix/luminix.util';
import { ValidationService } from '@utils/validation-service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QueueLaneRules,
      ConsumerLogs,
      RulesOfSimpangBayah,
      CpQueueAssignment,
      RuleLaneCp,
      RuleOfCp,
      Trucks,
      Lanes,
      Cps,
      VidiotronNotif,
      Vidiotron,
      QueueVidiotron,
    ]),
  ],
  controllers: [VidiotronNotifController, VidiotronController],
  providers: [
    VidiotronNotifService,
    ErrorHandlerService,
    CustomLogger,
    VidiotronService,
    LuminixUtil,
    ValidationService,
  ],
  exports: [VidiotronNotifService],
})
export class VidiotronNotifModule {}
