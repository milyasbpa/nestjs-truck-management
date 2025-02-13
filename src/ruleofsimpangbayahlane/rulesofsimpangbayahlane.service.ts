import { RulesOfSimpangBayah } from './entities/rulesofsimpangbayahlane.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { encryptJSAES } from '@utils/functions.service';
import { CreateRuleOfSimpangBayahLaneDto } from './dto/create-ruleofsimpanglane.dto';
import { UpdateRuleOfSimpangBayahLaneDto } from './dto/update-ruleofsimpanglane.dto';

@Injectable()
export class RulesOfSimpangBayahService {
  constructor(
    @InjectRepository(RulesOfSimpangBayah)
    private rulesOfSimpangBayahRepository: Repository<RulesOfSimpangBayah>,
    private readonly errorHandler: ErrorHandlerService,
  ) {}

  async create(
    createRuleOfSimpangBayahLaneDto: CreateRuleOfSimpangBayahLaneDto,
    metadata: Record<string, any>,
  ): Promise<any> {
    const ruleSBL = this.rulesOfSimpangBayahRepository.create(
      createRuleOfSimpangBayahLaneDto,
    );
    try {
      const rs = await this.rulesOfSimpangBayahRepository.save(ruleSBL);
      await this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'create',
        'info',
        JSON.stringify(rs) + ' : saved sucessfully',
        metadata != null ? JSON.stringify(metadata) : null,
      );
      return {
        code: 200,
        message: 'Data was saved successfully',
      };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'create',
        'error',
        error,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async findAllPaginated(
    page: number = 1,
    limit: number = 10,
    metadata: Record<string, any>,
  ) {
    const [data, total] = await this.rulesOfSimpangBayahRepository.findAndCount(
      {
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'DESC' },
      },
    );
    await this.errorHandler.saveLogToDB(
      'crud-ruleofsimpah_bayah',
      'find-all-pagination',
      'info',
      data != null ? JSON.stringify(data) : null,
      metadata != null ? JSON.stringify(metadata) : null,
    );
    const lists = data.map((row) => ({
      ...row,
      id: encryptJSAES(row.id.toString()),
      lane_id: encryptJSAES(row.lane_id.toString()),
    }));
    return {
      lists,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
  async findAll(metadata: Record<string, any>): Promise<any> {
    try {
      const results = await this.rulesOfSimpangBayahRepository.find();
      const lists = results.map((row) => ({
        ...row,
        id: encryptJSAES(row.id.toString()),
      }));
      await this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'find-all',
        'info',
        lists != null ? JSON.stringify(lists) : null,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      return { statusCode: 200, data: lists };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'find-all',
        'error',
        error,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }
  async findOne(id: number, metadata: Record<string, any>): Promise<any> {
    const ruleSBL = await this.rulesOfSimpangBayahRepository.findOneBy({
      id: id,
    });
    const custom_ruleSBL = {
      ...ruleSBL,
      id: encryptJSAES(ruleSBL.id.toString()),
      lane_id: encryptJSAES(ruleSBL.lane_id.toString()),
    };

    await this.errorHandler.saveLogToDB(
      'crud-ruleofsimpah_bayah',
      'find-all',
      'info',
      ruleSBL != null ? JSON.stringify(custom_ruleSBL) : null,
      metadata != null ? JSON.stringify(metadata) : null,
    );

    if (!custom_ruleSBL) {
      return { statusCode: 200, data: null };
    }
    return { statusCode: 200, data: custom_ruleSBL };
  }
  async findByLaneId(id: number, metadata: Record<string, any>): Promise<any> {
    const ruleSBL = await this.rulesOfSimpangBayahRepository.findBy({
      lane_id: id,
      is_deleted: false,
    });
    const list = ruleSBL.map((row) => ({
      ...row,
      id: encryptJSAES(String(row.id)),
      lane_id: encryptJSAES(String(row.lane_id)),
    }));
    await this.errorHandler.saveLogToDB(
      'crud-ruleofsimpah_bayah',
      'find-by-lane-id',
      'info',
      ruleSBL != null ? JSON.stringify(id.toString()) : null,
      metadata != null ? JSON.stringify(metadata) : null,
    );
    if (!ruleSBL) {
      return { statusCode: 200, data: null };
    }
    return { statusCode: 200, data: list };
  }
  async update(
    id: number,
    updateRuleOfSimpangBayahLaneDto: UpdateRuleOfSimpangBayahLaneDto,
    metadata: Record<string, any>,
  ): Promise<any> {
    try {
      const rs = await this.rulesOfSimpangBayahRepository.update(
        id,
        updateRuleOfSimpangBayahLaneDto,
      );
      await this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'update',
        'info',
        JSON.stringify(rs) + ' : saved sucessfully',
        metadata != null ? JSON.stringify(metadata) : null,
      );

      return {
        statusCode: 200,
        message: 'Data was saved successfully',
      };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'update',
        'error',
        error,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async remove(id: number, metadata: Record<string, any>): Promise<any> {
    try {
      const rs = await this.rulesOfSimpangBayahRepository.update(
        {
          id: id,
        },
        {
          is_deleted: true,
        },
      );
      await this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'delete',
        'error',
        JSON.stringify(rs),
        metadata != null ? JSON.stringify(metadata) : null,
      );
      if (rs.affected === 0)
        throw new NotFoundException(`Data with ID ${id} not found`);
      return {
        statusCode: 200,
        message: 'Data was delete successfully',
      };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'crud-ruleofsimpah_bayah',
        'delete',
        'error',
        error,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to delete.',
      );
    }
  }
 
}
