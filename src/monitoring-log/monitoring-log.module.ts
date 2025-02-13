import { Module } from '@nestjs/common';
import { MonitoringLogService } from './monitoring-log.service';
import { MonitoringLogController } from './monitoring-log.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitoringLog } from './entities/monitoringlog.entity';

@Module({
  imports:[TypeOrmModule.forFeature([MonitoringLog])],
  providers: [MonitoringLogService],
  controllers: [MonitoringLogController]
})
export class MonitoringLogModule {}
