import { DatabaseService } from '@utils/database.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { CustomLogger } from './custom-logger.service';
import { generateErrorCode } from './functions.service';
import { QueryLoaderService } from './query-loader.service';

@Injectable()
export class ErrorHandlerService {
  private readonly queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private readonly logger: CustomLogger,
    private readonly databaseService: DatabaseService,
  ) {}
  throwBadRequestError(error, msg): void {
    const err = generateErrorCode();
    this.logger.error(`msg:${error.message}. Error Code:${err}`, error.stack);
    try{
      throw new BadRequestException({
        statusCode: err,
        message: msg,
      });
    }catch(e){}
  }
  logDebug(msg: string): void {
    try{
      this.logger.debug(msg);
    }catch(e){}
  }
  logInfo(msg: string): void {
    try{
    this.logger.log(msg);
    }catch(e){}

  }
  logError(msg: string, err): void {
    try{
      this.logger.error(msg, err.stack);
    }catch(e){}
  }
  async saveLogToDB(
    log_name: string,
    event_type: string,
    log_level: string,
    message: string,
    metadata: string,
  ): Promise<void> {
    try {
      const q = this.queryLoader.getQueryById('logs.app_process');
      await this.databaseService.query(q, [
        log_name,
        event_type,
        log_level,
        message,
        metadata,
      ]);
    } catch (err) {
      this.logError('Error Logs.app_process saved to db', err);
    }
  }
}
