import { ErrorHandlerService } from '@utils/error-handler.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { QueueLane } from './entities/queue_lane.entity';
import { QueueLaneRules } from './entities/queue_lane_rule.entity';
import { decryptJSAES, encryptJSAES } from '@utils/functions.service';
import { DatabaseService } from '@utils/database.service';
import { ValidationService } from '@utils/validation-service';
import {
  createQueueLaneActivityLog,
  CreateQueueLaneDto,
  UpdateQueueLaneDto,
} from './dto';
import { JwtAuthResponse } from 'src/auth/dto/auth.dto';
import { dtoStatusCP } from 'src/cp/dto/status.dto';
import { reorderingPosition } from 'src/cp/dto/checkStatusCp.dto';
import { UpdatePositioningEnum } from '@utils/enums';
import {
  QueueLanesActivityLog,
  QueueLanesActivityLogStatus,
} from './entities/queue_lanes_activity_log.entity';
import { RulesLaneQueueLane } from './entities/rule_lane_queue_lane.entity';
import { Lanes } from 'src/lane/entities/lane.entity';

@Injectable()
export class QueueLaneService {
  private queueLane: QueueLane;
  constructor(
    @InjectRepository(QueueLane)
    private queueLaneRepository: Repository<QueueLane>,
    @InjectRepository(QueueLaneRules)
    private queueLaneRulesRepository: Repository<QueueLaneRules>,
    @InjectRepository(Lanes)
    private lanesRepository: Repository<Lanes>,
    @InjectRepository(RulesLaneQueueLane)
    private rulesLaneQueueLaneRepository: Repository<RulesLaneQueueLane>,
    @InjectRepository(QueueLanesActivityLog)
    private queueLanesActivityLogRepository: Repository<QueueLanesActivityLog>,
    private databaseService: DatabaseService,
    private readonly errorHandler: ErrorHandlerService,
    private validationService: ValidationService,
  ) {}

