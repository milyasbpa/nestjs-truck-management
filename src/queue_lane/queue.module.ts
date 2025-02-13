import { Module } from '@nestjs/common';
import { QueueLaneController } from './queue_lane.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { ValidationService } from '@utils/validation-service';
import { QueueLaneService } from './queue_lane.service';
import { QueueLane } from './entities/queue_lane.entity';
import { QueueLaneRules } from './entities/queue_lane_rule.entity';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { Vidiotron } from 'src/vidiotron-notif/entities/vidiotron.entity';
import { VidiotronLane } from 'src/vidiotron-notif/entities/vidiotron-lane.entity';
import { QueueLanesActivityLog } from './entities/queue_lanes_activity_log.entity';
import { RulesLaneQueueLane } from './entities/rule_lane_queue_lane.entity';
import { Lanes } from 'src/lane/entities/lane.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      QueueLane,
      QueueLaneRules,
      RuleLaneCp,
      Vidiotron,
      VidiotronLane,
      QueueLanesActivityLog,
      RulesLaneQueueLane,
      Lanes,
    ]),
  ],
  providers: [
    QueueLaneService,
    ErrorHandlerService,
    CustomLogger,
    ValidationService,
  ],
  controllers: [QueueLaneController],
})
export class QueueLaneModule {}
