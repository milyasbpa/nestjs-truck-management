import { forwardRef, Module } from '@nestjs/common';
import { SimpangBayahService } from './simpangbayah.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CpQueueAssignment } from 'src/jobs/entities/cpqueueassignments.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { LaneModule } from 'src/lane/lane.module';
@Module({
  imports: [
    forwardRef(() => LaneModule),
    TypeOrmModule.forFeature([CpQueueAssignment]),
  ],
  providers: [SimpangBayahService, ErrorHandlerService, CustomLogger],
  exports: [SimpangBayahService],
})
export class SimpangBayahModule {}
