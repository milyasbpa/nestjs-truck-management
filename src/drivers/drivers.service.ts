import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private driverRepository: Repository<Driver>,
  ) {}

  async create(
    createDriverDto: CreateDriverDto,
  ): Promise<{ message: string; code: number }> {
    debugger;
    const driver = this.driverRepository.create(
      createDriverDto as DeepPartial<Driver>,
    );
    Logger.debug(createDriverDto);
    try {
      await this.driverRepository.save(driver);
      return { message: 'Data was saved successfully', code: 200 };
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
    const [data, total] = await this.driverRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { driver_id: 'ASC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Driver> {
    const driver = await this.driverRepository.findOneBy({ driver_id: id });
    if (!driver) throw new NotFoundException(`Driver with ID ${id} not found`);
    return driver;
  }

  async update(
    driver_id: number,
    updateDriverDto: UpdateDriverDto,
  ): Promise<Driver> {
    await this.driverRepository.update(
      driver_id,
      updateDriverDto as DeepPartial<Driver>,
    );
    return this.findOne(driver_id);
  }

  async remove(driver_id: number): Promise<void> {
    const result = await this.driverRepository.delete(driver_id);
    if (result.affected === 0)
      throw new NotFoundException(`Driver with ID ${driver_id} not found`);
  }
}
