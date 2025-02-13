import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { ErrorHandlerModule } from '@utils/error-handler.module';
import { TruckHistoryService } from './truck_history_cp.service';
import { TruckHistoryCpEntity } from './entities/truck_history_cp.entities';
import { CpQueueAssignmentsEntity } from 'src/services/entities/cpQueueAssignment.entities.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TruckHistoryCpEntity, CpQueueAssignmentsEntity]),
  ],
  providers: [TruckHistoryService, ErrorHandlerModule],
  exports: [TruckHistoryService],
})
export class TruckHistoryModule {}
