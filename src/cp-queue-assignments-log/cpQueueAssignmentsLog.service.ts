import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentLogCreate } from './dto/cp-queue-assignments-log';
import { CpQueueAssignmentsLogEntity } from './entities/cp_queue_assignments_log';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { error } from 'console';
@Injectable()
export class CpQLogService {
  constructor(
    @InjectRepository(CpQueueAssignmentsLogEntity)
    private readonly CpQLogRepository: Repository<CpQueueAssignmentsLogEntity>,
    private readonly errHandler: ErrorHandlerService,
  ) {}

  async create(request: AssignmentLogCreate): Promise<any> {
    try {
      this.errHandler.logDebug('insert data log');
      await this.CpQLogRepository.insert(request);
    } catch (err: any) {
      this.errHandler.throwBadRequestError(error, 'CpQLogService create error');
    }
  }
}
