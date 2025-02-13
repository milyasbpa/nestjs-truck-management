import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateReroutePlanDto } from './dto/create-rerouteplan.dto';
import { ReroutePlan } from './entities/rerouteplans.entity';
import { UpdateReroutePlanDto } from './dto/update-rerouteplan.dto';

@Injectable()
export class ReroutePlanService {
  constructor(
    @InjectRepository(ReroutePlan)
    private readonly reroutePlanRepository: Repository<ReroutePlan>,
  ) {}

  async create(
    createReroutePlanDto: CreateReroutePlanDto,
  ): Promise<any> {
    const rplan = this.reroutePlanRepository.create(createReroutePlanDto);
    Logger.debug(rplan);
    try {
      await this.reroutePlanRepository.save(rplan);
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
    const [data, total] = await this.reroutePlanRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { reroute_id: 'DESC' },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<ReroutePlan> {
    const rplan = await this.reroutePlanRepository.findOneBy({
      reroute_id: id,
    });
    if (!rplan) throw new NotFoundException(`Driver with ID ${id} not found`);
    return rplan;
  }

  async update(
    id: number,
    updateReroutePlanDto: UpdateReroutePlanDto,
  ): Promise<ReroutePlan> {
    const reroute_id = id;
    await this.reroutePlanRepository.update(reroute_id, updateReroutePlanDto);
    return this.findOne(reroute_id);
  }

  async remove(id: number): Promise<void> {
    const result = await this.reroutePlanRepository.delete({ reroute_id: id });
    if (result.affected === 0)
      throw new NotFoundException(`Driver with ID ${id} not found`);
  }
}
