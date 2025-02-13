import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpQueueAssignmentsLogEntity } from './entities/cp_queue_assignments_log';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CpQueueAssignmentsLogEntity
    ]),
  ],
  controllers: [],
  providers: [
  ],
  //exports: [RfidService],
})
export class CpQueueAssignmentsLogModule {}
