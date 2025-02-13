import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Port } from './entities/port.entity';
import { CreatePortDto } from './dto/create-port.dto';
import { UpdatePortDto } from './dto/update-port.dto';

@Injectable()
export class PortService {
  constructor(
    @InjectRepository(Port)
    private portRepository: Repository<Port>,
  ) {}
  async create(createPortDto: CreatePortDto): Promise<any> {
    const port = this.portRepository.create(createPortDto);
    Logger.debug(createPortDto);
    try {
      await this.portRepository.save(port);
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
    const [data, total] = await this.portRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Port> {
    const port = await this.portRepository.findOneBy({ id: id });
    if (!port) throw new NotFoundException(`Port with ID ${id} not found`);
    return port;
  }

  async update(id: number, updatePortDto: UpdatePortDto): Promise<Port> {
    await this.portRepository.update(id, updatePortDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.portRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Port with ID ${id} not found`);
  }
}
