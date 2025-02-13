import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Routes } from './entities/routes.entity';
import { Repository } from 'typeorm';
import { CreateRoutesDto } from './dto/create-routes.dto';
import { UpdateRoutesDto } from './dto/update-routes.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Routes)
    private routesRepository: Repository<Routes>,
  ) {}

  async create(
    createRoutesDto: CreateRoutesDto,
  ): Promise<any> {
    const routes = this.routesRepository.create(createRoutesDto);
    Logger.debug(createRoutesDto);
    try {
      await this.routesRepository.save(routes);
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
    const [data, total] = await this.routesRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { route_id: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Routes> {
    const driver = await this.routesRepository.findOneBy({ route_id: id });
    if (!driver) throw new NotFoundException(`Driver with ID ${id} not found`);
    return driver;
  }

  async update(id: number, updateRoutesDto: UpdateRoutesDto): Promise<Routes> {
    await this.routesRepository.update(id, updateRoutesDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.routesRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Driver with ID ${id} not found`);
  }
}

