import { ErrorHandlerService } from '@utils/error-handler.service';
import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Vidiotron } from './entities/vidiotron.entity';
import { Repository } from 'typeorm';
import {
  CreateVidiotronCP,
  CreateVidiotronLane,
  UpdateCountingVidiotronLane,
  UpdateStatusVidiotronLane,
  UpdateVidiotronStaticLane,
} from './dto/vidiotron-master.dto';
import { DatabaseService } from '@utils/database.service';
import { decryptJSAES } from '@utils/functions.service';
import { ValidationService } from '@utils/validation-service';
import { VidiotronValidation } from './validation/vidiotron.validation';

@Injectable()
export class VidiotronService {
  constructor(
    @InjectRepository(Vidiotron)
    private vidiotronRepository: Repository<Vidiotron>,
    private databaseService: DatabaseService,
    private validationService: ValidationService,
    private errHandler: ErrorHandlerService,
  ) {}

  async createVidiotronCP(request: CreateVidiotronCP): Promise<any> {

    this.validationService.validate(VidiotronValidation.CREATE_UPDATE_VIDIOTRON_CP, request);

    try {
      const vidiotron = new Vidiotron();
      vidiotron.ip = request.ip;
      vidiotron.code = request.code;
      vidiotron.description = request.description;
      vidiotron.status = request.status;
      vidiotron.is_dynamic = request.is_dynamic;
      vidiotron.is_show_ads = request.is_show_ads;
      vidiotron.ads_command = request.ads_command;
      const saveVidiotron = await this.vidiotronRepository.save(vidiotron);

      await this.databaseService.query(
        'delete from vidiotron_cp where cp_id=$1',
        [request.cp_id],
      );
      await this.databaseService.query(
        'insert into vidiotron_cp (vidiotron_id, cp_id) values($1, $2)',
        [saveVidiotron.id, request.cp_id],
      );

      return {
        statusCode: 200,
        message: 'Success',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to create master data vidiotron',
      );
    }
  }

  async createVidiotronLane(request: CreateVidiotronLane): Promise<any> {

    this.validationService.validate(VidiotronValidation.CREATE_UPDATE_VIDIOTRON_LANE, request);

    try {
      const vidiotron = new Vidiotron();
      vidiotron.ip = request.ip;
      vidiotron.code = request.code;
      vidiotron.description = request.description;
      vidiotron.status = request.status;
      vidiotron.is_dynamic = request.is_dynamic;
      vidiotron.is_show_ads = request.is_show_ads;
      vidiotron.ads_command = request.ads_command;
      const saveVidiotron = await this.vidiotronRepository.save(vidiotron);

      await this.databaseService.query(
        'delete from vidiotron_lane where lane_id=$1',
        [request.lane_id],
      );
      await this.databaseService.query(
        'insert into vidiotron_lane (vidiotron_id, lane_id) values($1, $2)',
        [saveVidiotron.id, request.lane_id],
      );

      return {
        statusCode: 200,
        message: 'Success',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to create master data vidiotron',
      );
    }
  }

  async updateVidiotronCP(
    id: number,
    request: CreateVidiotronCP,
  ): Promise<any> {

    this.validationService.validate(VidiotronValidation.CREATE_UPDATE_VIDIOTRON_CP, request);

    try {
      const vidiotron = await this.vidiotronRepository.findOneBy({ id: id });

      if (!vidiotron) {
        throw new HttpException('vidiotron not found', 400);
      }

      vidiotron.ip = request.ip;
      vidiotron.code = request.code;
      vidiotron.description = request.description;
      vidiotron.status = request.status;
      vidiotron.is_dynamic = request.is_dynamic;
      vidiotron.is_show_ads = request.is_show_ads;
      vidiotron.ads_command = request.ads_command;
      const saveVidiotron = await this.vidiotronRepository.save(vidiotron);

      await this.databaseService.query(
        'delete from vidiotron_cp where vidiotron_id=$1',
        [id],
      );
      await this.databaseService.query(
        'insert into vidiotron_cp (vidiotron_id, cp_id) values($1, $2)',
        [saveVidiotron.id, request.cp_id],
      );

      return {
        statusCode: 200,
        message: 'Success',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to create master data vidiotron.',
      );
    }
  }

  async updateVidiotronLane(
    id: number,
    request: CreateVidiotronLane,
  ): Promise<any> {

    this.validationService.validate(VidiotronValidation.CREATE_UPDATE_VIDIOTRON_CP, request);

    try {
      const vidiotron = await this.vidiotronRepository.findOneBy({ id: id });

      if (!vidiotron) {
        throw new HttpException('vidiotron not found', 400);
      }

      vidiotron.ip = request.ip;
      vidiotron.code = request.code;
      vidiotron.description = request.description;
      vidiotron.status = request.status;
      vidiotron.is_dynamic = request.is_dynamic;
      vidiotron.is_show_ads = request.is_show_ads;
      vidiotron.ads_command = request.ads_command;
      const saveVidiotron = await this.vidiotronRepository.save(vidiotron);

      await this.databaseService.query(
        'delete from vidiotron_lane where vidiotron_id=$1',
        [id],
      );
      await this.databaseService.query(
        'insert into vidiotron_lane (vidiotron_id, lane_id) values($1, $2)',
        [saveVidiotron.id, request.lane_id],
      );

      return {
        statusCode: 200,
        message: 'Success',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to create master data vidiotron',
      );
    }
  }

