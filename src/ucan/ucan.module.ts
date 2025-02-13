import { Module } from '@nestjs/common';
import { UcanController } from './ucan.controller';
import { UcanService } from './ucan.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trucks } from 'src/trucks/entities/trucks.entity';
import { Ucan } from './entities/ucan.entities';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trucks, Ucan]), // Register entities here
  ],
  controllers: [UcanController],
  providers: [
    UcanService,
    ErrorHandlerService,
    CustomLogger,
    SocketClientService,
  ],
})
export class UcanModule {}
