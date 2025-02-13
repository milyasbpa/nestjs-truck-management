import { forwardRef, Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { EncryptionService } from 'src/utils/crypto.service';
import { SimpangBayahService } from './simpangbayah.service';
import { CpQueueAssignmentService } from './cpQueueAssignmet.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { ManagementTruckService } from './management_truck.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpQueueAssignment } from 'src/jobs/entities/cpqueueassignments.entity';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { LaneService } from 'src/lane/lane.service';
import { LaneModule } from 'src/lane/lane.module';

@Module({
  imports: [
    forwardRef(()=>LaneModule),
    TypeOrmModule.forFeature([
      CpQueueAssignment,
      QueueLaneRules,
    ]),
  ],
  providers: [
    EncryptionService,
    SimpangBayahService,
    CpQueueAssignmentService,
    ErrorHandlerService,
    CustomLogger,
    ManagementTruckService,
  ],
  //exports: [SimpangBayahService, ManagementTruckService],
  controllers: [ServicesController],
})
export class ServicesModule {}
