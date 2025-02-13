import { UpdateMonitoringLogDto } from './dto/update-monitoringlog.dto';
import { CreateMonitoringLogDto } from './dto/create-monitoringlog.dto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MonitoringLog } from './entities/monitoringlog.entity';
import { Repository } from 'typeorm';

@Injectable()
export class MonitoringLogService {
  constructor(
    @InjectRepository(MonitoringLog)
    private readonly monitoringLogRepository: Repository<MonitoringLog>,
  ) {}
  async create(
    createMonitoringLogDto: CreateMonitoringLogDto,
  ): Promise<any> {
    // eslint-disable-next-line prettier/prettier
    const monitoringLog = this.monitoringLogRepository.create(createMonitoringLogDto);
    try {
      await this.monitoringLogRepository.save(monitoringLog);
      return { message: 'Data was saved successfully', statusCode: 200 };
    } catch (error) {
      Logger.error(
        `Data was failed to save:${error.message}`,
        error.stack,
        error.code,
      );
      throw new BadRequestException({
        message: 'Data was failed to save',
        code: error.code,
      });
    }
  }
  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.monitoringLogRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { log_id: 'ASC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(log_id: string): Promise<MonitoringLog> {
    const monitoringLog = await this.monitoringLogRepository.findOneBy({
      log_id
    });
    if (!monitoringLog)
      throw new NotFoundException(`Driver with ID ${log_id} not found`);
    return monitoringLog;
  }

  async update(
    log_id: string,
    updateMonitoringLogDto: UpdateMonitoringLogDto,
  ): Promise<MonitoringLog> {
    await this.monitoringLogRepository.update(log_id, updateMonitoringLogDto);
    return this.findOne(log_id);
  }

  async remove(log_id: string): Promise<void> {
    const result = await this.monitoringLogRepository.delete(log_id);
    if (result.affected === 0)
      throw new NotFoundException(`Driver with ID ${log_id} not found`);
  }
}
