import { Injectable, Logger } from '@nestjs/common';
import { Cctv } from './entities/cctv.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCctvDto } from './dto/create-cctv.dto';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class CctvService {
  constructor(
    @InjectRepository(Cctv)
    private readonly cctvRepository: Repository<Cctv>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async create(createCctvDto: CreateCctvDto): Promise<any> {
    const cctv = this.cctvRepository.create(createCctvDto);
    Logger.debug(createCctvDto);
    try {
      await this.cctvRepository.save(cctv);
      return { message: 'Data was saved successfully', statusCode: 200 };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save');
    }
  }

  async findAll(
    page: number = 1,
  ): Promise<{ data: Cctv[]; total: number; page: number }> {
    const take = 10;
    const [data, total] = await this.cctvRepository.findAndCount({
      take,
      skip: (page - 1) * take,
    });
    return { data, total, page };
  }

  async findOne(id: number): Promise<Cctv> {
    return await this.cctvRepository.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Cctv>): Promise<any> {
    try {
      await this.cctvRepository.update(id, data);
      //this.findOne(id);
      return { message: 'Data was saved successfully', statusCode: 200 };
    } catch (error) {
      Logger.error(
        `Data was failed to save:${error.message}`,
        error.stack,
        error.code,
      );
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save');
    }
  }

  async remove(id: number): Promise<any> {
    try {
      await this.cctvRepository.delete(id);
      return { message: 'Data was deleted successfully', statusCode: 200 };
    } catch (error) {
      Logger.error(
        `Data was failed to delete:${error.message}`,
        error.stack,
        error.code,
      );
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save');
    }
  }
}
