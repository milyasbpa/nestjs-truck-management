import { ErrorHandlerService } from '@utils/error-handler.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trucks } from './entities/trucks.entity';
import { CreateTrucksDto } from './dto/create-trucks.dto';
import { UpdateTrucksDto } from './dto/update-trucks.dto';

@Injectable()
export class TrucksService {
  constructor(
    @InjectRepository(Trucks)
    private trucksRepository: Repository<Trucks>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async create(createTrucksDto: CreateTrucksDto): Promise<any> {
    const trucks = this.trucksRepository.create(createTrucksDto);
    try {
      await this.trucksRepository.save(trucks);
      return { message: 'Data was saved successfully', statusCode: 200 };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, error);
    }
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.trucksRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Trucks> {
    const trucks = await this.trucksRepository.findOneBy({ id: id });
    if (!trucks) throw new NotFoundException(`Truck with ID ${id} not found`);
    return trucks;
  }

  async update(id: number, updateTrucksDto: UpdateTrucksDto): Promise<any> {
    try {
      await this.trucksRepository.update(id, updateTrucksDto);
      return { message: 'Data was saved successfully', statusCode: 200 };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
    // return this.findOne(id);
  }

  async remove(id: number): Promise<any> {
    try {
      const result = await this.trucksRepository.delete(id);
      if (result.affected === 0) {
        return { message: `Truck with ID ${id} not found`, statusCode: 200 };
      } else {
        return {
          message: `Truck with ID ${id} deleted successfully`,
          statusCode: 200,
        };
      }
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to delete.',
      );
    }
  }
}
