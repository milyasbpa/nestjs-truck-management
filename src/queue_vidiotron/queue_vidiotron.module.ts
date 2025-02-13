import { Module } from '@nestjs/common';
import { QueueVidiotronController } from './queue_vidiotron.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VidiotronNotif } from 'src/vidiotron-notif/entities/vidiotron-notif.entity';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { QueueVidiotronService } from './queue_vidiotron.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';

@Module({
  imports: [TypeOrmModule.forFeature([VidiotronNotif, QueueVidiotron])],
  providers: [QueueVidiotronService, ErrorHandlerService,CustomLogger],
  controllers: [QueueVidiotronController],
})
export class QueueVidiotronModule {}