  async create(
    createLaneDto: CreateQueueLaneDto,
    authInfo: JwtAuthResponse,
  ): Promise<any> {
    const { rules, rules_type_truck, rules_lanes, ...laneData } = createLaneDto;
    laneData.created_by = authInfo.id;
    laneData.positioning = createLaneDto.positioning;
    const truckTypesString = rules_type_truck.join(',');
    const createQueueLane = {
      ...laneData,
      allow_unit: truckTypesString,
    };
    try {
      await this.updatePositioning(
        createLaneDto.positioning,
        UpdatePositioningEnum.CREATE,
      );
      const queueLane = this.queueLaneRepository.create(createQueueLane);
      await this.queueLaneRepository.save(queueLane);
      if (rules && Array.isArray(rules) && rules.length > 0) {
        const ruleofqueuelane = this.queueLaneRulesRepository.create(
          rules.map((rule) => ({
            queue_lane_id: queueLane.id,
            max_capacity: rule.max_capacity,
            truck_type: rule.truck_type,
            created_by: authInfo.id,
          })),
        );
        await this.queueLaneRulesRepository.save(ruleofqueuelane);
      }

      if (rules_lanes && Array.isArray(rules_lanes) && rules_lanes.length > 0) {
        const rulesLaneIds = rules_lanes.map((item) =>
          Number(decryptJSAES(item)),
        );
        const lanes = await this.lanesRepository.find({
          where: {
            id: In(rulesLaneIds),
          },
          select: ['id', 'lane_name'],
        });
        const ruleLaneQueueLane = this.rulesLaneQueueLaneRepository.create(
          rulesLaneIds.map((rule_lane_id) => ({
            queue_lane_id: queueLane.id,
            queue_lane_name: queueLane.lane_name,
            lane_id: rule_lane_id,
            lane_name:
              lanes.find((lane) => String(lane.id) === String(rule_lane_id))
                ?.lane_name ?? null,
          })),
        );
        await this.rulesLaneQueueLaneRepository.save(ruleLaneQueueLane);
      }
      await this.createQueueLaneActivityLog(queueLane.id, {
        current_queue_lane_name: createLaneDto.lane_name,
        reason: null,
        current_positioning: createLaneDto.positioning,
        updated_by: authInfo.email,
      });
      return {
        statusCode: 200,
        message: 'Data was saved successfully',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async createQueueLaneActivityLog(
    queueLaneId: number,
    dto: Partial<createQueueLaneActivityLog>,
  ): Promise<any> {
    try {
      const createLog = {
        queue_lane_id: queueLaneId,
        previous_queue_lane_name: dto.previous_queue_lane_name ?? null,
        current_queue_lane_name: dto.current_queue_lane_name ?? null,
        previous_status: dto.previous_status ?? null,
        current_status: dto.current_status ?? null,
        reason: dto.reason ?? null,
        previous_positioning: dto.previous_positioning ?? null,
        current_positioning: dto.current_positioning ?? null,
        updated_by: dto.updated_by,
      };
      this.errorHandler.logDebug(
        `Starting Create Log Status  ${dto.current_queue_lane_name}`,
      );
      const log = this.queueLanesActivityLogRepository.create(createLog);
      await this.queueLanesActivityLogRepository.save(log);
      this.errorHandler.logDebug(
        `Success Create Log Status   ${dto.current_queue_lane_name}`,
      );
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.queueLaneRepository.findAndCount({
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
  async findAll(q: string, metadata: Record<string, any>): Promise<any> {
    try {
      const rppjCount = await this.databaseService.query(`
        SELECT 
            ql.id as id,
              ql.lane_name  as name,
              COALESCE(COUNT(cqa.cp_queue_id), 0) AS count_assigned
          FROM public.queue_lane ql
          LEFT JOIN public.cp_queue_assignments cqa 
              ON ql.id = cqa.cp_queue_id   
              AND cqa.status = 'WAITING'
          GROUP BY ql.id, ql.lane_name;
        `);

      const geofenceCount = await this.databaseService.query(`
         select ql.id id, 
          ql.lane_name name, 
          coalesce(count(gsl.geofence_target_value),0) as count_assigned
          from public.queue_lane ql
          left join public.geofence_service_logs gsl on gsl.geofence_target_value = ql.geofence_kode
          group by ql.id, ql.lane_name;
          `);

      const siCantikCount = await this.databaseService.query(`
              select ql.id id, 
            ql.lane_name name, 
            dcs.total_vehicles count_assigned
            from public.queue_lane ql
            left join public.dt_count_sicantik dcs  on dcs.camera = ql.sicantik_code;
          `);
      const queueLanes = await this.queueLaneRepository.find({
        select: [
          'id',
          'lane_name',
          'max_capacity',
          'status',
          'positioning',
          'reason_off',
          'allow_unit',
          'lane_code',
        ],
        relations: [
          'rules',
          'rules_lane_cp',
          'vidiotron_lane',
          'vidiotron_lane.vidiotron',
          'rules_lane_queue_lane',
        ],
        order: {
          positioning: 'ASC',
        },
        where: {
          deleted_at: null,
        },
      });

      const results = queueLanes.map((queueLane) => {
        const { vidiotron_lane, ...rest } = queueLane;
        const rppjCountPerCp = rppjCount.find(
          (item) => String(item.id) === String(queueLane.id),
        );
        const geofenceCountPerCp = geofenceCount.find(
          (item) => String(item.id) === String(queueLane.id),
        );
        const siCantikCountPerCp = siCantikCount.find(
          (item) => String(item.id) === String(queueLane.id),
        );
        return {
          ...rest,
          rules: queueLane.rules,
          vidiotron: queueLane.vidiotron_lane?.vidiotron
            ? { ip: queueLane.vidiotron_lane.vidiotron.ip }
            : null,
          rules_lane_queue_lane: queueLane.rules_lane_queue_lane,
          truck_count: {
            rppj: !rppjCountPerCp ? 0 : Number(rppjCountPerCp.count_assigned),
            geofence: !geofenceCountPerCp
              ? 0
              : Number(geofenceCountPerCp.count_assigned),
            sicantik: !siCantikCountPerCp
              ? 0
              : Number(siCantikCountPerCp.count_assigned),
          },
        };
      });
      const lists = await Promise.all(
        results.map(async (row) => {
          const rulesLaneCP = await Promise.all(
            row.rules_lane_cp.map(async (rule) => {
              const [cp] = await this.databaseService.query(
                `SELECT cp_name FROM cps WHERE cp_id = ${rule.cp_id}`,
              );
              return {
                cp_id: encryptJSAES(rule.cp_id.toString()),
                cp_name: cp?.cp_name || null,
              };
            }),
          );
          const { reason_off, ...updateRow } = row;
          return {
            ...updateRow,
            rules: row.rules.map((rule) => ({
              max_capacity: rule.max_capacity,
              truck_type: rule.truck_type,
            })),
            allow_unit: row.allow_unit
              ? row.allow_unit.replace(/\s/g, '').split(',')
              : [],
            rules_lane_cp: rulesLaneCP,
            id: encryptJSAES(row.id.toString()),
            reason_status: reason_off !== null ? reason_off : '',
          };
        }),
      );

      return { statusCode: 200, data: lists };
    } catch (error) {
      this.errorHandler.saveLogToDB(
        'list-QueueLanes',
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
    const queueLane = await this.queueLaneRepository.findOne({
      where: {
        id: idupdate,
        deleted_at: null,
      },
      relations: [
        'rules',
        'rules_lane_cp',
        'vidiotron_lane',
        'vidiotron_lane.vidiotron',
        'rules_lane_queue_lane',
      ],
    });
    if (!queueLane) throw new NotFoundException(`Lane with ID ${id} not found`);
    const [rppjCount] = await this.databaseService.query(`
      select count(*) count_assigned from public.cp_queue_assignments cqa where cqa.cp_queue_id = ${queueLane.id} and cqa.status = 'WAITING' group by cqa.cp_queue_id;
       `);
    const [geofenceCount] = await this.databaseService.query(`
      select ql.id id, 
        ql.lane_name name, 
        coalesce(count(gsl.geofence_target_value),0) as count_assigned
        from public.queue_lane ql
        left join public.geofence_service_logs gsl on gsl.geofence_target_value = ql.geofence_kode
        where ql.id = ${queueLane.id}
        group by ql.id, ql.lane_name;
         `);

    const [siCantikCount] = await this.databaseService.query(`
       select ql.id id, 
            ql.lane_name name, 
            dcs.total_vehicles count_assigned
            from public.queue_lane ql
            left join public.dt_count_sicantik dcs  on dcs.camera = ql.sicantik_code
			      where ql.id = ${queueLane.id};
        `);
    const { vidiotron_lane, ...rest } = queueLane;
    const result = {
      ...rest,
      vidiotron: queueLane.vidiotron_lane?.vidiotron
        ? { ip: queueLane.vidiotron_lane.vidiotron.ip }
        : null,
      rules_lane_queue_lane: queueLane.rules_lane_queue_lane,
      truck_count: {
        rppj: !rppjCount ? 0 : Number(rppjCount.count_assigned),
        geofence: !geofenceCount ? 0 : Number(geofenceCount.count_assigned),
        sicantik: !siCantikCount ? 0 : Number(siCantikCount.count_assigned),
      },
    };
    const rulesLaneCp = await Promise.all(
      result.rules_lane_cp.map(async (rule) => {
        const [cp] = await this.databaseService.query(
          `SELECT cp_name FROM cps WHERE cp_id = ${rule.cp_id}`,
        );
        return {
          cp_id: encryptJSAES(rule.cp_id.toString()),
          cp_name: cp?.cp_name || null,
        };
      }),
    );
    const { reason_off, ...updateRow } = result;

    const updatedLane = {
      ...updateRow,
      rules: result.rules.map((rule) => ({
        max_capacity: rule.max_capacity,
        truck_type: rule.truck_type,
      })),
      allow_unit: result.allow_unit
        ? result.allow_unit.replace(/\s/g, '').split(',')
        : [],
      rules_lane_cp: rulesLaneCp,
      id: encryptJSAES(result.id.toString()),
      reason_status: reason_off !== null ? reason_off : '',
    };

    return updatedLane;
  }

  async update(
    id: string,
    updateLaneDto: UpdateQueueLaneDto,
    authInfo: JwtAuthResponse,
  ): Promise<any> {
    const { rules, rules_type_truck, reason_status, rules_lanes, ...laneData } =
      updateLaneDto;
    laneData.updated_by = authInfo.id;
    const idupdate = Number(decryptJSAES(id));
    const truckTypesString = rules_type_truck.join(',');
    try {
      const checkData = await this.queueLaneRepository.findOne({
        where: { id: idupdate },
      });
      if (checkData.positioning !== laneData.positioning) {
        await this.updatePositioning(
          updateLaneDto.positioning,
          UpdatePositioningEnum.UPDATE,
          id,
        );
      }
      const updateData = {
        ...laneData,
        allow_unit: truckTypesString,
        positioning: laneData.positioning,
        reason_off: reason_status,
      };
      await this.queueLaneRepository.update(idupdate, updateData);
      if (rules && Array.isArray(rules) && rules.length > 0) {
        const checkDataQueueLaneRules =
          await this.queueLaneRulesRepository.findOneBy({
            queue_lane_id: idupdate,
          });
        if (checkDataQueueLaneRules) {
          await this.queueLaneRulesRepository.delete(
            checkDataQueueLaneRules.id,
          );
        }
        for (const rule of rules) {
          const newRule = this.queueLaneRulesRepository.create({
            queue_lane_id: idupdate,
            max_capacity: rule.max_capacity,
            truck_type: rule.truck_type,
            created_by: authInfo.id,
          });
          await this.queueLaneRulesRepository.save(newRule);
        }
      }
      if (rules_lanes && Array.isArray(rules_lanes) && rules_lanes.length > 0) {
        const checkDataRulesLaneQueueLane =
          await this.rulesLaneQueueLaneRepository.findOneBy({
            queue_lane_id: idupdate,
          });
        if (checkDataRulesLaneQueueLane) {
          await this.queueLaneRulesRepository.delete(
            checkDataRulesLaneQueueLane.id,
          );
        }
        const rulesLaneIds = rules_lanes.map((item) =>
          Number(decryptJSAES(item)),
        );
        const lanes = await this.lanesRepository.find({
          where: {
            id: In(rulesLaneIds),
          },
          select: ['id', 'lane_name'],
        });

        for (const ruleLaneId of rulesLaneIds) {
          const newRulesLaneQueueLane =
            this.rulesLaneQueueLaneRepository.create({
              queue_lane_id: idupdate,
              queue_lane_name: updateData.lane_name,
              lane_id: ruleLaneId,
              lane_name:
                lanes.find((lane) => String(lane.id) === String(ruleLaneId))
                  ?.lane_name ?? null,
            });
          await this.rulesLaneQueueLaneRepository.save(newRulesLaneQueueLane);
        }
      }
      this.createQueueLaneActivityLog(checkData.id, {
        previous_queue_lane_name: checkData.lane_name,
        current_queue_lane_name: updateData.lane_name,
        previous_status: checkData.status
          ? QueueLanesActivityLogStatus.OPERATIONAL
          : QueueLanesActivityLogStatus.NON_OPERATIONAL,
        current_status: updateData.status
          ? QueueLanesActivityLogStatus.OPERATIONAL
          : QueueLanesActivityLogStatus.NON_OPERATIONAL,
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
      await this.queueLaneRepository.update(idupdate, {
        status: updateCpDto.status,
        reason_off: updateCpDto.reason,
      });
      const data = await this.findOne(id);
      const queueLane = await this.queueLaneRepository.findOne({
        where: {
          id: idupdate,
          deleted_at: null,
        },
      });
      await this.createQueueLaneActivityLog(data.id, {
        previous_status: data.status
          ? QueueLanesActivityLogStatus.OPERATIONAL
          : QueueLanesActivityLogStatus.NON_OPERATIONAL,
        current_status: updateCpDto.status
          ? QueueLanesActivityLogStatus.OPERATIONAL
          : QueueLanesActivityLogStatus.NON_OPERATIONAL,
        reason: updateCpDto.reason,
        updated_by: authInfo.email,
      });
      return {
        statusCode: 200,
        message: 'Status Queue Cp Successfully Updated',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async remove(id: string, authInfo: JwtAuthResponse): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    try {
      const checkData = await this.queueLaneRepository.findOne({
        where: {
          id: idupdate,
        },
      });
      if (!checkData) {
        throw new NotFoundException(`Queue Lane with ID ${id} not found`);
      }
      await this.updatePositioning(
        checkData.positioning,
        UpdatePositioningEnum.DELETE,
      );

      const result = await this.queueLaneRepository.update(idupdate, {
        deleted_at: new Date(),
        deleted_by: 'ADMIN',
      });
      const checkRuleQueueLane = await this.queueLaneRulesRepository.findOneBy({
        queue_lane_id: idupdate,
      });
      if (checkRuleQueueLane) {
        await this.queueLaneRulesRepository.delete({ queue_lane_id: idupdate });
      }
      this.createQueueLaneActivityLog(checkData.id, {
        previous_status: checkData.status
          ? QueueLanesActivityLogStatus.OPERATIONAL
          : QueueLanesActivityLogStatus.NON_OPERATIONAL,
        current_status: QueueLanesActivityLogStatus.DELETED,
        updated_by: authInfo.email,
      });
      return {
        statusCode: 200,
        message: 'Data was Delete successfully',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'The data was failed to delete.',
      );
    }
  }

  async findCpByPositionBetween(start: number, end: number): Promise<any> {
    try {
      // Construct the SQL query using both `device_ids` and `items_ids`
      const query = `
         SELECT id, lane_name, positioning
          FROM queue_lane
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
  //
  async updatePositioning(
    newPosition: number,
    params: string,
    idencrypt?: string,
  ): Promise<any> {
    const dataLane = await this.queueLaneRepository.findOneBy({
      positioning: newPosition,
    });
    if (params === UpdatePositioningEnum.CREATE) {
      if (dataLane) {
        const query =
          'SELECT id, lane_name, positioning FROM queue_lane ORDER BY positioning DESC LIMIT 1';
        // Assuming this.databaseService.query executes the raw SQL query
        const [data] = await this.databaseService.query(query);
        const listDataCp = await this.findCpByPositionBetween(
          Number(dataLane.positioning),
          data.positioning,
        );
        for (const item of listDataCp) {
          const orderingPosition = Number(item.positioning) + 1;
          this.queueLaneRepository.update(item.id, {
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
        'SELECT id, lane_name, positioning FROM queue_lane ORDER BY positioning DESC LIMIT 1';
      // Assuming this.databaseService.query executes the raw SQL query
      const [data] = await this.databaseService.query(query);
      const listDataCp = await this.findCpByPositionBetween(
        Number(dataLane.positioning),
        data.positioning,
      );
      for (const item of listDataCp) {
        const orderingPosition = Number(item.positioning) - 1;
        this.queueLaneRepository.update(item.id, {
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
    const dataCp = await this.queueLaneRepository.findOneBy({
      id: Number(decryptJSAES(id)),
    });
    if (!dataCp) {
      return {
        statuscode: 400,
        message: 'Queue Lane Not Found',
      };
    }
    try {
      const newPosition = Number(newPos.position);
      const checkAvailablePosition = await this.queueLaneRepository.findOneBy({
        positioning: newPosition,
      });
      if (checkAvailablePosition && Number(dataCp.positioning) > 0) {
        const currentPosition = Number(dataCp.positioning);
        let oldPosition = 0;
        let downPosition = false;
        if (newPosition > currentPosition) {
          oldPosition = currentPosition + 1;
          downPosition = true;
        } else {
          oldPosition = currentPosition - 1;
          downPosition = false;
        }

        this.errorHandler.logDebug(`{
          PositionQueueLane: downPosition
        }`);

        const data = await this.findCpByPositionBetween(
          oldPosition,
          newPosition,
        );
        for (const item of data) {
          if (downPosition == true) {
            const positioningItem = Number(item.positioning - 1);
            await this.queueLaneRepository.update(item.id, {
              positioning: positioningItem,
            });
          } else {
            await this.queueLaneRepository.update(item.id, {
              positioning: item.positioning + 1,
            });
          }
        }
      }
      await this.queueLaneRepository.update(dataCp.id, {
        positioning: newPosition,
      });

      await this.createQueueLaneActivityLog(dataCp.id, {
        previous_positioning: dataCp.positioning,
        current_positioning: newPosition,
        updated_by: authInfo.email,
      });

      return {
        statuscode: 200,
        message: 'Reordering Successfully',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Ooops Reordering Queue Lane error.',
      );
    }
  }

  async queueLanesActivityLog(
    page: number = 1,
    limit: number = 5,
  ): Promise<any> {
    try {
      let rawData = [];
      let totalData: number = 0;
      if (!page || !limit) {
        const [data, total] = await this.queueLaneRepository.findAndCount({
          relations: ['logs'],
          order: { updated_by: 'DESC' },
          where: {
            deleted_at: null,
          },
        });
        totalData = total;
        rawData = data;
      } else {
        const [data, total] = await this.queueLaneRepository.findAndCount({
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

  async queueLanesActivityLogByQueueLaneId(
    queueLaneId: string,
    page: number = 1,
    limit: number = 5,
  ): Promise<any> {
    try {
      const queueLane = await this.queueLaneRepository.findOneBy({
        id: Number(decryptJSAES(queueLaneId)),
      });
      if (!queueLane) {
        return {
          statuscode: 400,
          message: 'Lane is not found',
        };
      }

      let rawData = [];
      let totalData: number = 0;
      if (!page || !limit) {
        const [data, total] =
          await this.queueLanesActivityLogRepository.findAndCount({
            order: { auditupdate: 'DESC' },
            where: {
              id: queueLane.id,
            },
          });
        totalData = total;
        rawData = data;
      } else {
        const [data, total] = await this.queueLaneRepository.findAndCount({
          skip: (page - 1) * limit,
          take: limit,
          order: { id: 'DESC' },
          where: {
            id: queueLane.id,
          },
        });
        rawData = data;
        totalData = total;
      }

      const result = {
        id: encryptJSAES(queueLane.id.toString()),
        lane_code: queueLane.lane_code,
        lane_name: queueLane.lane_name,
        status: queueLane.status,
        positioning: queueLane.positioning,
        reason_off: queueLane.reason_off,
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
}