  async getVidiotronCP(): Promise<any> {
    try {
      const vidiotrons = await this.databaseService.query(
        'select v.ip, v.code, v.description, v.status, v.is_dynamic, c.cp_id, c.cp_name ' +
          ' from vidiotron v left join vidiotron_cp vc on vc.vidiotron_id = v.id' +
          ' left join cps c on c.cp_id = vc.cp_id  where c.cp_id is not null',
        [],
      );

      return {
        statusCode: 200,
        message: 'Success',
        data: vidiotrons,
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to get master data vidiotron',
      );
    }
  }

  async getVidiotronLane(): Promise<any> {
    try {
      const vidiotrons = await this.databaseService.query(
        'select v.ip, v.code, v.description, v.status, v.is_dynamic, l.id, l.lane_name  ' +
          ' from vidiotron v left join vidiotron_lane vl on vl.vidiotron_id = v.id ' +
          ' left join lanes l on l.id = vl.lane_id where l.id is not null ',
        [],
      );

      return {
        statusCode: 200,
        message: 'Success',
        data: vidiotrons,
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to get master data vidiotron.',
      );
    }
  }

  async deleteVidiotronCP(id: number): Promise<any> {
    try {
      const v = await this.vidiotronRepository.findOneBy({ id: id });
      if (!v) {
        throw new HttpException('vidiotron not found', 400);
      }

      await this.vidiotronRepository.delete(v);
      await this.databaseService.query(
        'delete from vidiotron_cp where vidiotron_id=$1',
        [id],
      );

      return {
        statusCode: 200,
        message: 'Success',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to delete master data vidiotron.',
      );
    }
  }

  async deleteVidiotronLane(id: number): Promise<any> {
    try {
      const v = await this.vidiotronRepository.findOneBy({ id: id });
      if (!v) {
        throw new HttpException('vidiotron not found', 400);
      }

      await this.vidiotronRepository.delete(v);
      await this.databaseService.query(
        'delete from vidiotron_lane where vidiotron_id=$1',
        [id],
      );

      return {
        statusCode: 200,
        message: 'Success',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to delete master data vidiotron.',
      );
    }
  }

  async getVidiotronById(id: number): Promise<Vidiotron> {
    try {
      this.errHandler.logDebug('find vidiotron by id');
      const vidiotron = await this.vidiotronRepository.findOneBy({ id: id });
      if (!vidiotron) {
        this.errHandler.logDebug('vidiotron not found');
        return null;
      }
      this.errHandler.logDebug(`vidiotron found for id ${id}`);
      return vidiotron;
    } catch (error: any) {
      this.errHandler.logError('Ooops getVidiotronById error', error);
      return null;
    }
  }

  async changeStaticVidiotron(
    id: number,
    dto: UpdateVidiotronStaticLane,
  ): Promise<any> {
    if (!id) {
      return {
        statusCode: 404,
        Message: 'ID not found',
      };
    }
    try {
      const vidiotron = await this.vidiotronRepository.findOneBy({ id: id });
      if (!vidiotron) {
        this.errHandler.logDebug('vidiotron not found');
        return null;
      }
      if (dto.max_value > 2) {
        return {
          statusCode: 400,
          Message: 'Max value Vidiotron is 2',
        };
      }
      await this.vidiotronRepository.update(id, {
        is_dynamic: false,
        max_value: dto.max_value,
      });
      for (const queue_lane of dto.queue_lane_id) {
        const decryptID = decryptJSAES(queue_lane.lane_id);
        await this.databaseService.query(
          `INSERT INTO vidiotron_config_lane (vidiotron_id,queue_lane_id) VALUES (${id},${decryptID});`,
        );
      }
      return {
        statusCode: 200,
        Message: 'Vidiotron successfully updated to Static',
      };
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops update vidiotron error to static.',
      );
    }
  }

  async updateStatusVidiotronLane(
    id: number,
    request: UpdateStatusVidiotronLane,
  ): Promise<any> {
    try {
      const vidiotron = await this.vidiotronRepository.findOneBy({ id: id });

      if (!vidiotron) {
        throw new HttpException('vidiotron not found', 400);
      }

      await this.vidiotronRepository.update(id, {
        is_dynamic: request.is_dynamic,
      });

      return {
        statusCode: 200,
        message: 'Success Update Status Vidiotron Lane',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'failed to create master data vidiotron',
      );
    }
  }
  async updateCountingVidiotronLane(
    id: number,
    request: UpdateCountingVidiotronLane,
  ): Promise<any> {
    try {
      const vidiotron = await this.vidiotronRepository.findOneBy({ id: id });

      if (!vidiotron) {
        throw new HttpException('vidiotron not found', 400);
      }

      await this.vidiotronRepository.update(id, {
        count_geofence: request.count_geofence,
      });

      return {
        statusCode: 200,
        message: 'Success Update Counting Vidiotron Lane',
      };
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops failed to Update Counting Vidiotron Lane',
      );
    }
  }
}
