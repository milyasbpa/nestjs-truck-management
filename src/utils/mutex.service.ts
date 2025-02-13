import { ErrorHandlerService } from './error-handler.service';
import { Injectable, Logger } from '@nestjs/common';
import { Mutex } from 'async-mutex';

@Injectable()
export class MutexService {
  private readonly mutex: Mutex = new Mutex();
  //private readonly logger = new Logger(MutexService.name);
  constructor(private readonly errHandler: ErrorHandlerService) {}
  async runLocked<T>(task: () => Promise<T>): Promise<T> {
    const release = await this.mutex.acquire();
    this.errHandler.logDebug('Lock acquired');
    try {
      return await task();
    } finally {
      release();
      this.errHandler.logDebug('Lock released');
    }
  }
}
