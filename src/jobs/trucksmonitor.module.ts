import { ErrorHandlerService } from './../utils/error-handler.service';
import { forwardRef, Module } from '@nestjs/common';
import { TruckMonitoringService } from './trucksmonitor.service';
import { QueueLaneModule } from 'src/queue_lane/queue.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { VideotronNotifMappingModule } from 'src/vidiotron-notif/videotro-notif-mapping.module';
import { CustomLogger } from '@utils/custom-logger.service';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { CpQueueAssignment } from './entities/cpqueueassignments.entity';
import { SimpangBayahModule } from 'src/services/simpangbayah.module';
import { MutexService } from '@utils/mutex.service';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { VidiotronNotif } from '../vidiotron-notif/entities/vidiotron-notif.entity';
import { LuminixUtil } from '../luminix/luminix.util';
import { QueueVidiotron } from '../vidiotron-notif/entities/vidiotron-queue.entity';
@Module({
  imports: [
    forwardRef(() => QueueLaneModule),
    forwardRef(() => VideotronNotifMappingModule),
    forwardRef(() => CustomCacheModule),
    forwardRef(() => SimpangBayahModule),
    TypeOrmModule.forFeature([QueueLaneRules,CpQueueAssignment, VidiotronNotif, QueueVidiotron]),
  ],
  providers: [
    TruckMonitoringService,
    QueueLaneRules,
    ErrorHandlerService,
    CustomLogger,
    MutexService,
    VidiotronNotifService,
    LuminixUtil,
  ],

  exports: [TruckMonitoringService],
})
export class TruckMonitorModule {}
