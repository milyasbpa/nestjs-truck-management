import { ErrorHandlerService } from '@utils/error-handler.service';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Not, Repository } from 'typeorm';
import { Lanes } from './entities/lane.entity';
import { CreateLaneDto } from './dto/create-lane.dto';
import { UpdateLaneDto } from './dto/update-lane.dto';
import {
  decryptJSAES,
  encryptJSAES,
  generateRandomString,
  stringToBoolean,
} from '@utils/functions.service';
import { ActiveInactiveDto } from './dto/active-inactive.dto';
import {
  AssignmentCPDto,
  AssignmentLaneDto,
  TruckOnCPQueueDTO,
  TruckOnCPQueueResponseDTO,
  TruckOnLaneToCPQueueResponseDTO,
} from './dto/assignment-lane.dto';
import { DatabaseService } from '@utils/database.service';
import { ValidationService } from '@utils/validation-service';
import { LaneRequestValidation } from './validation/lane-request.validation';
import { RulesOfSimpangBayah } from 'src/ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import {
  AssignResponse,
  ManualAssignCPToCPRequest,
  ManualAssignCPToLaneRequest,
  ManualAssignLaneToCpRequest,
  ManualAssignUndetecetdToCPRequest,
} from './dto/manual-assign-truck.dto';
import { ManualAssignTruckValidation } from './validation/manual-assign-truck.validation';
import { CpQueueAssignment } from '../jobs/entities/cpqueueassignments.entity';
import {
  QueueStatusEnum,
  UpdatePositioningEnum,
  WebSocketAntrianCp,
} from '@utils/enums';
import { QueryParamsCp } from './dto/query-list-cp.dto';
import { TrucksService } from '../trucks/trucks.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { dtoStatusCP } from 'src/cp/dto/status.dto';
import { KafkaService } from 'src/kafka/kafka.service';
import { RuleLaneCp } from 'src/cp/entities/cp_rule_lane.entity';
import { RuleOfCp } from 'src/cp/entities/cp_rule.entity';
import { DomainError } from '@utils/domains-error';
import { reorderingPosition } from 'src/cp/dto/checkStatusCp.dto';
import { VideotroNotifMappingService } from 'src/vidiotron-notif/videotro-notif-mapping.service';
import { CpQueues } from '../jobs/entities/cp_queues.entity';
import { Cps } from '../jobs/entities/cps.entity';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import {
  LanesActivityLog,
  LanesActivityLogStatus,
} from './entities/lanes_activity_log.entity';
import { createLaneActivityLog } from './dto/create-lanes-activity-log';
import { JwtAuthResponse } from 'src/auth/dto/auth.dto';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Injectable()
export class LaneService {
  private lane: Lanes;
  private readonly queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    @InjectRepository(Lanes)
    private laneRepository: Repository<Lanes>,
    @InjectRepository(Cps)
    private cpRepository: Repository<Cps>,
    @InjectRepository(RulesOfSimpangBayah)
    private rulesOfSimpangBayahRepository: Repository<RulesOfSimpangBayah>,
    @InjectRepository(CpQueueAssignment)
    private cpQueueAssignmentRepository: Repository<CpQueueAssignment>,
    @InjectRepository(RuleLaneCp)
    private cpRulesLaneRepository: Repository<RuleLaneCp>,
    @InjectRepository(RuleOfCp)
    private cpRulesRepository: Repository<RuleOfCp>,
    @Inject(forwardRef(() => DatabaseService))
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => ErrorHandlerService))
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => ValidationService))
    private validationService: ValidationService,
    @Inject(forwardRef(() => TrucksService))
    private truckService: TrucksService,
    @Inject(forwardRef(() => KafkaService))
    private kafkaService: KafkaService,
    @InjectRepository(LanesActivityLog)
    private lanesActivityLogRepository: Repository<LanesActivityLog>,
    // @Inject(forwardRef(() => VideotroNotifMappingService))
    // private videoTronNotif: VideotroNotifMappingService,
    private vidioTronNotifService: VidiotronNotifService,
    private socketClientService: SocketClientService,
  ) {}

  async create(
    createLaneDto: CreateLaneDto,
    authInfo: JwtAuthResponse,
  ): Promise<any> {
    const { rules, ...laneData } = createLaneDto;
    try {
      const createData = {
        ...laneData,
        lane_code:
          laneData.lane_name.replace(/\s+/g, '') + generateRandomString(10),
        description: laneData.lane_name,
        reason_off: laneData.reason_status,
      };
      await this.updatePositioning(
        createLaneDto.positioning,
        UpdatePositioningEnum.CREATE,
      );
      const lane = this.laneRepository.create(createData);
      await this.laneRepository.save(lane);
      if (rules && Array.isArray(rules) && rules.length > 0) {
        const ruleofsimpangbayahlane =
          this.rulesOfSimpangBayahRepository.create(
            rules.map((rule) => ({
              lane_id: lane.id,
              truck_type: rule.truck_type,
            })),
          );
        await this.rulesOfSimpangBayahRepository.save(ruleofsimpangbayahlane);
      }
      await this.createLaneActivityLog(lane.id, {
        current_lane_name: createLaneDto.lane_name,
        reason: createLaneDto.reason_status,
        current_positioning: createLaneDto.positioning,
        updated_by: authInfo.email,
      });

      return {
        statusCode: 200,
        message: 'Data was saved successfully',
      };
    } catch (error) {
      return error.message;
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async createLaneActivityLog(
    laneId: number,
    dto: Partial<createLaneActivityLog>,
  ): Promise<any> {
    try {
      const createLog = {
        lane_id: laneId,
        previous_lane_name: dto.previous_lane_name ?? null,
        current_lane_name: dto.current_lane_name ?? null,

        previous_status: dto.previous_status ?? null,
        current_status: dto.current_status ?? null,
        reason: dto.reason,
        previous_positioning: dto.previous_positioning,
        current_positioning: dto.current_positioning,
        updated_by: dto.updated_by,
      };
      this.errorHandler.logDebug(
        'Starting Create Log Status ' + dto.current_lane_name,
      );
      const log = await this.lanesActivityLogRepository.create(createLog);
      await this.lanesActivityLogRepository.save(log);
      this.errorHandler.logDebug(
        'Success Create Log Status ' + dto.current_lane_name,
      );
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.laneRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'DESC' },
      where: {
        deleted_at: null,
      },
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
  async findAll(q: string, metadata: Record<string, any>): Promise<any> {
    try {
      let results = null;
      const bFlag = stringToBoolean(q);
      if (bFlag === null) {
        const lanes = await this.laneRepository.find({
          relations: ['vidiotron_lane', 'vidiotron_lane.vidiotron', 'rules'],
          select: [
            'id',
            'lane_code',
            'lane_name',
            'status',
            'positioning',
            'reason_off',
          ],
          order: {
            positioning: 'ASC',
          },
        });

        results = lanes.map((lane) => {
          const { vidiotron_lane, ...rest } = lane;
          return {
            ...rest,
            rules: lane.rules,
            vidiotron: lane.vidiotron_lane?.vidiotron
              ? { ip: lane.vidiotron_lane.vidiotron.ip }
              : null,
          };
        });
      } else {
        const lanes = await this.laneRepository.find({
          select: [
            'id',
            'lane_code',
            'lane_name',
            'status',
            'positioning',
            'reason_off',
          ],
          relations: ['vidiotron_lane', 'vidiotron_lane.vidiotron', 'rules'],
          where: {
            status: bFlag,
          },
          order: {
            positioning: 'ASC',
          },
        });

        results = lanes.map((lane) => {
          const { vidiotron_lane, ...rest } = lane;
          return {
            ...rest,
            rules: lane.rules,
            vidiotron: lane.vidiotron_lane?.vidiotron
              ? { ip: lane.vidiotron_lane.vidiotron.ip }
              : null,
          };
        });
      }
      const lists = results.map((row) => ({
        ...row,
        id: encryptJSAES(row.id.toString()),
      }));

      return { statusCode: 200, data: lists };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'list-lanes',
        'line',
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

  async findOne(id: string): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    const lane = await this.laneRepository.findOne({
      where: {
        id: idupdate,
      },
      relations: ['vidiotron_lane', 'vidiotron_lane.vidiotron', 'rules'],
    });
    if (!lane) throw new NotFoundException(`Driver with ID ${id} not found`);
    const { vidiotron_lane, ...rest } = lane;
    const updatedLane = {
      ...rest,
      id: encryptJSAES(lane.id.toString()),
      vidiotron: lane.vidiotron_lane?.vidiotron
        ? { ip: lane.vidiotron_lane.vidiotron.ip }
        : null,
    };

    return updatedLane;
  }

  async update(
    id: string,
    updateLaneDto: UpdateLaneDto,
    authInfo: JwtAuthResponse,
  ): Promise<any> {
    const { rules, ...laneData } = updateLaneDto;
    const idupdate = Number(decryptJSAES(id));
    try {
      const checkData = await this.laneRepository.findOneBy({
        id: idupdate,
      });
      if (!checkData) {
        return {
          statusCode: 400,
          message: `Lane With ID: ${id} Not Found`,
        };
      }
      await this.updatePositioning(
        updateLaneDto.positioning,
        UpdatePositioningEnum.UPDATE,
        id,
      );
      const updateData = {
        lane_name: laneData.lane_name,
        positioning: laneData.positioning,
        status: laneData.status,
        reason_off: laneData.reason_status,
      };

      await this.laneRepository.update(idupdate, updateData);
      if (rules && Array.isArray(rules) && rules.length > 0) {
        const data = await this.rulesOfSimpangBayahRepository.findOneBy({
          lane_id: idupdate,
        });
        if (data) {
          await this.rulesOfSimpangBayahRepository.delete({
            lane_id: idupdate,
          });
        }
        for (const rule of rules) {
          const newRule = this.rulesOfSimpangBayahRepository.create({
            lane_id: idupdate,
            truck_type: rule.truck_type,
          });
          await this.rulesOfSimpangBayahRepository.save(newRule);
        }
      }
      await this.createLaneActivityLog(checkData.id, {
        previous_lane_name: checkData.lane_name,
        current_lane_name: updateData.lane_name,
        previous_status: checkData.status
          ? LanesActivityLogStatus.OPERATIONAL
          : LanesActivityLogStatus.NON_OPERATIONAL,
        current_status: updateData.status
          ? LanesActivityLogStatus.OPERATIONAL
          : LanesActivityLogStatus.NON_OPERATIONAL,
        reason: updateData.reason_off,
        previous_positioning: checkData.positioning,
        current_positioning: updateData.positioning,
        updated_by: authInfo.email,
      });
      return {
        statusCode: 200,
        message: 'Data Successfully Updated',
      };
    } catch (error) {
      return error.message;
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async updateStatusLane(
    id: string,
    updateCpDto: dtoStatusCP,
    authInfo: JwtAuthResponse,
  ): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    if (!updateCpDto.reason) {
      return {
        statusCode: 400,
        message: 'Reason is required',
      };
    }
    try {
      await this.laneRepository.update(idupdate, {
        status: updateCpDto.status,
        reason_off: updateCpDto.reason,
      });
      const data = await this.findOne(id);
      await this.createLaneActivityLog(data.id, {
        previous_status: data.status
          ? LanesActivityLogStatus.OPERATIONAL
          : LanesActivityLogStatus.NON_OPERATIONAL,
        current_status: updateCpDto.status
          ? LanesActivityLogStatus.OPERATIONAL
          : LanesActivityLogStatus.NON_OPERATIONAL,
        reason: updateCpDto.reason,
        updated_by: authInfo.email,
      });
      return {
        statusCode: 200,
        message: 'Status Lane Successfully Updated',
        data: data,
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async remove(id: string, authInfo: JwtAuthResponse): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    try {
      const dataLane = await this.laneRepository.findOneBy({ id: idupdate });
      if (!dataLane)
        throw new NotFoundException(`Lane with ID ${id} not found`);
      await this.updatePositioning(
        dataLane.positioning,
        UpdatePositioningEnum.DELETE,
      );
      // const result = await this.laneRepository.delete(idupdate);
      const result = await this.laneRepository.update(idupdate, {
        deleted_at: new Date(),
        deleted_by: 'ADMIN',
      });
      const dataRuleSimpangBayah =
        await this.rulesOfSimpangBayahRepository.findOneBy({
          lane_id: idupdate,
        });
      if (dataRuleSimpangBayah) {
        await this.rulesOfSimpangBayahRepository.delete({ lane_id: idupdate });
      }
      if (result.affected === 0)
        throw new NotFoundException(`Driver with ID ${id} not found`);
      await this.createLaneActivityLog(dataLane.id, {
        previous_status: dataLane.status
          ? LanesActivityLogStatus.OPERATIONAL
          : LanesActivityLogStatus.NON_OPERATIONAL,
        current_status: LanesActivityLogStatus.DELETED,
        updated_by: authInfo.email,
      });
      return {
        statusCode: 200,
        message: 'Data was Delete successfully',
      };
    } catch (error) {
      return error.message;
      this.errorHandler.throwBadRequestError(
        error,
        'The data was failed to delete.',
      );
    }
  }

  async unitOnCpList(dtoRequest: QueryParamsCp): Promise<any> {
    try {
      const cpQueues: Cps[] = await this.getCpQueues(dtoRequest);
      const result: TruckOnCPQueueResponseDTO[] = [];
      for (let i = 0; i < cpQueues.length; i++) {
        const truckOnQueueDtos = await this.getQueueCP(cpQueues[i].cp_id);
        const truckList: TruckOnCPQueueDTO[] = [];
        for (let x = 0; x < truckOnQueueDtos.length; x++) {
          const truckOnQueueDto = truckOnQueueDtos[x];

          if (truckOnQueueDto.nomor_lambung) {
            const trucks: TruckOnCPQueueDTO = {
              nomor_lambung: truckOnQueueDto.nomor_lambung,
              vendor: truckOnQueueDto.vendor,
            };
            truckList.push(trucks);
          }
        }

        const truckOnCpResponse: TruckOnCPQueueResponseDTO = {
          queue_id: cpQueues[i].cp_id.toString(),
          queue_name: cpQueues[i].cp_name,
          status: cpQueues[i].status,
          maxCapacity: cpQueues[i].max_capacity,
          totalQueue: truckList.length,
          trucks: truckList,
        };
        truckOnCpResponse;
        result.push(truckOnCpResponse);
      }

      const rowList = result.map((row) => ({
        ...row,
        queue_id:
          row.queue_id !== null ? encryptJSAES(row.queue_id.toString()) : null,
      }));
      return { statusCode: 200, data: rowList };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  async unitOnCpQueue(dtoRequest: QueryParamsCp): Promise<any> {
    try {
      const lanes: Lanes[] = await this.getLanes(dtoRequest);
      const result: TruckOnLaneToCPQueueResponseDTO[] = [];
      for (let i = 0; i < lanes.length; i++) {
        const truckOnQueueDtos = await this.getQueueLaneToCP(lanes[i].id);
        const truckList: TruckOnCPQueueDTO[] = [];
        for (let x = 0; x < truckOnQueueDtos.length; x++) {
          const truckOnQueueDto = truckOnQueueDtos[x];

          if (truckOnQueueDto.nomor_lambung) {
            const trucks: TruckOnCPQueueDTO = {
              nomor_lambung: truckOnQueueDto.nomor_lambung,
              vendor: truckOnQueueDto.vendor,
            };
            truckList.push(trucks);
          }
        }

        const truckOnQueueResponse: TruckOnLaneToCPQueueResponseDTO = {
          lane_id: encryptJSAES(lanes[i].id.toString()),
          lane_code: lanes[i].lane_code,
          status: lanes[i].status,
          maxCapacity: lanes[i].max_capacity,
          totalQueue: truckList.length,
          trucks: truckList,
        };

        result.push(truckOnQueueResponse);
      }

      return { statusCode: 200, data: result };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  async unitOnCpQueues(dtoRequest: QueryParamsCp): Promise<any> {
    try {
      const cpQueues: Cps[] = await this.getCpQueues(dtoRequest);
      const result: TruckOnCPQueueResponseDTO[] = [];
      for (let i = 0; i < cpQueues.length; i++) {
        const truckOnQueueDtos = await this.getQueueOnCP(cpQueues[i].cp_id);
        const truckList: TruckOnCPQueueDTO[] = [];
        for (let x = 0; x < truckOnQueueDtos.length; x++) {
          const truckOnQueueDto = truckOnQueueDtos[x];

          if (truckOnQueueDto.nomor_lambung) {
            const trucks: TruckOnCPQueueDTO = {
              nomor_lambung: truckOnQueueDto.nomor_lambung,
              vendor: truckOnQueueDto.vendor,
            };
            truckList.push(trucks);
          }
        }

        const truckOnQueueResponse: TruckOnCPQueueResponseDTO = {
          queue_id: encryptJSAES(cpQueues[i].cp_id.toString()),
          queue_name: cpQueues[i].cp_name,
          status: cpQueues[i].status,
          maxCapacity: cpQueues[i].max_capacity,
          totalQueue: truckList.length,
          trucks: truckList,
        };

        result.push(truckOnQueueResponse);
      }

      return { statusCode: 200, data: result };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  async laneList(): Promise<any> {
    try {
      const list: Lanes[] = await this.getLanes({});
      return { statusCode: 200, data: list };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  async activateCP(request: ActiveInactiveDto): Promise<any> {
    this.validationService.validate(LaneRequestValidation.ACTIVATE, request);
    try {
      const cp = await this.cpRepository.findOneBy({
        cp_id: request.id,
      });
      if (!cp)
        throw new NotFoundException(`CP with ID ${request.id} not found`);
      cp.status = request.is_active;
      await this.cpRepository.save(cp);
      //todo: send notif online
      return { statusCode: 200, message: 'Data was saved successfully' };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  // async activateCPQueue(request: ActiveInactiveDto): Promise<any> {
  //   this.validationService.validate(LaneRequestValidation.ACTIVATE, request);
  //   try {
  //     const cpQueue = await this.cpQueuesRepository.findOneBy({
  //       queue_id: request.id,
  //     });
  //     if (!cpQueue)
  //       throw new NotFoundException(`CP Queue with ID ${request.id} not found`);
  //     cpQueue.status = request.is_active;
  //     await this.cpQueuesRepository.save(cpQueue);
  //     //todo: send notif online
  //     return { statusCode: 200, message: 'Data was saved successfully' };
  //   } catch (error) {
  //     this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
  //   }
  // }

  async activateLane(request: ActiveInactiveDto): Promise<any> {
    this.validationService.validate(LaneRequestValidation.ACTIVATE, request);
    try {
      const lane = await this.laneRepository.findOneBy({ id: request.id });
      if (!lane)
        throw new NotFoundException(`Lane with ID ${request.id} not found`);
      lane.status = request.is_active;

      if (lane.status) {
        await this.vidioTronNotifService.saveNotifLaneStatic(lane.id, null);
      }
      await this.laneRepository.save(lane);
      return { statusCode: 200, message: 'Data was saved successfully' };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async getQueueLaneToCP(laneId: number): Promise<AssignmentLaneDto[]> {
    try {
      return await this.databaseService.query(
        'select lane_id, l.lane_code, l.status, t.nomor_lambung, t.vendor  from lanes l ' +
          'left join cp_queue_assignments cqa on cqa.lane_id = l.id ' +
          'left join trucks t on t.id = cqa.truck_id ' +
          'where cqa.cp_queue_id is null and cqa.exit_time is null and cqa.exit_cp_time is null and l.id=$1 ' +
          'order by cqa.lane_id asc, cqa.auditupdate desc ',
        [laneId],
      );
    } catch (error: any) {
      this.errorHandler.logError('Ooops getQueueLaneToCP Error ', error);
      return [];
    }
  }

  async getQueueOnCP(cpQueueId: number): Promise<AssignmentCPDto[]> {
    try {
      return await this.databaseService.query(
        'select queue_id, cq.queue_name, cq.status, t.nomor_lambung, t.vendor  from cp_queues cq ' +
          ' left join cp_queue_assignments cqa on cqa.cp_queue_id = cq.queue_id ' +
          ' left join trucks t on t.id = cqa.truck_id ' +
          " where cqa.cp_queue_id is not null and cqa.exit_cp_time is null and cq.queue_id =$1 and cqa.status = 'ASSIGNED_TO_CP' " +
          ' order by cqa.cp_queue_id asc, cqa.auditupdate desc ',
        [cpQueueId],
      );
    } catch (error: any) {
      this.errorHandler.logError('Ooops getQueueOnCP Error ', error);
      return [];
    }
  }

  async getQueueCP(cpQueueId: number): Promise<AssignmentCPDto[]> {
    try {
      return await this.databaseService.query(
        'select cq.queue_id, cq.queue_name, cq.status, t.nomor_lambung, t.vendor from cp_queues cq ' +
          'left join cp_queue_assignments cqa on cqa.cp_queue_id = cq.queue_id ' +
          'left join trucks t on t.id = cqa.truck_id ' +
          'where cqa.cp_queue_id is not null and cqa.exit_time is not null and cq.queue_id = $1 ' +
          'order by cqa.auditupdate desc ',
        [cpQueueId],
      );
    } catch (error: any) {
      this.errorHandler.logError('Ooops getQueueCP Error ', error);
      return [];
    }
  }

  async getLanes(dtoRequest: QueryParamsCp): Promise<Lanes[]> {
    const whereConditions: any = {};

    if (dtoRequest.status) {
      whereConditions.status = dtoRequest.status;
    }
    return this.laneRepository.find({
      where: whereConditions,
    });
  }

  async getCpQueues(dtoRequest: QueryParamsCp): Promise<Cps[]> {
    const whereConditions: any = {};

    if (dtoRequest.status) {
      whereConditions.status = dtoRequest.status;
    }

    // Query with the where condition
    return this.cpRepository.find({
      where: whereConditions,
    });
  }

  async assignTruckFromLaneToCP(
    request: ManualAssignLaneToCpRequest,
  ): Promise<any> {
    this.errorHandler.logDebug('assign truck from lane to cp');
    this.validationService.validate(
      ManualAssignTruckValidation.ASSIGN_FROM_LANE_TO_CP,
      request,
    );
    if (!request.to_cp_id) {
      throw new BadRequestException('to_cp_id is required');
    }
    if (!request.from_lane_id) {
      throw new BadRequestException('from_lane_id is required');
    }
    if (!request.truck_id) {
      throw new BadRequestException('truck_id is required');
    }
    if (!request.nomor_lambung) {
      throw new BadRequestException('nomor_lambung is required');
    }
    if (!request.user_id) {
      throw new BadRequestException('user_id is required');
    }

    const toCPId = Number(decryptJSAES(request.to_cp_id));
    const fromLaneId = Number(decryptJSAES(request.from_lane_id));
    const truckId = Number(decryptJSAES(request.truck_id));
    const user_id = Number(decryptJSAES(request.user_id));
    const dataCp = await this.cpRepository.findOneBy({
      cp_id: toCPId,
    });

    if (!dataCp) {
      throw new BadRequestException('Cp Not Found');
    }

    if (dataCp && dataCp.status === false) {
      throw new BadRequestException(
        'Cannot Move Into Offline Cp, Make Sure Status CP is Online',
      );
    }

    const dataAssignment = await this.cpQueueAssignmentRepository.findOneBy({
      truck_id: truckId,
      lane_id: fromLaneId,
    });

    if (!dataAssignment) {
      throw new BadRequestException('Data Assignment not found');
    }

    const ruleTruckTypeCp = await this.cpRulesRepository.findBy({
      cp_id: toCPId,
    });

    if (ruleTruckTypeCp && ruleTruckTypeCp.length > 0) {
      const matchingRule = ruleTruckTypeCp.find(
        (rule) => rule.truck_type === dataAssignment.truck_type,
      );
      if (!matchingRule) {
        throw new BadRequestException(
          'Type Truck Not Permission To Assign In Cp ' + toCPId,
        );
      }
    }
    const dataRuleLaneCp = await this.cpRulesLaneRepository.findOneBy({
      cp_id: toCPId,
      queue_lane_id: fromLaneId,
    });
    if (!dataRuleLaneCp) {
      throw new BadRequestException(
        'Lane Not Permission To Assign In Cp ' + toCPId,
      );
    }

    const nomorLambung = request.nomor_lambung;
    //todo: validation truck type
    this.errorHandler.logDebug(`get max capacity of cp ${toCPId}`);
    const cpMaxCapacity = await this.getTotalMaxCapacityCpQueues(toCPId);
    this.errorHandler.logDebug(
      `max capacity of cp ${toCPId} is ${cpMaxCapacity}`,
    );

    this.errorHandler.logDebug(`get total load of cp ${toCPId}`);
    const totalLoadCp = await this.getCountOfCPLoad(toCPId);
    this.errorHandler.logDebug(`total load of cp ${toCPId} is ${totalLoadCp}`);
    if (totalLoadCp < cpMaxCapacity) {
      this.errorHandler.logDebug(
        `get last assignment of truck ${nomorLambung}`,
      );
      const cpQueueAssignment =
        await this.getCpQueueAssignmentWithTruck(nomorLambung);
      if (cpQueueAssignment) {
        cpQueueAssignment.cp_queue_id = toCPId;
        cpQueueAssignment.exit_time = new Date();
        cpQueueAssignment.auditupdate = new Date();
        cpQueueAssignment.status = QueueStatusEnum.ASSIGNED_TO_CP;
        cpQueueAssignment.updated_by = user_id;
        await this.cpQueueAssignmentRepository.save(cpQueueAssignment);
        await this.vidioTronNotifService.saveNotifCpQueue(
          toCPId,
          cpQueueAssignment.lane_id,
          cpQueueAssignment.truck_id,
        );
        await this.sendDataToWebSocket(
          fromLaneId,
          toCPId,
          WebSocketAntrianCp.LANETOCP,
          null,
          'MANUAL',
        );
      } else {
        throw new BadRequestException('Truck Not Found On This Queue');
      }
    } else {
      throw new BadRequestException('CP is full');
    }

    const fromLane = await this.databaseService.query(
      `SELECT lane_name FROM queue_lane WHERE id = ${fromLaneId}`,
    );
    if (fromLane.length == 0) {
      throw new BadRequestException(`Lane Antrian ${fromLaneId} Not Found`);
    }
    const toCpQueue = await this.cpRepository.findOneBy({
      cp_id: toCPId,
    });

    const message = {
      hull_number: nomorLambung,
      driver_name: null,
      assignment_source: `${fromLane[0].lane_name}`, // from lane
      assignment_destination: `${toCpQueue.cp_name}`,
      timestamp: new Date().toISOString(),
    };

    await this.kafkaService.sendMessage(process.env.KAFKA_TOPIC, message);
    return {
      statusCode: 200,
      message: 'Successfully assign truck to cp',
    };
  }

  async assignTruckFromCPToCP(
    request: ManualAssignCPToCPRequest,
  ): Promise<AssignResponse> {
    try {
      this.errorHandler.logDebug('assign truck from cp to cp');
      this.validationService.validate(
        ManualAssignTruckValidation.ASSIGN_FROM_CP_TO_CP,
        request,
      );
      const toCPId = Number(decryptJSAES(request.to_cp_id));
      const fromCPId = Number(decryptJSAES(request.from_cp_id));
      const user_id = Number(decryptJSAES(request.user_id));
      const nomorLambung = request.nomor_lambung;
      //todo: validation truck type
      this.errorHandler.logDebug(`get max capacity of cp ${toCPId}`);
      const cpMaxCapacity = await this.getTotalMaxCapacityCpQueues(toCPId);
      this.errorHandler.logDebug(
        `max capacity of cp ${toCPId} is ${cpMaxCapacity}`,
      );
      this.errorHandler.logDebug(`get total load of cp ${toCPId}`);
      const totalLoadCp = await this.getCountOfCPLoad(toCPId);
      this.errorHandler.logDebug(
        `total load of cp ${toCPId} is ${totalLoadCp}`,
      );
      if (totalLoadCp < cpMaxCapacity) {
        const cpQueueAssignment =
          await this.getCpQueueAssignmentWithTruck(nomorLambung);
        if (cpQueueAssignment) {
          await this.vidioTronNotifService.saveNotifCpQueue(
            toCPId,
            cpQueueAssignment.lane_id,
            cpQueueAssignment.truck_id,
          );
          cpQueueAssignment.cp_queue_id = toCPId;
          cpQueueAssignment.exit_time = new Date();
          cpQueueAssignment.auditupdate = new Date();
          cpQueueAssignment.updated_by = user_id;
          await this.cpQueueAssignmentRepository.save(cpQueueAssignment);
          await this.sendDataToWebSocket(
            fromCPId,
            toCPId,
            WebSocketAntrianCp.CPTOCP,
            null,
            'MANUAL',
          );
        } else {
          throw new BadRequestException('Truck Not Found On This Queue');
        }
      } else {
        throw new BadRequestException('CP is full');
      }
      return {
        statusCode: 200,
        message: 'Successfully assign truck to cp',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Assign truck from cp to cp was failed',
      );
    }
  }
  async assignTruckFromUndetectedToCP(
    request: ManualAssignUndetecetdToCPRequest,
  ): Promise<AssignResponse> {
    this.errorHandler.logDebug('assign truck from undetected to cp');
    try {
      this.validationService.validate(
        ManualAssignTruckValidation.ASSIGN_FROM_UNDETECTED_TO_CP,
        request,
      );
      const toCPId = Number(decryptJSAES(request.to_cp_id));
      const nomorLambung = request.nomor_lambung;
      const user_id = Number(decryptJSAES(request.user_id));
      this.errorHandler.logDebug(`get max capacity of cp ${toCPId}`);
      const cpMaxCapacity = await this.getTotalMaxCapacityCpQueues(toCPId);
      this.errorHandler.logDebug(
        `max capacity of cp ${toCPId} is ${cpMaxCapacity}`,
      );

      this.errorHandler.logDebug(`get total load of cp ${toCPId}`);
      const totalLoadCp = await this.getCountOfCPLoad(toCPId);
      this.errorHandler.logDebug(
        `total load of cp ${toCPId} is ${totalLoadCp}`,
      );

      if (totalLoadCp < cpMaxCapacity) {
        try {
          const [truck] = await this.databaseService.query(
            `SELECT id, typeoftruck FROM trucks WHERE nomor_lambung = '${nomorLambung}' `,
          );

          if (!truck) {
            throw new BadRequestException(
              `Truck with nomor lambung ${nomorLambung} not found`,
            );
          }

          const query = this.queryLoader.getQueryById('add_truck_undetected');
          const data = await this.databaseService.query(query, [
            truck.id,
            toCPId,
            'DT',
            user_id,
          ]);

          this.errorHandler.logDebug(
            `Truck ${nomorLambung} successfully assigned to CP ${toCPId}`,
          );
        } catch (err) {
          this.errorHandler.throwBadRequestError(
            err,
            'Ooops Error adding truck to CP',
          );
        }
      } else {
        throw new BadRequestException('CP is full');
      }

      return {
        statusCode: 200,
        message: 'Successfully assign truck to cp',
      };
    } catch (err) {
      this.errorHandler.throwBadRequestError(
        err,
        'Ooops Error assigning truck from undetected to CP',
      );
    }
  }

  async assignTruckFromCPToLane(
    request: ManualAssignCPToLaneRequest,
  ): Promise<any> {
    try {
      this.errorHandler.logDebug('assign truck from cp to lane');
      this.validationService.validate(
        ManualAssignTruckValidation.ASSIGN_FROM_CP_TO_LANE,
        request,
      );
      const toLaneId = Number(decryptJSAES(request.to_lane_id));
      const fromCpID = Number(decryptJSAES(request.from_cp_id));
      const truckID = Number(decryptJSAES(request.truck_id));
      const user_id = Number(decryptJSAES(request.user_id));

      const checkCP = await this.databaseService.query(
        `SELECT * FROM rule_lane_cp WHERE queue_lane_id = ${toLaneId} AND cp_id = ${fromCpID}`,
      );
      if (!checkCP || checkCP.length === 0) {
        return {
          statusCode: 400,
          message: `Cannot assign truck from CP${fromCpID} to LANE ${toLaneId} Because Dont Have Permission`,
        };
      }
      //todo: validation truck type
      this.errorHandler.logDebug(`get max capacity of lane ${toLaneId}`);
      const laneMaxCapacity = await this.getTotalMaxCapacityOfLanes(toLaneId);
      this.errorHandler.logDebug(
        `max capacity of cp ${toLaneId} is ${laneMaxCapacity}`,
      );

      this.errorHandler.logDebug(`get total load of lane ${toLaneId}`);
      const totalLoadLane = await this.getCountOfLaneLoad(toLaneId);
      this.errorHandler.logDebug(
        `total load of lane ${toLaneId} is ${totalLoadLane}`,
      );
      if (totalLoadLane < laneMaxCapacity) {
        const cpQueueAssignment =
          await this.getCpQueueAssignmentWithTruckID(truckID);
        if (cpQueueAssignment) {
          cpQueueAssignment.cp_queue_id = null;
          cpQueueAssignment.lane_id = toLaneId;
          cpQueueAssignment.exit_time = null;
          cpQueueAssignment.auditupdate = new Date();
          cpQueueAssignment.status = QueueStatusEnum.WAITING;
          cpQueueAssignment.back_to_queue = true;
          cpQueueAssignment.updated_by = user_id;
          await this.cpQueueAssignmentRepository.save(cpQueueAssignment);
          await this.sendDataToWebSocket(
            fromCpID,
            toLaneId,
            WebSocketAntrianCp.CPTOLANE,
            null,
            'MANUAL',
          );
          await this.vidioTronNotifService.saveNotifLane(
            toLaneId,
            cpQueueAssignment.truck_id,
          );
        } else {
          throw new BadRequestException('Truck Not Found On This Queue');
        }
      } else {
        throw new BadRequestException('Lane is full');
      }

      return {
        statusCode: 200,
        message: 'Successfully assign truck to lane',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, error);
    }
  }

  async getCountOfCPLoad(cpId: number): Promise<number> {
    try {
      // Get today's date at 00:00:00
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Get today's date at 23:59:59
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      return await this.cpQueueAssignmentRepository.count({
        where: {
          cp_queue_id: cpId,
          status: Not(QueueStatusEnum.COMPLETED),
          auditupdate: Between(startOfDay, endOfDay),
        },
      });
    } catch (error: any) {
      this.errorHandler.throwBadRequestError(
        error,
        `Ooops Failed to get data from database`,
      );
    }
  }

  async getCountOfLaneLoad(laneId: number): Promise<number> {
    try {
      // Get today's date at 00:00:00
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      // Get today's date at 23:59:59
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      return await this.cpQueueAssignmentRepository.count({
        where: {
          lane_id: laneId,
          exit_time: IsNull(),
          cp_queue_id: IsNull(),
          auditupdate: Between(startOfDay, endOfDay),
        },
      });
    } catch (error: any) {
      this.errorHandler.throwBadRequestError(
        error,
        `Ooops Failed to get data from database`,
      );
    }
  }

  async getTotalMaxCapacityCpQueues(cp_id: number): Promise<number> {
    try {
      const cpQueues = await this.cpRepository.find({
        where: {
          cp_id: cp_id,
        },
        select: ['max_capacity'],
      });

      return cpQueues.reduce(
        (sum, queue) => sum + (queue.max_capacity || 0),
        0,
      );
    } catch (error: any) {
      this.errorHandler.throwBadRequestError(
        error,
        `Ooops Failed to get data from database`,
      );
    }
  }

  async getTotalMaxCapacityOfLanes(laneId: number): Promise<number> {
    try {
      const cpQueues = await this.laneRepository.find({
        where: {
          id: laneId,
        },
        select: ['max_capacity'],
      });

      return cpQueues.reduce(
        (sum, queue) => sum + (queue.max_capacity || 0),
        0,
      );
    } catch (error: any) {
      this.errorHandler.throwBadRequestError(
        error,
        `Ooops Failed to get data from database`,
      );
    }
  }

  async getCpQueueAssignmentWithTruck(
    nomorLambung: string,
  ): Promise<CpQueueAssignment | null> {
    try {
      const assignment = await this.cpQueueAssignmentRepository
        .createQueryBuilder('cqa')
        .select('cqa.*')
        .innerJoin('trucks', 't', 't.id = cqa.truck_id')
        .where('UPPER(t.nomor_lambung) = UPPER(:nomorLambung)', {
          nomorLambung,
        })
        .orderBy('cqa.auditupdate', 'DESC')
        .getRawOne();

      if (!assignment) {
        throw null;
      }

      return assignment;
    } catch (error: any) {
      this.errorHandler.throwBadRequestError(
        error,
        `Ooops Error Service ${DomainError.LANE_SERVICE_GET_CP_ASSIGNMENT_WITH_TRUCK} Failed to get data from database`,
      );
    }
  }
  async getCpQueueAssignmentWithTruckID(
    truckID: number,
  ): Promise<CpQueueAssignment | null> {
    try {
      const assignment = await this.cpQueueAssignmentRepository
        .createQueryBuilder('cqa')
        .select('cqa.*')
        .where('cqa.truck_id = :truckID', {
          truckID,
        })
        .orderBy('cqa.auditupdate', 'DESC')
        .getRawOne();

      if (!assignment) {
        throw null;
      }

      return assignment;
    } catch (error: any) {
      this.errorHandler.throwBadRequestError(
        error,
        'Ooops Failed to get data from database',
      );
    }
  }

  async removeTruckFromCP(id: string): Promise<any> {
    const assignment = await this.getCpQueueAssignmentWithTruck(id);
    try {
      const result = await this.cpQueueAssignmentRepository.update(
        {
          assignment_id: assignment.assignment_id,
        },
        {
          status: QueueStatusEnum.COMPLETED,
        },
      );
      if (result.affected === 0)
        throw new NotFoundException(`Assignment with ID ${id} not found`);
      return {
        statusCode: 200,
        message: 'Truck was Completed in CP',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        `Error Service: ${DomainError.LANE_SERVICE_REMOVE_TRUCK_FROM_CP}: The data was failed to delete.`,
      );
    }
  }

  // async sendNotificationLaneToCp(
  //   truckId: number,
  //   cpQueueId: number,
  //   laneId: number,
  // ) {
  //   try {
  //     //get truck data and create message from truck information
  //     const truck = await this.truckService.findOne(truckId);
  //     const cpQueues = await this.cpQueuesRepository.findOneBy({
  //       queue_id: cpQueueId,
  //     });
  //     const maxQueue = cpQueues.max_capacity;
  //     const currentQueue = await this.getCountOfLaneLoad(laneId);
  //     if (truck) {
  //       const lane = `L${laneId}`;
  //       const noLambung = truck.nomor_lambung;
  //       await this.videoTronNotif.sendNotificationLaneQueueToCp(
  //         lane,
  //         cpQueues.queue_name,
  //         noLambung,
  //         truck.typeoftruck,
  //         Math.floor(maxQueue),
  //         currentQueue,
  //         laneId,
  //         cpQueues.queue_id,
  //       );)
  //       console.info(`truck ${truckId} assign to lane ${lane}`);
  //     } else {
  //       console.error(`Truck whit id ${truckId} not found`);
  //     }
  //   } catch (error: any) {
  //     console.error(error);
  //   }
  // }

  // async sendNotificationCpToCp(
  //   truckId: number,
  //   fromcpId: number,
  //   toCpQueueId: number,
  // ) {
  //   try {
  //     //get truck data and create message from truck information
  //     const truck = await this.truckService.findOne(truckId);
  //     const fromCpQueue = await this.cpQueuesRepository.findOneBy({
  //       queue_id: fromcpId,
  //     });
  //     const toCpQueue = await this.cpQueuesRepository.findOneBy({
  //       queue_id: toCpQueueId,
  //     });
  //     const maxQueue = toCpQueue.max_capacity;
  //     const currentQueue = await this.getCountOfCPLoad(toCpQueueId);
  //     if (truck) {
  //       const noLambung = truck.nomor_lambung;
  //       await this.videoTronNotif.sendNotificationLaneQueueToCp(
  //         fromCpQueue.queue_name,
  //         toCpQueue.queue_name,
  //         noLambung,
  //         truck.typeoftruck,
  //         Math.floor(maxQueue),
  //         currentQueue,
  //         null,
  //         toCpQueue.queue_id,
  //       );
  //       console.info(`truck ${truckId} assign to cp ${toCpQueue.queue_name}`);
  //     } else {
  //       console.error(`Truck whit id ${truckId} not found`);
  //     }
  //   } catch (error: any) {
  //     console.error(error);
  //   }
  // }

  // public async sendNotifFromSimpangBayahToLane(
  //   truckId: number,
  //   laneId: number,
  // ): Promise<void> {
  //   try {
  //     //get truck data and create message from truck information
  //     const truck = await this.truckService.findOne(truckId);
  //     const maxQueue = await this.getTotalMaxCapacityOfLanes(laneId);
  //     const currentQueue = await this.getCountOfLaneLoad(laneId);
  //     if (truck) {
  //       const lane = `L${laneId}`;
  //       const noLambung = truck.nomor_lambung;
  //       await this.videoTronNotif.sendNotificationSimpangBayahToLane(
  //         lane,
  //         noLambung,
  //         truck.typeoftruck,
  //         Math.floor(maxQueue),
  //         currentQueue,
  //         laneId,
  //       );
  //       console.info(`truck ${truckId} assign to lane ${lane}`);
  //     } else {
  //       console.error(`Truck whit id ${truckId} not found`);
  //     }
  //   } catch (error: any) {
  //     console.error(error);
  //   }
  // }

  async getRfidStatus(truckId: number): Promise<any> {
    try {
      const query = `
      SELECT 
          cp.cp_name,
          rf.event_type
      FROM 
          rfid_transaction rf
      LEFT JOIN 
          rfid_reader_in rri ON rf.event_type = 'On Process' 
              AND rf.rfid_reader_in_id IS NOT NULL 
              AND rf.rfid_reader_in_id = rri.rfid_reader_in_id
      LEFT JOIN 
          rfid_reader_out rro ON rf.event_type = 'Completed' 
              AND rf.rfid_reader_out_id IS NOT NULL 
              AND rf.rfid_reader_out_id = rro.rfid_reader_out_id
      LEFT JOIN 
          cp_detail cpi ON rri.cp_detail_id = cpi.cp_detail_id
      LEFT JOIN 
          cp_detail cpo ON rro.cp_detail_id = cpo.cp_detail_id
      LEFT JOIN 
          cps cp ON cpi.cp_id = cp.cp_id OR cpo.cp_id = cp.cp_id
      WHERE 
          rf.truck_id = ${truckId}
          AND rf.is_valid = true
          AND rf.event_type IN ('On Process', 'Completed')
      ORDER BY 
          rf.created_at DESC
      LIMIT 1;
      `;
      const result = await this.databaseService.query(query);
      return result;
    } catch (error) {}
  }
  async getSummaryCPV2(search: string, status: string): Promise<any> {
    let log_info: string = '';
    try {
      const bstatus = stringToBoolean(status);
      let results = null;
      let query = this.queryLoader.getQueryById('summary_cp_dashboard');
      if (search) {
        query = query.replaceAll(
          `::search`,
          ` AND (cqa.nomor_lambung ilike $2 OR cqa.driver_name ilike $2) `,
        );
      } else {
        query = query.replaceAll(`::search`, ` `);
      }
      let q: string;
      const ids = [];
      if (bstatus === null) {
        ids.push(false);
        ids.push(true);
      } else {
        ids.push(bstatus);
      }
      log_info += query + ` params: ${JSON.stringify(ids)}`;
      this.errorHandler.logDebug(`querydebugger :${query}`);
      if (!search) {
        // return [ids];
        results = await this.databaseService.query(query, [ids]);
      } else {
        results = await this.databaseService.query(query, [
          ids,
          '%' + search + '%',
        ]);
      }
      if (!results[0]?.result.cp_info) {
        return { statusCode: 200, data: null };
      }
      const cps = results[0].result.cp_info;
      const sumofqueue = results[0].result.total_trucks_in_cp;
      const last_updated = results[0].result.last_updated;

      this.errorHandler.logDebug(`lastlastlast : ${last_updated}`);
      // const listsoflane = cps.map((row) => ({
      //   ...row,
      //   cp_id: encryptJSAES(row.cp_id.toString()),
      //   truck_info: row.truck_info.map((truck) => ({
      //     ...truck,
      //     assignment_id:
      //       truck.assignment_id != null
      //         ? encryptJSAES(truck.assignment_id.toString())
      //         : null,
      //     truck_id:
      //       truck.truck_id != null
      //         ? encryptJSAES(truck.truck_id.toString())
      //         : truck.truck_id,
      //   })),
      // }));
      let sumOftruck = 0;
      const listsoflane = await Promise.all(
        cps.map(async (row) => {
          const truckCount = row.truck_info.length;
          const maxCapacity = row.max_capacity;
          const [listTypeTruck] = await this.databaseService.query(
            `SELECT allow_unit FROM cps WHERE cp_id = ${row.cp_id}`,
          );
          const truckTypes =
            listTypeTruck.allow_unit !== null
              ? listTypeTruck.allow_unit.replace(/\s/g, '').split(',')
              : [];
          const truck_info = await Promise.all(
            row.truck_info.map(async (truck) => {
              const data = await this.getRfidStatus(truck.truck_id);
              const validData =
                Array.isArray(data) && data.length > 0 ? data[0] : null;
              return {
                ...truck,
                assignment_id:
                  truck.assignment_id != null
                    ? encryptJSAES(truck.assignment_id.toString())
                    : null,
                truck_id:
                  truck.truck_id != null
                    ? encryptJSAES(truck.truck_id.toString())
                    : truck.truck_id,
                status_rfid: 'On Process',
                latest_cp: validData?.cp_name ?? null,
              };
            }),
          );
          const capacityPercentage = (truck_info.length / maxCapacity) * 100;
          const truckInfoAfterFilter = truck_info.filter(
            (truck) => truck.status_rfid !== 'Completed',
          );
          sumOftruck += truck_info.length;
          return {
            ...row,
            cp_id: encryptJSAES(row.cp_id.toString()),
            truck_info: truck_info,
            load_percentage: capacityPercentage,
            sum_truck_in_cp: truck_info.length + '/' + maxCapacity,
            listoftrucktype: truckTypes,
            available_truck:
              row.status === false && truckCount > 0 ? true : false,
          };
        }),
      );
      const lists = {
        last_updated: last_updated,
        total_trucks_in_cp: sumOftruck,
        cp_info: listsoflane,
      };
      //log_info+=`data:{JSON.stringify(lists)}`;
      Promise.resolve(
        this.errorHandler.saveLogToDB(
          'unit-on-cp',
          'getSummaryCPV2',
          'debug',
          log_info,
          null,
        ),
      );
      return { statusCode: 200, data: lists };
    } catch (error) {
      return error.message;
      this.errorHandler.throwBadRequestError(error, 'Data failed to query.');
    }
  }

  async findLaneByPositionBetween(start: number, end: number): Promise<any> {
    try {
      // Construct the SQL query using both `device_ids` and `items_ids`
      const query = `
         SELECT id, positioning
          FROM lanes
          WHERE positioning BETWEEN LEAST(${start},${end}) AND GREATEST(${start},${end})
        `;
      // Assuming `this.databaseService.query` executes the raw SQL query
      const data = await this.databaseService.query(query);
      return data;
    } catch (error) {
      // Handle the error and throw a custom error message
      this.errorHandler.throwBadRequestError(error, 'The data failed to query');
    }
  }
  async updatePositioning(
    newPosition: number,
    params: string,
    idencrypt?: string,
  ): Promise<any> {
    const dataLane = await this.laneRepository.findOneBy({
      positioning: newPosition,
    });
    if (params === UpdatePositioningEnum.CREATE) {
      if (dataLane) {
        const query =
          'SELECT id, lane_code, positioning FROM lanes ORDER BY positioning DESC LIMIT 1';
        // Assuming this.databaseService.query executes the raw SQL query
        const [data] = await this.databaseService.query(query);
        const listDataCp = await this.findLaneByPositionBetween(
          Number(dataLane.positioning),
          data.positioning,
        );
        for (const item of listDataCp) {
          const orderingPosition = Number(item.positioning) + 1;
          this.laneRepository.update(item.id, {
            positioning: orderingPosition,
          });
          this.errorHandler.logDebug('updated positioning cp');
        }
      }
    } else if (params === UpdatePositioningEnum.UPDATE) {
      this.errorHandler.logDebug('Processing updatePositioning');
      const newPos: reorderingPosition = {
        position: Number(newPosition),
      };
      await this.updatePositioningMaster(newPos, idencrypt);
    } else if (params === UpdatePositioningEnum.DELETE) {
      const query =
        'SELECT id, lane_name, positioning FROM lanes ORDER BY positioning DESC LIMIT 1';
      // Assuming this.databaseService.query executes the raw SQL query
      const [data] = await this.databaseService.query(query);
      const listDataCp = await this.findLaneByPositionBetween(
        Number(dataLane.positioning),
        data.positioning,
      );
      for (const item of listDataCp) {
        const orderingPosition = Number(item.positioning) - 1;
        this.laneRepository.update(item.id, {
          positioning: orderingPosition,
        });
        this.errorHandler.logDebug('updated positioning cp');
      }
    }
  }

  async updatePositioningMaster(
    newPos: reorderingPosition,
    id: string,
    authInfo?: JwtAuthResponse,
  ): Promise<any> {
    const dataCp = await this.laneRepository.findOneBy({
      id: Number(decryptJSAES(id)),
    });
    if (!dataCp) {
      return {
        statuscode: 400,
        message: 'Cp Not Found',
      };
    }
    try {
      const newPosition = newPos.position;
      const checkAvailablePosition = await this.laneRepository.findOneBy({
        positioning: newPosition,
      });
      if (checkAvailablePosition && dataCp.positioning > 0) {
        const currentPosition = dataCp.positioning;
        let oldPosition = 0;
        let downPosition = false;
        if (newPosition > currentPosition) {
          oldPosition = currentPosition + 1;
          downPosition = true;
        } else {
          oldPosition = currentPosition - 1;
          downPosition = false;
        }

        const data = await this.findLaneByPositionBetween(
          oldPosition,
          newPosition,
        );
        for (const item of data) {
          if (downPosition == true) {
            await this.laneRepository.update(item.id, {
              positioning: item.positioning - 1,
            });
          } else {
            await this.laneRepository.update(item.id, {
              positioning: item.positioning + 1,
            });
          }
        }
      }
      await this.laneRepository.update(dataCp.id, {
        positioning: newPosition,
      });

      await this.createLaneActivityLog(dataCp.id, {
        previous_positioning: dataCp.positioning,
        current_positioning: newPosition,
        updated_by: authInfo.email,
      });

      return {
        statuscode: 200,
        message: 'Reordering Successfully',
      };
    } catch (error) {
      this.errorHandler.logError('Error Reordering Master CP', error);
      return false;
    }
  }

  async getListTypeOfTruckAllowedOnLane(laneId: number): Promise<string[]> {
    const stringArray: string[] = [];

    try {
      const list = await this.databaseService.query(
        'select truck_type  from rulesofsimpang_bayah rb where lane_id = $1 group by truck_type ',
        [laneId],
      );
      if (list.length > 0) {
        for (const data of list) {
          stringArray.push(data.truck_type);
        }
      }
    } catch (error: any) {
      this.errorHandler.logError(
        'Ooops getListTypeOfTruckAllowedOnLane Error',
        error,
      );
    }

    return stringArray;
  }

  async undetectedTrucks(param: string): Promise<any> {
    let status = '';
    if (param == 'IN') {
      status = 'On Process';
    } else if (param == 'OUT') {
      status = 'Completed';
    } else {
      return {
        statusCode: 400,
        message: 'Invalid parameter',
      };
    }

    try {
      const query = `
        SELECT 
            t.nomor_lambung AS truck_info, 
            cps.cp_name,
            cps.cp_id, 
            rt.event_type,
            rt.rfid_reader_in_id,
            rt.rfid_reader_out_id,
            rt.created_at AS timestamp,
            rt.truck_id
        FROM 
            rfid_transaction rt
        JOIN 
            rfid_reader_in ri ON rt.rfid_reader_in_id = ri.rfid_reader_in_id
        LEFT JOIN 
            rfid_reader_out ro ON rt.rfid_reader_out_id = ro.rfid_reader_out_id
        JOIN 
            cp_detail cd ON ri.cp_detail_id = cd.cp_detail_id
        JOIN 
            cps ON cps.cp_id = cd.cp_id
        JOIN 
            trucks t ON rt.truck_id = t.id
        LEFT JOIN 
            cp_queue_assignments cqa ON rt.truck_id = cqa.truck_id
        WHERE 
            rt.event_type = '${status}'
            AND rt.is_valid = true
            AND cqa.truck_id IS NULL
            AND DATE(rt.created_at) = CURRENT_DATE
      `;

      const data = await this.databaseService.query(query);

      // Helper function to format the timestamp
      const formatTimestamp = (timestamp: string): string => {
        const date = new Date(timestamp);
        return date.toISOString().split('.')[0]; // Removes milliseconds
      };

      // Transform the result
      const groupedData = [];
      data.forEach((row) => {
        const {
          truck_info,
          cp_id,
          cp_name,
          rfid_reader_in_id,
          rfid_reader_out_id,
          event_type,
        } = row;
        const timestamp = formatTimestamp(row.timestamp);

        // Find an existing group for the same truck_info, event_type, and timestamp
        let group = groupedData.find(
          (item) =>
            item.truck_info === truck_info &&
            item.event_type === event_type &&
            item.cp_info.some((cp) => cp.timestamp === timestamp),
        );

        // If no group is found, create a new group
        if (!group) {
          group = {
            truck_info,
            event_type,
            rfid_reader_in_id,
            rfid_reader_out_id,
            cp_info: [],
          };
          groupedData.push(group);
        }

        // Add the cp_info entry to the group
        group.cp_info.push({
          cp_id: encryptJSAES(cp_id.toString()),
          cp_name,
          timestamp,
        });
      });

      return {
        statusCode: 200,
        data: groupedData,
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, error.message);
    }
  }

  async lanesActivityLog(page: number = 1, limit: number = 5): Promise<any> {
    try {
      let rawData = [];
      let totalData: number = 0;
      if (!page || !limit) {
        const [data, total] = await this.laneRepository.findAndCount({
          relations: ['logs'],
          order: { auditupdate: 'DESC' },
          where: {
            deleted_at: null,
          },
        });
        totalData = total;
        rawData = data;
      } else {
        const [data, total] = await this.laneRepository.findAndCount({
          skip: (page - 1) * limit,
          relations: ['logs'],
          take: limit,
          order: { id: 'DESC' },
          where: {
            deleted_at: null,
          },
        });
        rawData = data;
        totalData = total;
      }

      const result = rawData.map((item) => {
        return {
          id: encryptJSAES(item.id.toString()),
          lane_code: item.lane_code,
          lane_name: item.lane_name,
          status: item.status,
          positioning: item.positioning,
          reason_off: item.reason_off,
          logs: item.logs
            .sort((a, b) => b.auditupdate - a.auditupdate)
            .filter((_, index) => index === 0)
            .map((logItem) => {
              return {
                id: encryptJSAES(logItem.id.toString()),
                previous_lane_name: logItem.previous_lane_name,
                current_lane_name: logItem.current_lane_name,
                previous_status: logItem.previous_status,
                current_status: logItem.current_status,
                previous_positioning: logItem.previous_positioning,
                current_positioning: logItem.current_positioning,
                reason: logItem.reason,
                auditupdate: logItem.auditupdate,
                updated_by: logItem.updated_by,
              };
            }),
        };
      });

      return {
        statusCode: 200,
        data: result,
        total: totalData,
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, error.message);
    }
  }

  async lanesActivityLogByLaneId(
    laneId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<any> {
    try {
      const lane = await this.laneRepository.findOneBy({
        id: Number(decryptJSAES(laneId)),
      });
      if (!lane) {
        return {
          statuscode: 400,
          message: 'Lane is not found',
        };
      }

      let rawData = [];
      let totalData: number = 0;
      if (!page || !limit) {
        const [data, total] =
          await this.lanesActivityLogRepository.findAndCount({
            order: { auditupdate: 'DESC' },
            where: {
              lane_id: lane.id,
            },
          });
        totalData = total;
        rawData = data;
      } else {
        const [data, total] =
          await this.lanesActivityLogRepository.findAndCount({
            skip: (page - 1) * limit,
            take: limit,
            order: { id: 'DESC' },
            where: {
              lane_id: lane.id,
            },
          });
        rawData = data;
        totalData = total;
      }

      const result = {
        id: encryptJSAES(lane.id.toString()),
        lane_code: lane.lane_code,
        lane_name: lane.lane_name,
        status: lane.status,
        positioning: lane.positioning,
        reason_off: lane.reason_off,
        logs: rawData.map((logItem) => {
          return {
            id: encryptJSAES(logItem.id.toString()),
            previous_lane_name: logItem.previous_lane_name,
            current_lane_name: logItem.current_lane_name,
            previous_status: logItem.previous_status,
            current_status: logItem.current_status,
            previous_positioning: logItem.previous_positioning,
            current_positioning: logItem.current_positioning,
            reason: logItem.reason,
            auditupdate: logItem.auditupdate,
            updated_by: logItem.updated_by,
          };
        }),
      };

      return {
        statusCode: 200,
        data: result,
        total: totalData,
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, error.message);
    }
  }

  async sendDataToWebSocket(
    fromId?: number,
    toId?: number,
    event?: string,
    dataGeofence?: number[],
    trigger?: string,
  ): Promise<void> {
    try {
      //const socketClient = SocketClientService.getInstance();
      const socketClient = this.socketClientService.getSocket();
      if (
        fromId === null &&
        dataGeofence.length > 0 &&
        event === WebSocketAntrianCp.LANETOLANE
      ) {
        try {
          const dataAntrian = await this.getDataAntrian(
            dataGeofence,
            trigger ?? WebSocketAntrianCp.LANETOLANE,
          );
          this.errorHandler.logDebug(
            `{ dataSocketAntrianLanetolane: ${JSON.stringify(dataAntrian)}}`,
          );
          if (dataAntrian || dataAntrian.length > 0) {
            socketClient.emit('lane_info', {
              data: dataAntrian ?? {},
            });
          }
          // await this.webSocketGateway.handleCpInfo(dataAntrian);
        } catch (error) {
          this.errorHandler.logError(
            'Ooops Error Send WebSocket GEOFENCE TO LANE',
            error,
          );
        }
      }
      if (event === WebSocketAntrianCp.LANETOCP) {
        try {
          const dataCp = await this.getDataCp(
            toId,
            trigger ?? WebSocketAntrianCp.LANETOCP,
          );
          const dataLane = await this.getDataAntrian(
            fromId,
            trigger ?? WebSocketAntrianCp.LANETOCP,
          );
          if (dataLane) {
            socketClient.emit('lane_info', {
              data: dataLane ?? {},
            });
          }
          if (dataCp) {
            socketClient.emit('cp_info', {
              data: dataCp ?? {},
            });
          }
        } catch (error) {
          this.errorHandler.logError(
            'Ooops Error Send WebSocket LANE TO CP',
            error,
          );
        }
      }
      if (event === WebSocketAntrianCp.LANETOLANE) {
        try {
          const dataAntrian = await this.getDataAntrian(
            [fromId, toId],
            trigger ?? WebSocketAntrianCp.LANETOLANE,
          );
          if (dataAntrian) {
            socketClient.emit('lane_info', {
              data: dataAntrian ?? {},
            });
          }
          // await this.webSocketGateway.handleCpInfo(dataAntrian);
        } catch (error) {
          this.errorHandler.logError(
            'Ooops Error Send WebSocket LANE TO LANE',
            error,
          );
        }
      }
      if (event === WebSocketAntrianCp.CPTOCP) {
        try {
          this.errorHandler.logDebug(`{fromID: ${fromId}}`);
          this.errorHandler.logDebug(`{toId: ${toId}}`);
          const dataCp = await this.getDataCp(
            [fromId, toId],
            trigger ?? WebSocketAntrianCp.CPTOCP,
          );
          this.errorHandler.logDebug(
            `{ DataCPTOCP: ${JSON.stringify(dataCp)}}`,
          );
          if (dataCp) {
            socketClient.emit('cp_info', {
              data: dataCp ?? {},
              logging: trigger ?? WebSocketAntrianCp.CPTOCP,
            });
          }
        } catch (error) {
          this.errorHandler.logError('Error Send WebSocket CP TO CP', error);
        }
      }
      if (event === WebSocketAntrianCp.COMPLETED) {
        try {
          this.errorHandler.logDebug(`{fromID: ${fromId}`);
          this.errorHandler.logDebug(`{toId: ${toId}}`);
          const dataCp = await this.getDataCp(
            fromId,
            trigger ?? WebSocketAntrianCp.COMPLETED,
          );
          this.errorHandler.logDebug(`{DataCPTOCP: ${JSON.stringify(dataCp)}}`);
          if (dataCp) {
            socketClient.emit('cp_info', {
              data: dataCp ?? {},
              logging: trigger ?? WebSocketAntrianCp.COMPLETED,
            });
          }
        } catch (error) {
          this.errorHandler.logError('Ooops Send WebSocket COMPLETED', error);
        }
      }

      if (event === WebSocketAntrianCp.CPTOLANE) {
        try {
          const dataCp = await this.getDataCp(
            fromId,
            trigger ?? WebSocketAntrianCp.CPTOLANE,
          );
          const dataLane = await this.getDataAntrian(
            toId,
            trigger ?? WebSocketAntrianCp.CPTOLANE,
          );
          if (dataCp) {
            socketClient.emit('cp_info', {
              data: dataCp ?? {},
              logging: trigger ?? WebSocketAntrianCp.LANETOCP,
            });
          }
          if (dataLane) {
            socketClient.emit('lane_info', {
              data: dataLane ?? {},
              logging: trigger ?? WebSocketAntrianCp.LANETOCP,
            });
          }
        } catch (error) {
          this.errorHandler.logError(
            'Ooops Error Send WebSocket LANE TO CP',
            error,
          );
        }
      }
    } catch (error) {
      this.errorHandler.logError(
        'Ooops Error Send WebSocket Antrian Cp',
        error,
      );
    }
  }

  private async getDataCp(
    cpId: number | number[],
    trigger: string,
  ): Promise<any> {
    try {
      const cpIdCondition = Array.isArray(cpId)
        ? `IN (${cpId.join(',')})`
        : `= ${cpId}`;

      const dataCp = await this.databaseService.query(`
        SELECT json_build_object(
        'total_trucks_in_cp',
          (
              SELECT COUNT(1)
              FROM cp_queue_assignments cqa
              INNER JOIN cps ON cqa.cp_queue_id = cps.cp_id
              INNER JOIN trucks t ON cqa.truck_id=t.id
              WHERE cqa.exit_time IS NOT NULL
              AND cqa.status != 'COMPLETED'
              AND cqa.cp_queue_id IS NOT NULL
          ),
          'cp_info',
          (
              SELECT jsonb_agg(a)
              FROM (
                  SELECT
                      cps.cp_id,
                      cps.cp_name,
                      cps.max_capacity,
                      cps.positioning,
                      cps.priority_update_status,
                      cps.auditupdate,
                      (
                          SELECT array_agg(abbreviate_words(t.typeoftruck))
                          FROM (
                              SELECT t.typeoftruck
                              FROM cp_queue_assignments cqa
                              INNER JOIN trucks t ON cqa.truck_id = t.id
                              WHERE cqa.cp_queue_id = cps.cp_id
                              AND cqa.exit_time IS NOT NULL
                              AND cqa.status != 'COMPLETED'
                              AND cqa.cp_queue_id IS NOT NULL
                              GROUP BY t.typeoftruck
                          ) t
                      ) AS listoftrucktype,
                      COALESCE(
                          (
                              SELECT jsonb_agg(
                                  jsonb_build_object(
                                      'name_lane', rlc.name_queue_lane
                                  )
                              )
                              FROM rule_lane_cp rlc
                              WHERE rlc.cp_id = cps.cp_id
                          ),
                          '[]'
                      ) AS rule_lane,
                      COALESCE(
                          (
                              SELECT jsonb_agg(
                                  jsonb_build_object(
                                      'name', cpd.cp_entrance_type_name
                                  )
                              )
                              FROM cp_entrance_detail cpd
                              WHERE cpd.cp_id = cps.cp_id
                          ),
                          '[]'
                      ) AS entrance_details,
                      COALESCE(
                          (
                              SELECT jsonb_agg(
                                  jsonb_build_object(
                                      'name', ced.cp_exit_type_name
                                  )
                              )
                              FROM cp_exit_detail ced
                              WHERE ced.cp_id = cps.cp_id
                          ),
                          '[]'
                      ) AS exit_details,
                      COALESCE(
                              (
                                  SELECT ct.value
                                  FROM cp_tonages ct
                                  WHERE ct.cp_id = cps.cp_id
                              ),
                              0
                          ) AS tonages,
                      cps.status,
                      CONCAT(
                          COALESCE(
                              (
                                  SELECT COUNT(1)
                                  FROM cp_queue_assignments cqa
                                  INNER JOIN trucks t ON cqa.truck_id = t.id 
                                  WHERE cqa.cp_queue_id = cps.cp_id
                                  AND cqa.exit_time IS NOT NULL
                                  AND cqa.status != 'COMPLETED'
                                  AND cqa.cp_queue_id IS NOT NULL
                              ),
                              0
                          ),
                          '/',
                          cps.max_capacity
                      ) AS sum_truck_in_cp,
                      COALESCE(
                          (
                              SELECT jsonb_agg(
                                  jsonb_build_object(
                                      'assignment_id', cqa.assignment_id,
                                      'truck_id', cqa.truck_id,
                                      'nomor_lambung', cqa.nomor_lambung,
                                      'driver', CONCAT('Driver-', cqa.nomor_lambung)
                                  )
                              )
                              FROM cp_queue_assignments cqa
                              INNER JOIN trucks t ON cqa.truck_id = t.id
                              WHERE cqa.cp_queue_id = cps.cp_id
                              AND cqa.exit_time IS NOT NULL
                              AND cqa.status != 'COMPLETED'
                              AND cqa.cp_queue_id IS NOT NULL
                          ),
                          '[]'
                      ) AS truck_info
                  FROM cps
                  WHERE cps.cp_id ${cpIdCondition}
              ) a
          )
      ) AS result;
        `);

      const cps = dataCp[0].result.cp_info;
      const sumofqueue = dataCp[0].result.total_trucks_in_cp;
      const last_updated = new Date(
        new Date().getTime() + 8 * 60 * 60 * 1000,
      ).toISOString();
      let sumOftruck = 0;
      const listsoflane = await Promise.all(
        cps.map(async (row) => {
          const truckCount = row.truck_info.length;
          const maxCapacity = row.max_capacity;
          const [listTypeTruck] = await this.databaseService.query(
            `SELECT allow_unit FROM cps WHERE cp_id = ${row.cp_id}`,
          );
          const truckTypes =
            listTypeTruck.allow_unit !== null
              ? listTypeTruck.allow_unit.replace(/\s/g, '').split(',')
              : [];
          const truck_info = await Promise.all(
            row.truck_info.map(async (truck) => {
              const data = await this.getRfidStatus(truck.truck_id);
              const validData =
                Array.isArray(data) && data.length > 0 ? data[0] : null;
              return {
                ...truck,
                assignment_id:
                  truck.assignment_id != null
                    ? encryptJSAES(truck.assignment_id.toString())
                    : null,
                truck_id:
                  truck.truck_id != null
                    ? encryptJSAES(truck.truck_id.toString())
                    : truck.truck_id,
                status_rfid: 'On Process',
                latest_cp: validData?.cp_name ?? null,
              };
            }),
          );
          sumOftruck += truck_info.length;
          const capacityPercentage = (truck_info.length / maxCapacity) * 100;
          return {
            ...row,
            cp_id: encryptJSAES(row.cp_id.toString()),
            truck_info: truck_info,
            load_percentage: capacityPercentage,
            sum_truck_in_cp: truck_info.length + '/' + maxCapacity,
            listoftrucktype: truckTypes,
            available_truck:
              row.status === false && truckCount > 0 ? true : false,
          };
        }),
      );

      this.errorHandler.logDebug(
        `{ DataAntrianCp:${JSON.stringify(listsoflane)}`,
      );
      return {
        last_updated: last_updated,
        total_trucks_in_cp: sumofqueue,
        cp_info: listsoflane,
        trigger: trigger,
      };
    } catch (error) {
      this.errorHandler.logError('Ooops Error Get data Cp', error);
    }
  }

  private async getDataAntrian(
    laneId: number | number[],
    trigger: string,
  ): Promise<any> {
    this.errorHandler.logDebug(`{ LaneIDDataAntrian: ${laneId}}`);
    try {
      const laneIdCondition = Array.isArray(laneId)
        ? `IN (${laneId.join(',')})`
        : `= ${laneId}`;
      const dataAntrian = await this.databaseService.query(`
        SELECT json_build_object(
          'sum_queue_in_cp',
              (SELECT COUNT(1)
              FROM cp_queue_assignments cqa 
              INNER JOIN queue_lane l ON cqa.lane_id = l.id
              INNER JOIN trucks t ON cqa.truck_id = t.id
              WHERE cqa.exit_time IS NULL
              AND cqa.status = 'WAITING'
              AND cqa.lane_id IS NOT NULL),
          'lane_info',
              (
                  SELECT jsonb_agg(a)
                  FROM (
                      SELECT
                          l.id,
                          l.lane_name,
                          l.max_capacity,
                          l.positioning,
                          l.audit_update,
                          (
                              SELECT array_agg(DISTINCT abbreviate_words(t.typeoftruck))  -- Add DISTINCT to avoid duplicates
                              FROM (
                                  SELECT t.typeoftruck
                                  FROM cp_queue_assignments cqa
                                  INNER JOIN trucks t ON cqa.truck_id = t.id
                                  WHERE cqa.lane_id = l.id
                                  AND cqa.exit_time IS NULL
                                  AND cqa.status = 'WAITING'
                                  AND cqa.lane_id IS NOT NULL
                                  GROUP BY t.typeoftruck
                              ) t 
                          ) AS listoftrucktype,
                          l.status,
                          COALESCE(
                              (
                                  SELECT jsonb_agg(jsonb_build_object(
                                      'assignment_id', cqa.assignment_id,
                                      'truck_id', cqa.truck_id,
                                      'nomor_lambung', cqa.nomor_lambung,
                                      'driver', cqa.driver_name
                                  ))
                                  FROM cp_queue_assignments cqa
                                  INNER JOIN trucks t ON cqa.truck_id = t.id
                                  WHERE cqa.lane_id = l.id
                                  AND cqa.exit_time IS NULL
                                  AND cqa.status = 'WAITING'
                                  AND cqa.lane_id IS NOT NULL
                              ),
                              '[]'
                          ) AS truck_info
                      FROM queue_lane l
                      WHERE l.id ${laneIdCondition}
                  ) a
              )
      ) result;
        `);
      const lanes = dataAntrian[0].result.lane_info;
      const sum_queue_in_cp = dataAntrian[0].result.sum_queue_in_cp;
      const listsoflane = await Promise.all(
        lanes.map(async (row) => {
          // Query untuk mendapatkan ruleLane
          const ruleLane = await this.databaseService.query(
            `SELECT cp.cp_name
             FROM cps cp
             INNER JOIN rule_lane_cp rlc ON rlc.cp_id = cp.cp_id
             WHERE rlc.queue_lane_id = ${row.id}`,
          );

          const listTypeTruck = await this.databaseService.query(
            `SELECT truck_type FROM queue_lane_rules WHERE queue_lane_id = ${row.id}`,
          );
          const truckTypes = [
            ...new Set(listTypeTruck.map((item) => item.truck_type)),
          ];
          const truckLenght = row.truck_info.length;
          return {
            ...row,
            id: encryptJSAES(row.id.toString()),
            sumoftruck: `${
              Array.isArray(row.truck_info) ? row.truck_info.length : 0
            }/${row.max_capacity}`,
            load_percentage: row.max_capacity
              ? Array.isArray(row.truck_info)
                ? (row.truck_info.length / row.max_capacity) * 100
                : 0
              : 0,
            rules_lane: ruleLane.map((rule) => ({
              cp_name: rule.cp_name,
            })),
            listoftrucktype: truckTypes ? truckTypes : [],
            available_truck:
              row.status === false && truckLenght > 0 ? true : false,
            truck_info: Array.isArray(row.truck_info)
              ? row.truck_info.map((truck) => ({
                  ...truck,
                  assignment_id:
                    truck.assignment_id != null
                      ? encryptJSAES(truck.assignment_id.toString())
                      : null,
                  truck_id:
                    truck.truck_id != null
                      ? encryptJSAES(truck.truck_id.toString())
                      : truck.truck_id,
                }))
              : [],
          };
        }),
      );
      const last_updated = new Date(
        new Date().getTime() + 8 * 60 * 60 * 1000,
      ).toISOString();

      const lists = {
        last_updated: last_updated,
        sum_queue_in_cp: sum_queue_in_cp,
        lane_info: listsoflane,
        trigger: trigger,
      };
      this.errorHandler.logDebug(`{ listDataAntrian:${JSON.stringify(lists)}}`);
      return lists;
    } catch (error) {
      this.errorHandler.logError('Ooops Error Get data Antrian Cp', error);
    }
  }

  async getCountTruckOfSimpangBayahKM(): Promise<any> {
    const query = this.queryLoader.getQueryById(
      'count_truck_from_geofence_kafka',
    );
    const data = await this.databaseService.query(query, []);

    return {
      statusCode: 200,
      message: 'Success',
      data: data,
    };
  }
}
