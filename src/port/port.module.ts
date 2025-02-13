import { Module } from '@nestjs/common';
import { PortService } from './port.service';
import { PortController } from './port.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Port } from './entities/port.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Port])],
  providers: [PortService],
  controllers: [PortController]
})
export class PortModule {}
