import {  Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { VideotronNotifMappingModule } from 'src/vidiotron-notif/videotro-notif-mapping.module';
import { TrucksToCOPService } from './trucksToCOP.service';
import { TrucksService } from 'src/trucks/trucks.service';
import { TrucksModule } from 'src/trucks/trucks.module';
import { Cps } from './entities/cps.entity';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { CpQueues } from './entities/cp_queues.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([QueueLaneRules, Cps, Trucks, CpQueues]),
    VideotronNotifMappingModule,
    TrucksModule,
  ],
  providers: [
    TrucksToCOPService,
    TrucksService,
    ErrorHandlerService,
    CustomLogger,
  ],
  exports: [TrucksToCOPService],
})
export class TruckToCOPModule {}
