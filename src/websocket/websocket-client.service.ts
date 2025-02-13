import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { io, Socket } from 'socket.io-client';

@Injectable()
export class SocketClientService implements OnModuleInit, OnModuleDestroy {
  private socket: Socket;

  // Inject ErrorHandlerService (which uses CustomLogger)
  constructor(private readonly errorHandlerService: ErrorHandlerService) {
    this.socket = io(process.env.WEBSOCKET_HOST); // Ensure WEBSOCKET_HOST is set

    this.socket.on('connect', () => {
      try {
        this.errorHandlerService.logInfo(
          `Connected to WebSocket server with ID: ${this.socket.id}`,
        );
      } catch (e) {
        this.errorHandlerService.logError('Error in connect event:', e);
      }
    });

    this.socket.on('disconnect', () => {
      try {
        this.errorHandlerService.logInfo(
          `Disconnected from WebSocket server with ID: ${this.socket.id}`,
        );
      } catch (e) {
        this.errorHandlerService.logError('Error in disconnect event:', e);
      }
    });
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public emit(event: string, data: any): void {
    try {
      this.socket.emit(event, data);
      this.errorHandlerService.logInfo(
        `Emitting event: ${event}, Data: ${JSON.stringify(data)}`,
      );
    } catch (e) {
      this.errorHandlerService.logError(`Error emitting event ${event}:`, e);
    }
  }

  public on(event: string, callback: (...args: any[]) => void): void {
    try {
      this.socket.on(event, callback);
      this.errorHandlerService.logInfo(`Listening for event: ${event}`);
    } catch (e) {
      this.errorHandlerService.logError(
        `Error listening for event ${event}:`,
        e,
      );
    }
  }

  onModuleInit() {
    this.errorHandlerService.logInfo('SocketClientService initialized');
  }

  onModuleDestroy() {
    this.errorHandlerService.logInfo('Closing socket connection');
    this.socket.disconnect();
  }
}
