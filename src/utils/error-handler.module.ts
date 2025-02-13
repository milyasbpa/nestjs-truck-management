import { Module } from '@nestjs/common';
import { ErrorHandlerService } from './error-handler.service';
import { CustomLogger } from './custom-logger.service';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Module({
  providers: [ErrorHandlerService, CustomLogger, SocketClientService],
  controllers: [],
  exports: [ErrorHandlerService, CustomLogger],
})
export class ErrorHandlerModule {}
