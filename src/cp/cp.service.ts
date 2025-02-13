import { ErrorHandlerService } from '@utils/error-handler.service';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { CreateCpDto } from './dto/create-cp.dto';
import { decryptJSAES, encryptJSAES } from '@utils/functions.service';
import { Cps } from 'src/jobs/entities/cps.entity';
import { CpUnits } from './entities/cp_units.entity';
import { CpDevices } from './entities/cp_devices.entity';
import { RuleOfCp } from './entities/cp_rule.entity';
import { DatabaseService } from '@utils/database.service';
import { CPStatusService } from 'src/jobs/cpstatus.services';
import {
  checkStatusDevicesCp,
  ConnectionDeviceFailDTO,
  createLogCp,
  CreateLogDevice,
  CreateLogTonages,
  dtoListLogCp,
  insertDeviceAndItemsCp,
  reorderingPosition,
  UpdateAllPriorityCpDTO,
} from './dto/checkStatusCp.dto';
import axios from 'axios';
import { dtoStatusCP, priorityUpdate } from './dto/status.dto';
import { number, string } from 'zod';
import { RuleLaneCp } from './entities/cp_rule_lane.entity';
import { CpDevicesLog } from './entities/cp_devices_log';
import {
  PriorityUpdateStatusCPEnum,
  TokenUscavisEnum,
  UpdatePositioningEnum,
} from '@utils/enums';
import { CpStatusLog } from './entities/cp_status_log.entity';
import { CpTonages } from './entities/cp_tonages';
import { CpTonagesLog } from './entities/cp_tonages_log';
import { CpEntraceTypeOptionListDTO } from './dto/cp_entrance_type.dto';
import { CpEntranceType } from './entities/cp_entrance_type.entity';
import { CpExitType } from './entities/cp_exit_type.entity';
import { GetCpExitTypeOptionListDTO } from './dto/cp_exit_type.dto';
import { Geofence } from 'src/geofence/entities/geofences.entity';
import { CpDetailGeofence } from './entities/cp_detail_geofence.entity';
import { CpDetail } from 'src/jobs/entities/cp_details.entity';
import { CpEntranceDetail } from './entities/cp_entrance_detail.entity';
import { CpExitDetail } from './entities/cp_exit_detail.entity';

@Injectable()
export class CpService {
  private cps: Cps;
  constructor(
    @InjectRepository(Cps)
    private cpRepository: Repository<Cps>,
    @InjectRepository(CpUnits)
    private cpUnitsRepository: Repository<CpUnits>,
    @InjectRepository(CpDevices)
    private cpDevicesRepository: Repository<CpDevices>,
    @InjectRepository(RuleOfCp)
    private cpRulesRepository: Repository<RuleOfCp>,
    @InjectRepository(RuleLaneCp)
    private cpRuleslaneRepository: Repository<RuleLaneCp>,
    @InjectRepository(CpDevicesLog)
    private cpDeviceLogRepository: Repository<CpDevicesLog>,
    @InjectRepository(CpStatusLog)
    private cpStatusLogRepository: Repository<CpStatusLog>,
    @InjectRepository(CpTonages)
    private cpTonagesRepository: Repository<CpTonages>,
    @InjectRepository(CpTonagesLog)
    private cpTonagesLogRepository: Repository<CpTonagesLog>,
    @InjectRepository(CpEntranceType)
    private cpEntranceTypeRepository: Repository<CpEntranceType>,
    @InjectRepository(CpExitType)
    private cpExitTypeRepository: Repository<CpExitType>,
    @InjectRepository(Geofence)
    private geofenceRepository: Repository<Geofence>,
    @InjectRepository(CpDetailGeofence)
    private cpDetailGeofenceRepository: Repository<CpDetailGeofence>,
    @InjectRepository(CpDetail)
    private cpDetailRepository: Repository<CpDetail>,
    @InjectRepository(CpEntranceDetail)
    private cpEntranceDetailRepository: Repository<CpEntranceDetail>,
    @InjectRepository(CpExitDetail)
    private cpExitDetailRepository: Repository<CpExitDetail>,
    @Inject(forwardRef(() => DatabaseService))
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ErrorHandlerService))
    private readonly errorHandler: ErrorHandlerService, // Error handling service
  ) {}

  async create(createCpDto: CreateCpDto): Promise<any> {
    const {
      devices,
      rules_capacity_truck,
      rules_type_truck,
      rules_lane,
      devices_tonages,
      cp_entrance,
      cp_exit,
      ...cpData
    } = createCpDto;

    if (
      (rules_capacity_truck && !cpData.max_capacity) ||
      cpData.max_capacity === null
    ) {
      const totalMaxCapacity = rules_capacity_truck.reduce(
        (sum, truck) => sum + truck.max_capacity,
        0,
      );
      cpData.max_capacity = totalMaxCapacity;
    }
    const truckTypesString = rules_type_truck.join(',');

    try {
      if (cpData.positioning === 0) {
        return {
          statusCode: 400,
          message: 'Positioning Cannot Be 0',
        };
      }
      await this.updatePositioning(
        cpData.positioning,
        UpdatePositioningEnum.CREATE,
      );
      const createCP = {
        cp_name: cpData.cp_name,
        max_capacity: cpData.max_capacity,
        current_load: cpData.current_load,
        positioning: cpData.positioning,
        status: cpData.status,
        reason_off: cpData.reason_status,
        in_lane: cpData.in_lane,
        out_lane: cpData.out_lane,
        dumping_area: cpData.dumping_area,
        allow_unit: truckTypesString,
        reason_in_lane: cpData.reason_in_lane,
        reason_out_lane: cpData.reason_out_lane,
        reason_dumping_area: cpData.reason_dumping_area,
      };

      const Cp = this.cpRepository.create(createCP);
      await this.cpRepository.save(Cp);
      await this.databaseService.query(`
        UPDATE cps SET positioning = ${Number(
          cpData.positioning,
        )} WHERE cp_id = ${Cp.cp_id}
        `);
      if (devices && Array.isArray(devices) && devices.length > 0) {
        const cpDevices = this.cpDevicesRepository.create(
          devices.map((device) => ({
            cp_id: Cp.cp_id,
            uid: device.device_id,
            name: device.device_name,
            item_name: device.item_name,
            item_id: device.item_id,
          })),
        );
        await this.cpDevicesRepository.save(cpDevices);
      }
      if (
        devices_tonages &&
        Array.isArray(devices_tonages) &&
        devices_tonages.length > 0
      ) {
        const cpDevices = this.cpTonagesRepository.create(
          devices.map((device) => ({
            cp_id: Cp.cp_id,
            uid: device.device_id,
            name: device.device_name,
            item_name: device.item_name,
            item_id: device.item_id,
          })),
        );
        await this.cpTonagesRepository.save(cpDevices);
      }

      if (
        rules_capacity_truck &&
        Array.isArray(rules_capacity_truck) &&
        rules_capacity_truck.length > 0
      ) {
        const cpRules = this.cpRulesRepository.create(
          rules_capacity_truck.map((rule) => ({
            cp_id: Cp.cp_id,
            max_capacity: Number(rule.max_capacity),
            truck_type: rule.truck_type,
          })),
        );
        await this.cpRulesRepository.save(cpRules);
      }

      if (rules_lane && Array.isArray(rules_lane) && rules_lane.length > 0) {
        const cpRulesLane = this.cpRuleslaneRepository.create(
          rules_lane.map((rule) => ({
            cp_id: Cp.cp_id,
            queue_lane_id: rule.queue_lane_id,
            name_queue_lane: rule.name_queue_lane,
          })),
        );
        await this.cpRuleslaneRepository.save(cpRulesLane);
      }

      if (!!cp_entrance) {
        if (!!cp_entrance.ids && !!cp_entrance.ids.length) {
          const cpEntranceIds = await this.cpEntranceTypeRepository.find({
            where: {
              id: In(cp_entrance.ids),
            },
          });
          const cpEntranceDetail = this.cpEntranceDetailRepository.create(
            cpEntranceIds.map((cpEntrance) => ({
              cp_id: Cp.cp_id,
              cp_entrance_id: cpEntrance.id,
              cp_entrance_type_name: cpEntrance.type,
            })),
          );
          await this.cpEntranceDetailRepository.save(cpEntranceDetail);
        }

        if (!!cp_entrance.geofence && !!cp_entrance.geofence.length) {
          const geofences = await this.geofenceRepository.find({
            where: {
              geofenceId: In(cp_entrance.geofence),
            },
          });
          const cpDetailGeofence = this.cpDetailGeofenceRepository.create(
            geofences.map((geofence) => ({
              cp_id: Cp.cp_id,
              geofence_id: geofence.geofenceId,
              geofence_name: geofence.name,
              description: 'IN',
            })),
          );
          await this.cpDetailGeofenceRepository.save(cpDetailGeofence);
        }

        if (!!cp_entrance.rfid && !!cp_entrance.rfid.length) {
          const rfids = cp_entrance.rfid.split(',');

          const cpDetail = this.cpDetailRepository.create(
            rfids.map((rfid) => ({
              cp_id: Cp.cp_id,
              desc: 'IN',
              device_id: rfid,
            })),
          );
          await this.cpDetailRepository.save(cpDetail);
        }
      }

      if (!!cp_exit) {
        if (!!cp_exit.ids && !!cp_exit.ids.length) {
          const cpExitIds = await this.cpExitTypeRepository.find({
            where: {
              id: In(cp_exit.ids),
            },
          });
          const cpExitDetail = this.cpExitDetailRepository.create(
            cpExitIds.map((cpExit) => ({
              cp_id: Cp.cp_id,
              cp_exit_id: cpExit.id,
              cp_exit_type_name: cpExit.type,
            })),
          );
          await this.cpExitDetailRepository.save(cpExitDetail);
        }
        if (!!cp_exit.geofence && !!cp_exit.geofence.length) {
          const geofences = await this.geofenceRepository.find({
            where: {
              geofenceId: In(cp_exit.geofence),
            },
          });
          const cpDetailGeofence = this.cpDetailGeofenceRepository.create(
            geofences.map((geofence) => ({
              cp_id: Cp.cp_id,
              geofence_id: geofence.geofenceId,
              geofence_name: geofence.name,
              description: 'OUT',
            })),
          );
          await this.cpDetailGeofenceRepository.save(cpDetailGeofence);
        }

        if (!!cp_exit.rfid && !!cp_exit.rfid.length) {
          const rfids = cp_exit.rfid.split(',');

          const cpDetail = this.cpDetailRepository.create(
            rfids.map((rfid) => ({
              cp_id: Cp.cp_id,
              desc: 'OUT',
              device_id: rfid,
            })),
          );
          await this.cpDetailRepository.save(cpDetail);
        }
      }

      return {
        statusCode: 200,
        message: 'Data was saved successfully',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async createLogCp(dto: createLogCp): Promise<any> {
    try {
      const createLog = {
        cp_id: dto.cp_id,
        status: dto.status,
        reason: dto.reason,
        updated_by: dto.updated_by,
      };
      this.errorHandler.logDebug(`Starting Create Log Status ${dto.cp_id}`);
      const log = this.cpStatusLogRepository.create(createLog);
      await this.cpStatusLogRepository.save(log);
      this.errorHandler.logDebug('Success Create Log Status ' + dto.cp_id);
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
      return error.message;
    }
  }

  async findLogAllLatestCp(dto: dtoListLogCp): Promise<any> {
    try {
      let limit = 10;
      let page = 1;
      if (dto.page) {
        page = dto.page;
      }
      if (dto.limit) {
        limit = dto.limit;
      }
      let skip = (page - 1) * limit;
      // Query to get the total count of records
      const totalResults = await this.databaseService.query(`
        WITH LatestLogs AS (
          SELECT
            cp_id,
            MAX(auditupdate) AS latest_auditupdate
          FROM cp_status_log
          GROUP BY cp_id
        ),
        LatestDeviceUpdates AS (
          SELECT
            cp_id,
            MAX(auditupdate) AS latest_device_auditupdate
          FROM cp_devices
          GROUP BY cp_id
        )
        SELECT
          COUNT(*) AS total
        FROM cp_status_log
        JOIN cps cp ON cp_status_log.cp_id = cp.cp_id
        JOIN cp_devices cd ON cp.cp_id = cd.cp_id
        JOIN LatestLogs ON cp_status_log.cp_id = LatestLogs.cp_id
          AND cp_status_log.auditupdate = LatestLogs.latest_auditupdate
        JOIN LatestDeviceUpdates ldu ON cp_status_log.cp_id = ldu.cp_id
          AND cd.auditupdate = ldu.latest_device_auditupdate;
      `);

      // Query to get the paginated data
      const results = await this.databaseService.query(`
        WITH LatestLogs AS (
          SELECT
            cp_id,
            MAX(auditupdate) AS latest_auditupdate
          FROM cp_status_log
          GROUP BY cp_id
        ),
        LatestDeviceUpdates AS (
          SELECT
            cp_id,
            MAX(auditupdate) AS latest_device_auditupdate
          FROM cp_devices
          GROUP BY cp_id
        )
        SELECT
          cp_status_log.*,
          cp.cp_name,
          cd."connection",
          cd.auditupdate AS device_auditupdate
        FROM cp_status_log
        JOIN cps cp ON cp_status_log.cp_id = cp.cp_id
        JOIN cp_devices cd ON cp.cp_id = cd.cp_id
        JOIN LatestLogs ON cp_status_log.cp_id = LatestLogs.cp_id
          AND cp_status_log.auditupdate = LatestLogs.latest_auditupdate
        JOIN LatestDeviceUpdates ldu ON cp_status_log.cp_id = ldu.cp_id
          AND cd.auditupdate = ldu.latest_device_auditupdate
        ORDER BY cp_status_log.auditupdate DESC
        LIMIT ${limit} OFFSET ${skip};
      `);
      // Calculate total count
      const total = totalResults[0]?.total || 0;
      return {
        statusCode: 200,
        data: results.map((data) => {
          return {
            ...data,
            cp_id: encryptJSAES(data.cp_id.toString()),
            cp: data.cp_name,
            updated_by: data.updated_by === 'USCAVIS' ? 'SISTEM' : 'MANUAL',
            latest_connection: data.device_auditupdate,
            latest_update: data.auditupdate,
          };
        }),
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }
  async findLogCp(id: string, dto: dtoListLogCp): Promise<any> {
    try {
      let limit = 10;
      let page = 1;
      if (dto.page) {
        page = dto.page;
      }
      if (dto.limit) {
        limit = dto.limit;
      }
      const idupdate = Number(decryptJSAES(id));
      const [data, total] = await this.cpStatusLogRepository.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { auditupdate: 'DESC' },
        where: {
          cp_id: idupdate,
        },
        relations: ['cp'],
      });
      return {
        statusCode: 200,
        data: data.map((data) => {
          return {
            ...data,
            cp_id: encryptJSAES(data.cp_id.toString()),
            cp: data.cp.cp_name,
          };
        }),
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
      // return {
      //   ...result,
      //   cp_id: encryptJSAES(result.cp_id.toString()),
      // };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  async findAllPaginated(page: number = 1, limit: number = 10) {
    const [data, total] = await this.cpRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { cp_id: 'DESC' },
      relations: ['cp_units', 'cp_devices', 'rules'],
    });

    return {
      data,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  async findAll(): Promise<any> {
    try {
      const rppjCount = await this.databaseService.query(`
        SELECT 
            c.cp_id AS id, 
            c.cp_name AS name, 
            COALESCE(COUNT(cqa.cp_queue_id), 0) AS count_assigned
        FROM public.cps c
        LEFT JOIN public.cp_queue_assignments cqa 
            ON c.cp_id = cqa.cp_queue_id 
            AND cqa.status = 'ASSIGNED_TO_CP'
        GROUP BY c.cp_id, c.cp_name;
        `);

      const geofenceCount = await this.databaseService.query(`
          select c.cp_id id, 
          c.cp_name name, 
          coalesce(count(gsl.geofence_target_value),0) as count_assigned
          from public.cps c
          left join public.geofence_service_logs gsl on gsl.geofence_target_value = c.geofence_kode
          group by c.cp_id, c.cp_name;
          `);

      const siCantikCount = await this.databaseService.query(`
          select c.cp_id id, 
          c.cp_name name, 
          dcs.total_vehicles count_assigned
          from public.cps c
          left join public.dt_count_sicantik dcs  on dcs.camera = c.sicantik_code;
        `);

      const results = await this.cpRepository.find({
        relations: [
          'cp_devices',
          'rule_truck',
          'rule_lane_cp',
          'cp_geofences',
          'cp_details',
          'cp_entrance_details',
          'cp_exit_details',
        ],
        order: {
          positioning: 'ASC',
        },
      });

      const lists = results.map((Cp) => {
        const rppjCountPerCp = rppjCount.find(
          (item) => String(item.id) === String(Cp.cp_id),
        );
        const geofenceCountPerCp = geofenceCount.find(
          (item) => String(item.id) === String(Cp.cp_id),
        );

        const siCantikCountPerCp = siCantikCount.find(
          (item) => String(item.id) === String(Cp.cp_id),
        );

        return {
          cp_id: encryptJSAES(Cp.cp_id.toString()),
          cp_name: Cp.cp_name,
          max_capacity: Cp.max_capacity,
          current_load: Cp.current_load,
          status: Cp.status,
          reason_status: Cp.reason_off,
          in_lane: Cp.in_lane,
          reason_in_lane: Cp.reason_in_lane,
          out_lane: Cp.out_lane,
          reason_out_lane: Cp.reason_out_lane,
          dumping_area: Cp.dumping_area,
          reason_dumping_area: Cp.reason_dumping_area,
          positioning: Cp.positioning,
          created_at: Cp.created_at,
          auditupdate: Cp.auditupdate,
          priority_status_cp: Cp.priority_update_status,
          allow_unit:
            Cp.allow_unit !== null
              ? Cp.allow_unit.replace(/\s/g, '').split(',')
              : [],
          devices: Cp.cp_devices.map((device, index) => {
            return {
              device_id: device?.uid || null,
              device_name: device?.name || null,
              item_id: device?.item_id || null,
              item_name: device?.item_name || null,
              status: device?.status || null,
              connection: device?.connection || null,
              latest_connection: device?.auditupdate || null,
            };
          }),
          rule_capacity_truck: Cp.rule_truck,
          rule_lane_cp: Cp.rule_lane_cp,
          cp_entrance: {
            types: Cp.cp_entrance_details
              .map((item) => {
                return {
                  id: item.cp_entrance_id,
                  name: item.cp_entrance_type_name,
                };
              })
              .filter(
                (value, index, array) =>
                  array.findIndex((item) => item.id === value.id) === index,
              )
              .sort((a, b) => a.id - b.id),
            geofence: Cp.cp_geofences
              .filter((item) => item.description === 'IN')
              .map((item) => {
                return {
                  id: item.geofence_id,
                  name: item.geofence_name,
                };
              }),
            rfid: Cp.cp_details
              .filter((item) => item.desc === 'IN')
              .map((item) => item.device_id)
              .join(','),
          },
          cp_exit: {
            types: Cp.cp_exit_details
              .map((item) => {
                return {
                  id: item.cp_exit_id,
                  name: item.cp_exit_type_name,
                };
              })
              .filter(
                (value, index, array) =>
                  array.findIndex((item) => item.id === value.id) === index,
              )
              .sort((a, b) => a.id - b.id),
            geofence: Cp.cp_geofences
              .filter((item) => item.description === 'OUT')
              .map((item) => {
                return {
                  id: item.geofence_id,
                  name: item.geofence_name,
                };
              }),
            rfid: Cp.cp_details
              .filter((item) => item.desc === 'OUT')
              .map((item) => item.device_id)
              .join(','),
          },
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
      return { statusCode: 200, data: lists };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
      return error.message;
    }
  }

  async findAllRulesCp(): Promise<any> {
    try {
      const results = await this.cpRepository.find({
        relations: ['rule_lane_cp'],
      });
      const lists = results.map((Cp) => ({
        cp_id: encryptJSAES(Cp.cp_id.toString()),
        cp_name: Cp.cp_name,
        rule_lane_cp: Cp.rule_lane_cp,
      }));
      return { statusCode: 200, data: lists };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  async findOne(id: string): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    const Cp = await this.cpRepository.findOne({
      where: { cp_id: idupdate },
      relations: [
        'cp_devices',
        'rule_truck',
        'rule_lane_cp',
        'cp_geofences',
        'cp_details',
        'cp_entrance_details',
        'cp_exit_details',
      ],
    });

    if (!Cp) throw new NotFoundException(`Cp with ID ${id} not found`);
    const [rppjCount] = await this.databaseService.query(`
      select count(*) count_assigned from public.cp_queue_assignments cqa where cqa.cp_queue_id = ${Cp.cp_id} and cqa.status = 'ASSIGNED_TO_CP';
       `);
    const [geofenceCount] = await this.databaseService.query(`
       select c.cp_id id, 
          c.cp_name name, 
          coalesce(count(gsl.geofence_target_value),0) as count_assigned
          from public.cps c
          left join public.geofence_service_logs gsl on gsl.geofence_target_value = c.geofence_kode
          where c.cp_id = ${Cp.cp_id}
          group by c.cp_id, c.cp_name;
         `);

    const [siCantikCount] = await this.databaseService.query(`
        select c.cp_id id, 
          c.cp_name name, 
          dcs.total_vehicles count_assigned
          from public.cps c
          left join public.dt_count_sicantik dcs  on dcs.camera = c.sicantik_code
          where c.cp_id = ${Cp.cp_id};
        `);

    const updatedCP = {
      cp_id: encryptJSAES(Cp.cp_id.toString()),
      cp_name: Cp.cp_name,
      max_capacity: Cp.max_capacity,
      current_load: Cp.current_load,
      status: Cp.status,
      reason_status: Cp.reason_off,
      in_lane: Cp.in_lane,
      reason_in_lane: Cp.reason_in_lane,
      out_lane: Cp.out_lane,
      reason_out_lane: Cp.reason_out_lane,
      dumping_area: Cp.dumping_area,
      reason_dumping_area: Cp.reason_dumping_area,
      positioning: Cp.positioning,
      created_at: Cp.created_at,
      auditupdate: Cp.auditupdate,
      priority_status_cp: Cp.priority_update_status,
      allow_unit:
        Cp.allow_unit !== null
          ? Cp.allow_unit.replace(/\s/g, '').split(',')
          : [],
      devices: Cp.cp_devices.map((device, index) => {
        return {
          device_id: device?.uid || null,
          device_name: device?.name || null,
          item_id: device?.item_id || null,
          item_name: device?.item_name || null,
          status: device?.status || null,
          connection: device?.connection || null,
        };
      }),
      rule_capacity_truck: Cp.rule_truck,
      rule_lane_cp: Cp.rule_lane_cp,
      cp_entrance: {
        types: Cp.cp_entrance_details
          .map((item) => {
            return {
              id: item.cp_entrance_id,
              name: item.cp_entrance_type_name,
            };
          })
          .filter(
            (value, index, array) =>
              array.findIndex((item) => item.id === value.id) === index,
          )
          .sort((a, b) => a.id - b.id),
        geofence: Cp.cp_geofences
          .filter((item) => item.description === 'IN')
          .map((item) => {
            return {
              id: item.geofence_id,
              name: item.geofence_name,
            };
          }),
        rfid: Cp.cp_details
          .filter((item) => item.desc === 'IN')
          .map((item) => item.device_id)
          .join(','),
      },
      cp_exit: {
        types: Cp.cp_exit_details
          .map((item) => {
            return {
              id: item.cp_exit_id,
              name: item.cp_exit_type_name,
            };
          })
          .filter(
            (value, index, array) =>
              array.findIndex((item) => item.id === value.id) === index,
          )
          .sort((a, b) => a.id - b.id),
        geofence: Cp.cp_geofences
          .filter((item) => item.description === 'OUT')
          .map((item) => {
            return {
              id: item.geofence_id,
              name: item.geofence_name,
            };
          }),
        rfid: Cp.cp_details
          .filter((item) => item.desc === 'OUT')
          .map((item) => item.device_id)
          .join(','),
      },
      truck_count: {
        rppj: !rppjCount ? 0 : Number(rppjCount.count_assigned),
        geofence: !geofenceCount ? 0 : Number(geofenceCount.count_assigned),
        sicantik: !siCantikCount ? 0 : Number(siCantikCount.count_assigned),
      },
    };

    return updatedCP;
  }

  async update(id: string, updateCpDto: CreateCpDto): Promise<any> {
    const {
      devices,
      rules_capacity_truck,
      rules_type_truck,
      rules_lane,
      devices_tonages,
      cp_entrance,
      cp_exit,
      ...cpData
    } = updateCpDto;
    const idupdate = Number(decryptJSAES(id));
    try {
      if (cpData.positioning) {
        if (cpData.positioning === 0) {
          return {
            statusCode: 400,
            message: 'Positioning Cannot Be 0',
          };
        }
        const cp = await this.cpRepository.findOneBy({
          cp_id: idupdate,
        });
        if (cp.positioning !== cpData.positioning) {
          await this.updatePositioning(
            cpData.positioning,
            UpdatePositioningEnum.UPDATE,
            id,
          );
        }
      }
      let truckTypesString = '';
      if (rules_type_truck) {
        truckTypesString = rules_type_truck.join(', ');
      }
      const updateCP = {
        cp_name: cpData.cp_name,
        max_capacity: cpData.max_capacity,
        current_load: cpData.current_load,
        positioning: cpData.positioning,
        status: cpData.status,
        reason_off: cpData.reason_status,
        in_lane: cpData.in_lane,
        out_lane: cpData.out_lane,
        dumping_area: cpData.dumping_area,
        allow_unit: truckTypesString,
        reason_in_lane: cpData.reason_in_lane,
        reason_out_lane: cpData.reason_out_lane,
        reason_dumping_area: cpData.reason_dumping_area,
      };

      this.errorHandler.logDebug(`{updateData: JSON.stringify(updateCP) }`);
      await this.cpRepository.update(idupdate, updateCP);
      if (devices && Array.isArray(devices) && devices.length > 0) {
        const dataDevices = await this.cpDevicesRepository.findBy({
          cp_id: idupdate,
        });

        if (dataDevices) {
          await this.cpDevicesRepository.delete({
            cp_id: idupdate,
          });
        }
        if (devices && Array.isArray(devices) && devices.length > 0) {
          const cpDevices = this.cpDevicesRepository.create(
            devices.map((device) => ({
              cp_id: idupdate,
              uid: device.device_id,
              name: device.device_name,
              item_name: device.item_name,
              item_id: device.item_id,
            })),
          );
          await this.cpDevicesRepository.save(cpDevices);
        }
      }
      if (
        devices_tonages &&
        Array.isArray(devices_tonages) &&
        devices_tonages.length > 0
      ) {
        const dataDevices = await this.cpTonagesRepository.findBy({
          cp_id: idupdate,
        });

        if (dataDevices) {
          await this.cpDevicesRepository.delete({
            cp_id: idupdate,
          });
        }
        if (devices && Array.isArray(devices) && devices.length > 0) {
          const cpDevices = this.cpDevicesRepository.create(
            devices.map((device) => ({
              cp_id: idupdate,
              uid: device.device_id,
              name: device.device_name,
              item_name: device.item_name,
              item_id: device.item_id,
            })),
          );
          await this.cpDevicesRepository.save(cpDevices);
        }
      }
      if (rules_capacity_truck && rules_capacity_truck.length == 0) {
        await this.cpRulesRepository.delete({
          cp_id: idupdate,
        });
      }
      if (
        rules_capacity_truck &&
        Array.isArray(rules_capacity_truck) &&
        rules_capacity_truck.length > 0
      ) {
        for (const rule of rules_capacity_truck) {
          await this.cpRulesRepository.update(rule.id, {
            max_capacity: rule.max_capacity,
            truck_type: rule.truck_type,
          });
        }
      }

      if (rules_lane && Array.isArray(rules_lane) && rules_lane.length > 0) {
        const dataRuleLane = await this.cpRuleslaneRepository.findBy({
          cp_id: idupdate,
        });

        if (dataRuleLane) {
          await this.cpRuleslaneRepository.delete({
            cp_id: idupdate,
          });
        }

        for (const rule of rules_lane) {
          const newRule = this.cpRuleslaneRepository.create({
            cp_id: idupdate,
            queue_lane_id: rule.queue_lane_id,
            name_queue_lane: rule.name_queue_lane,
          });
          await this.cpRuleslaneRepository.save(newRule);
        }
      }

      if (!!cp_entrance) {
        if (!!cp_entrance.ids && !!cp_entrance.ids.length) {
          await this.cpEntranceDetailRepository.delete({
            cp_id: idupdate,
          });
          const cpEntranceIds = await this.cpEntranceTypeRepository.find({
            where: {
              id: In(cp_entrance.ids),
            },
          });
          const cpEntranceDetail = this.cpEntranceDetailRepository.create(
            cpEntranceIds.map((cpEntrance) => ({
              cp_id: idupdate,
              cp_entrance_id: cpEntrance.id,
              cp_entrance_type_name: cpEntrance.type,
            })),
          );
          await this.cpEntranceDetailRepository.save(cpEntranceDetail);
        }

        if (!!cp_entrance.geofence && !!cp_entrance.geofence.length) {
          await this.cpDetailGeofenceRepository.delete({
            cp_id: idupdate,
          });
          const geofences = await this.geofenceRepository.find({
            where: {
              geofenceId: In(cp_entrance.geofence),
            },
          });
          const cpDetailGeofence = this.cpDetailGeofenceRepository.create(
            geofences.map((geofence) => ({
              cp_id: idupdate,
              geofence_id: geofence.geofenceId,
              geofence_name: geofence.name,
              description: 'IN',
            })),
          );
          await this.cpDetailGeofenceRepository.save(cpDetailGeofence);
        }

        if (!!cp_entrance.geofence && !!cp_entrance.rfid.length) {
          await this.cpDetailRepository.delete({
            cp_id: idupdate,
          });
          const rfids = cp_entrance.rfid.split(',');

          const cpDetail = this.cpDetailRepository.create(
            rfids.map((rfid) => ({
              cp_id: idupdate,
              desc: 'IN',
              device_id: rfid,
            })),
          );
          await this.cpDetailRepository.save(cpDetail);
        }
      }

      if (!!cp_exit) {
        if (!!cp_exit.ids && !!cp_exit.ids.length) {
          await this.cpExitDetailRepository.delete({
            cp_id: idupdate,
          });
          const cpExitIds = await this.cpExitTypeRepository.find({
            where: {
              id: In(cp_exit.ids),
            },
          });
          const cpExitDetail = this.cpExitDetailRepository.create(
            cpExitIds.map((cpExit) => ({
              cp_id: idupdate,
              cp_exit_id: cpExit.id,
              cp_exit_type_name: cpExit.type,
            })),
          );
          await this.cpExitDetailRepository.save(cpExitDetail);
        }

        if (!!cp_exit.geofence && !!cp_exit.geofence.length) {
          await this.cpDetailGeofenceRepository.delete({
            cp_id: idupdate,
          });
          const geofences = await this.geofenceRepository.find({
            where: {
              geofenceId: In(cp_exit.geofence),
            },
          });
          const cpDetailGeofence = this.cpDetailGeofenceRepository.create(
            geofences.map((geofence) => ({
              cp_id: idupdate,
              geofence_id: geofence.geofenceId,
              geofence_name: geofence.name,
              description: 'OUT',
            })),
          );
          await this.cpDetailGeofenceRepository.save(cpDetailGeofence);
        }

        if (!!cp_exit.geofence && !!cp_exit.rfid.length) {
          await this.cpDetailRepository.delete({
            cp_id: idupdate,
          });
          const rfids = cp_exit.rfid.split(',');

          const cpDetail = this.cpDetailRepository.create(
            rfids.map((rfid) => ({
              cp_id: idupdate,
              desc: 'OUT',
              device_id: rfid,
            })),
          );
          await this.cpDetailRepository.save(cpDetail);
        }
      }

      return {
        statusCode: 200,
        message: 'Data Successfully Updated',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async updateStatusCP(id: string, updateCpDto: dtoStatusCP): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    if (!updateCpDto.reason) {
      return {
        statusCode: 400,
        message: 'Reason is required',
      };
    }
    try {
      this.errorHandler.logDebug(`{ 'LogUpdateCp': ${idupdate} }`);
      const result = await this.findOne(id);
      // if (result.priority_status_cp === PriorityUpdateStatusCPEnum.API) {
      //   return {
      //     statusCode: 400,
      //     message: 'Priority Cp is API, Update Status Not Override',
      //   };
      // }
      const {
        cp_id,
        devices,
        rule_capacity_truck,
        rule_lane_cp,
        allow_unit,
        geofence,
        ...data
      } = result;
      data.status = updateCpDto.status;
      data.reason_status = updateCpDto.reason;
      await this.update(id, data);
      this.errorHandler.logDebug('Processing insert Log CP');
      this.cpEntranceTypeRepository;
      this.createLogCp({
        cp_id: idupdate,
        status: updateCpDto.status,
        reason: updateCpDto.reason,
        updated_by: 'ADMIN',
      });
      return {
        statusCode: 200,
        message: 'Status Cp Successfully Updated',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async priotiryStatusCP(
    id: string,
    updateCpDto: priorityUpdate,
  ): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    this.errorHandler.logDebug(`{ 'idupdatePriorityCP': ${idupdate}}`);
    try {
      if (updateCpDto.status === true) {
        await this.databaseService.query(
          `UPDATE cps SET priority_update_status = $1 WHERE cp_id = $2`,
          [PriorityUpdateStatusCPEnum.ADMIN, idupdate],
        );
        await this.databaseService.query(
          `INSERT INTO cp_logs (cp_id, action, reason, created_at) VALUES ($1, $2, $3, $4)`,
          [idupdate, 'open', '', new Date()],
        );
      } else {
        await this.databaseService.query(
          `UPDATE cps SET priority_update_status = $1 WHERE cp_id = $2`,
          [PriorityUpdateStatusCPEnum.API, idupdate],
        );
        await this.databaseService.query(
          `INSERT INTO cp_logs (cp_id, action, reason) VALUES ($1, $2, $3, $4)`,
          [idupdate, 'close', '', new Date()],
        );
      }
      return {
        statusCode: 200,
        message: 'Priority Status Cp Successfully Updated',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data was failed to save.');
    }
  }

  async remove(id: string): Promise<any> {
    const idupdate = Number(decryptJSAES(id));
    try {
      const cpData = await this.cpRepository.findOneBy({ cp_id: idupdate });
      if (!cpData) throw new NotFoundException(`Cp with ID ${id} not found`);
      await this.updatePositioning(
        cpData.positioning,
        UpdatePositioningEnum.DELETE,
      );
      const result = await this.cpRepository.delete(idupdate);
      const cpDevices = await this.cpDevicesRepository.findBy({
        cp_id: idupdate,
      });

      if (cpDevices) {
        await this.cpDevicesRepository.delete({
          cp_id: idupdate,
        });
      }
      return { statusCode: 200, data: 'Data was deleted successfully' };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'The data was failed to delete.',
      );
    }
  }

  async findCpByDevicesAndItems(
    device_ids: string[],
    items_ids: string[],
  ): Promise<any> {
    try {
      // Construct the SQL query using both `device_ids` and `items_ids`
      const query = `
        SELECT cps.cp_id, cps.cp_name, cps.status AS status_cp, cpd.name, cpd.status AS status_device, cpd.uid
        FROM cp_devices cpd
        LEFT JOIN cps ON cpd.cp_id = cps.cp_id
        LEFT JOIN cp_units cpu ON cpu.cp_id = cps.cp_id
        WHERE cpd.uid IN (${device_ids.map((id) => `'${id}'`).join(', ')})
        AND cpu.uid IN (${items_ids.map((id) => `'${id}'`).join(', ')})
      `;

      // Assuming `this.databaseService.query` executes the raw SQL query
      const [data] = await this.databaseService.query(query);
      const updateDate = {
        ...data,
        cp_id: encryptJSAES(data.cp_id),
      };
      return updateDate;
    } catch (error) {
      // Handle the error and throw a custom error message
      this.errorHandler.throwBadRequestError(error, 'The data failed to query');
    }
  }

  async checkStatusDevices(dto: checkStatusDevicesCp): Promise<any> {
    try {
      const API_URL =
        'https://uscavisapi.borneo-indobara.com/api/archiveItemsFloat';
      const TOKEN = TokenUscavisEnum.TOKEN;
      const param = {
        token: TOKEN,
        device_id: [dto.device_id],
        item_id: [dto.item_id],
      };

      const response = await axios.post(API_URL, param, {
        headers: { 'Content-Type': 'application/json' },
      });

      const data2 = response.data?.data[0] || [];
      const dataDevice = await this.cpDevicesRepository.findOne({
        where: {
          uid: dto.device_id,
          item_id: dto.item_id,
        },
        relations: ['cp'],
      });
      let createData = {
        device_id: dataDevice.uid,
        item_id: dataDevice.item_id,
        item_name: dataDevice.item_name,
        device_name: dataDevice.name,
        updated_by: 'USCAVIS',
      };
      if (data2.length == 0) {
        if (dto.item_id !== null) {
          await this.connectionDeviceFail({
            connection: false,
            cp_id: dataDevice.cp_id,
            device_id: dto.device_id,
            item_id: dto.item_id,
            item_name: dataDevice.item_name,
            device_name: dataDevice.name,
            updated_by: 'USCAVIS',
            id_device: dataDevice.id,
            status_cp: false,
            status_device: 0,
            reason: `Device ${dataDevice.name} With Item ID ${dataDevice.item_id} Connection is Failed`,
          });
        }
        return { status: false, message: 'Connection Failed' };
      }
      await this.changeStatusConnectionDevice(dto.item_id, true);
      let statusDevicesCp = true;
      const cpConditions = {
        CP1: (value) => value === 0 || value === 3,
        CP2A: (value) => value === 2 || value === 3,
        CP2B: (value) => value === 0 || value === 2,
        CP3: (value) => value !== 2,
        CP4: (value) => value !== 1,
        CP5: (value) => value !== 1,
        CP6: (value) => value <= 0,
        CP7: (value) => value <= 0,
        CP8: (value) => value === 0,
        CP9: (value) => value !== 2,
      };

      for (const item of data2) {
        const condition = cpConditions[dataDevice.cp.cp_name];
        if (condition && condition(item.Value)) {
          statusDevicesCp = false;
        }
      }
      if (statusDevicesCp == false) {
        // return cp_device;
        try {
          let updatedDataDevice = {
            ...createData,
            status: 0,
            connection: true,
          };
          await this.createLogDevice(updatedDataDevice);

          if (
            dataDevice.cp.priority_update_status ===
            PriorityUpdateStatusCPEnum.API
          ) {
            await this.update(encryptJSAES(dataDevice.cp.cp_id.toString()), {
              status: false,
              reason_status: `Device With ID ${dto.device_id} AND Item With ID ${dto.item_id} Not Working`,
            });
            return {
              statusCode: 200,
              data: `Cp Status Is Turn Off Because Device With ID ${dto.device_id} AND Item With ID ${dto.item_id} Not Working`,
            };
          }
          await this.cpDevicesRepository.update(dataDevice.id, {
            status: false,
          });
          return {
            statusCode: 200,
            data: 'Cp Device is Not Working, Cp Not turn Off Because Priority Is ADMIN Override',
          };
        } catch (error) {
          this.errorHandler.throwBadRequestError(
            error,
            'Update Status Cp Because Device Not Working is Failed',
          );
        }
      }
      let updatedDataDevice = {
        ...createData,
        status: 1,
        connection: true,
      };
      await this.createLogDevice(updatedDataDevice);
      if (
        dataDevice.cp.priority_update_status === PriorityUpdateStatusCPEnum.API
      ) {
        await this.cpDevicesRepository.update(dto.item_id, {
          status: true,
          connection: true,
        });
        return {
          statusCode: 200,
          data: 'Cp Device is Working Normally And Status CP is Active',
        };
      }
      return {
        statusCode: 200,
        data: 'Cp Device is Working Normally But Not Override Because Priority Is ADMIN',
      };
    } catch (error) {
      this.errorHandler.logError(
        `Error in API request for device_id: ${dto.device_id}`,
        error,
      );
      return false;
    }
  }

  async checkValueTonagesCp(dto: checkStatusDevicesCp): Promise<any> {
    try {
      const API_URL =
        'https://uscavisapi.borneo-indobara.com/api/archiveItemsFloat';
      const TOKEN = TokenUscavisEnum.TOKEN;
      const param = {
        token: TOKEN,
        device_id: [dto.device_id],
        item_id: [dto.item_id],
      };

      const response = await axios.post(API_URL, param, {
        headers: { 'Content-Type': 'application/json' },
      });
      const resultDevice = await this.cpTonagesRepository.findOneBy({
        uid: dto.device_id,
        item_id: dto.item_id,
      });
      const data2 = response.data?.data[0] || [];
      let createLogDto: CreateLogTonages = {
        device_id: dto.device_id,
        item_id: dto.item_id,
        connection: false,
        device_name: resultDevice.name,
        item_name: resultDevice.item_name,
        updated_by: 'USCAVIS',
        value: 0,
      };
      if (data2.length == 0) {
        if (dto.item_id !== null) {
          await this.createLogTonages(createLogDto);
        }
        return { statusCode: 400, message: 'Connection Failed' };
      }
      const roundedValue = Math.round(parseFloat(data2.Value));
      const dataUpdatedLog = {
        ...createLogDto,
        connection: true,
        value: roundedValue,
      };
      await this.createLogTonages(dataUpdatedLog);
      if (roundedValue !== 0) {
        await this.cpTonagesRepository.update(resultDevice.id, {
          value: roundedValue,
          connection: true,
        });
      }
      return {
        statusCode: 200,
        message: 'Check Cp Tonages is Working Normally',
        data: data2,
      };
    } catch (error) {
      this.errorHandler.logError(
        `Error in API request for device_id: ${dto.device_id}`,
        error,
      );
      return false;
    }
  }

  async checkStatusAllDevices(): Promise<any> {
    this.errorHandler.logDebug('Checking status Devices CP');
    const dataDevice = await this.cpDevicesRepository.find({
      relations: ['cp'],
    });
    try {
      const API_URL =
        'https://uscavisapi.borneo-indobara.com/api/archiveItemsFloat';
      const TOKEN = TokenUscavisEnum.TOKEN;

      // Loop through each device and unit within the CP
      for (const device of dataDevice) {
        const param = {
          token: TOKEN,
          device_id: [device.uid],
          item_id: [device.item_id],
        };

        try {
          let createData = {
            device_id: device.uid,
            item_id: device.item_id,
            item_name: device.item_name,
            device_name: device.name,
            updated_by: 'USCAVIS',
          };
          // Mengirim permintaan API
          const response = await axios.post(API_URL, param, {
            headers: { 'Content-Type': 'application/json' },
          });

          const isConnectionSuccessful = response.status === 200;
          const data2 = response.data?.data[0] || [];

          if (!isConnectionSuccessful || data2.length === 0) {
            await this.connectionDeviceFail({
              connection: false,
              cp_id: device.cp.cp_id,
              device_id: device.uid,
              item_id: device.item_id,
              item_name: device.item_name,
              device_name: device.name,
              updated_by: 'USCAVIS',
              id_device: device.id,
              status_cp: false,
              status_device: 0,
              reason: `Device ${device.name} With Item ID ${device.item_id} Connection is Failed`,
            });
            continue;
          }

          await this.changeStatusConnectionDevice(
            device.item_id,
            true,
            device.uid,
          );

          // Cek status perangkat berdasarkan kondisi
          let statusDevicesCp = true;
          const cpConditions = {
            CP1: (value) => value === 0 || value === 3,
            CP2A: (value) => value === 2 || value === 3,
            CP2B: (value) => value === 0 || value === 2,
            CP3: (value) => value !== 2,
            CP4: (value) => value !== 1,
            CP5: (value) => value !== 1,
            CP6: (value) => value <= 0,
            CP7: (value) => value <= 0,
            CP8: (value) => value === 0,
            CP9: (value) => value !== 2,
          };

          for (const item of data2) {
            const condition = cpConditions[device.cp?.cp_name];
            if (condition && condition(item.Value)) {
              statusDevicesCp = false;
              break;
            }
          }
          const dataCp = await this.cpRepository.findOneBy({
            cp_id: device.cp_id,
          });

          // Memperbarui status perangkat dan log
          const encryptID = encryptJSAES(device.cp_id.toString());
          if (!statusDevicesCp) {
            try {
              if (dataCp.priority_update_status === 'API') {
                await this.updateStatusCP(encryptID, {
                  status: false,
                  reason: `Device With ID ${device.uid} AND Item With ID ${device.item_id} Not Working`,
                });
              }

              await this.cpDevicesRepository.update(device.id, {
                status: false,
              });
              let updatedDataDevice = {
                ...createData,
                status: 0,
                connection: true,
              };
              await this.createLogDevice(updatedDataDevice);

              this.errorHandler.logDebug(
                `Cp status is turned off because one or more items of device ${device.uid} are not operational`,
              );
            } catch (error) {
              this.errorHandler.throwBadRequestError(
                error,
                'Update Status Cp Because Device Not Working is Failed',
              );
            }
          } else {
            if (dataCp.priority_update_status === 'API') {
              await this.updateStatusCP(encryptID, {
                status: true,
                reason: `FROM API`,
              });
            }
            let updatedDataDevice = {
              ...createData,
              status: 1,
              connection: true,
            };
            await this.createLogDevice(updatedDataDevice);
            await this.cpDevicesRepository.update(device.id, { status: true });
          }
        } catch (error) {
          this.errorHandler.logError(
            `Error in API request for device_id: ${device.uid}`,
            error,
          );
        }
      }
      this.errorHandler.logDebug('Cp Devices are Working Normally');
    } catch (error) {
      this.errorHandler.logError('Error in fetching CP data', error);
      return error.message;
    }
  }

  async checkValueTonagesAllCp(): Promise<any> {
    this.errorHandler.logDebug('Checking value Tonages CP');
    const dataDevice = await this.cpTonagesRepository.find({
      relations: ['cp'],
    });
    try {
      const API_URL =
        'https://uscavisapi.borneo-indobara.com/api/archiveItemsFloat';
      const TOKEN = TokenUscavisEnum.TOKEN;

      // Loop through each device and unit within the CP
      for (const device of dataDevice) {
        const param = {
          token: TOKEN,
          device_id: [device.uid],
          item_id: [device.item_id],
        };

        try {
          let createLogDto: CreateLogTonages = {
            device_id: device.uid,
            item_id: device.item_id,
            connection: false,
            device_name: device.name,
            item_name: device.item_name,
            updated_by: 'USCAVIS',
            value: 0,
          };
          // Mengirim permintaan API
          const response = await axios.post(API_URL, param, {
            headers: { 'Content-Type': 'application/json' },
          });

          const isConnectionSuccessful = response.status === 200;
          const data2 = response.data?.data[0] || [];

          if (!isConnectionSuccessful || data2.length === 0) {
            await this.createLogTonages(createLogDto);
            continue;
          }
          const roundedValue = Math.round(parseFloat(data2.Value));
          const dataUpdatedLog = {
            ...createLogDto,
            connection: true,
            value: roundedValue,
          };
          await this.createLogTonages(dataUpdatedLog);
          if (roundedValue !== 0) {
            await this.cpTonagesRepository.update(device.id, {
              value: roundedValue,
              connection: true,
            });
          }
        } catch (error) {
          this.errorHandler.logError(
            `Error in API request for device_id: ${device.uid}`,
            error,
          );
        }
      }
      this.errorHandler.logDebug('End Checking Value CP Tonages');
    } catch (error) {
      this.errorHandler.logError('Error in fetching CP data', error);
      return error.message;
    }
  }

  async findCpByPositionBetween(start: number, end: number): Promise<any> {
    try {
      // Construct the SQL query using both `device_ids` and `items_ids`
      const query = `
       SELECT cp_id, cp_name, positioning
        FROM cps
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
    const dataLane = await this.cpRepository.findOneBy({
      positioning: newPosition,
    });
    if (params === UpdatePositioningEnum.CREATE) {
      if (dataLane) {
        const query = `
         SELECT cp_id, cp_name, positioning
          FROM cps
          ORDER BY positioning DESC LIMIT 1;
        `;
        // Assuming `this.databaseService.query` executes the raw SQL query
        const [data] = await this.databaseService.query(query);
        const listDataCp = await this.findCpByPositionBetween(
          dataLane.positioning,
          data.positioning,
        );
        for (const item of listDataCp) {
          this.cpRepository.update(item.cp_id, {
            positioning: item.positioning + 1,
          });
          this.errorHandler.logDebug('updated positioning cp');
        }
      }
    } else if (params === UpdatePositioningEnum.UPDATE) {
      let newPos: reorderingPosition = {
        position: Number(newPosition),
      };
      await this.updatePositioningMaster(newPos, idencrypt);
    } else if (params === UpdatePositioningEnum.DELETE) {
      const query = `
         SELECT cp_id, cp_name, positioning
          FROM cps
          ORDER BY positioning DESC LIMIT 1;
        `;
      // Assuming `this.databaseService.query` executes the raw SQL query
      const [data] = await this.databaseService.query(query);
      const listDataCp = await this.findCpByPositionBetween(
        dataLane.positioning,
        data.positioning,
      );
      for (const item of listDataCp) {
        this.cpRepository.update(item.cp_id, {
          positioning: item.positioning - 1,
        });
        this.errorHandler.logDebug('updated positioning cp');
      }
    }
  }

  private async changeStatusConnectionDevice(
    item_id: string,
    status: boolean,
    device_id?: string,
  ): Promise<any> {
    try {
      const dataUnit = await this.cpDevicesRepository.findOneBy({
        uid: device_id,
        item_id: item_id,
      });
      if (dataUnit) {
        await this.cpDevicesRepository.update(dataUnit.id, {
          connection: status,
        });
      }
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'changeStatusConnectionDevice Error',
      );
    }
  }

  async updatePositioningMaster(
    newPos: reorderingPosition,
    cp_id: string,
  ): Promise<any> {
    const dataCp = await this.cpRepository.findOneBy({
      cp_id: Number(decryptJSAES(cp_id)),
    });
    if (!dataCp) {
      return {
        statuscode: 400,
        message: 'Cp Not Found',
      };
    }
    try {
      const newPosition = newPos.position;
      const checkAvailablePosition = await this.cpRepository.findOneBy({
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

        const data = await this.findCpByPositionBetween(
          oldPosition,
          newPosition,
        );
        for (const item of data) {
          if (downPosition == true) {
            await this.cpRepository.update(item.cp_id, {
              positioning: item.positioning - 1,
            });
          } else {
            await this.cpRepository.update(item.cp_id, {
              positioning: item.positioning + 1,
            });
          }
        }
      }
      await this.cpRepository.update(dataCp.cp_id, {
        positioning: newPosition,
      });

      return {
        statuscode: 200,
        message: 'Reordering Successfully',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Error Reordering Master CP',
      );
    }
  }

  async insertDeviceAndItems(dto: insertDeviceAndItemsCp): Promise<any> {
    try {
      const createData = {
        device_id: dto.device_id,
        item_id: dto.item_id,
        status: dto.status,
        item_name: dto.item_name,
        device_name: dto.device_name,
      };
      const devices = await this.cpDeviceLogRepository.create(createData);
      await this.cpDeviceLogRepository.save(devices);
      const query = `SELECT cu.cp_id, cp.cp_name, cp.priority_update_status
                  FROM cp_units cu
                  INNER JOIN cp_devices cd ON cu.cp_id = cd.cp_id
                  INNER JOIN cps cp ON cu.cp_id = cp.cp_id
                  WHERE cu.uid = '${dto.item_id}' AND cd.uid = '${dto.device_id}'`;
      const data = await this.databaseService.query(query);
      if (data.length > 0) {
        const responseStatus = await this.checkStatusDeviceByNumber(
          data[0].cp_name,
          dto.status,
        );
        if (responseStatus == false) {
          if (
            data[0].priority_update_status === PriorityUpdateStatusCPEnum.API
          ) {
            await this.cpRepository.update(data[0].cp_id, {
              status: false,
              updated_by: 'USCAVIS',
              reason_off: `Device ${dto.device_name} With Item ID ${dto.item_id} is not Operating`,
            });
            this.createLogCp({
              cp_id: data[0].cp_id,
              status: false,
              reason: `Device ${dto.device_name} With Item ID ${dto.item_id} is not Operating`,
              updated_by: 'USCAVIS',
            });
          }
        } else {
          if (
            data[0].priority_update_status === PriorityUpdateStatusCPEnum.API
          ) {
            await this.cpRepository.update(data[0].cp_id, {
              status: true,
              updated_by: 'USCAVIS',
              reason_off: `FROM API`,
            });
            this.createLogCp({
              cp_id: data[0].cp_id,
              status: true,
              reason: 'FROM API',
              updated_by: 'USCAVIS',
            });
          }
        }
      }
      return {
        statuscode: 200,
        message: 'Data successfully Save',
      };
    } catch (error) {
      this.errorHandler.logError('Error in Save Data', error);
    }
  }

  private async checkStatusDeviceByNumber(
    cp_name: string,
    status: number,
  ): Promise<boolean> {
    const cpConditions = {
      CP1: (value: number) => value === 0 || value === 3,
      CP2A: (value: number) => value === 2 || value === 3,
      CP2B: (value: number) => value === 0 || value === 2,
      CP3: (value: number) => value !== 2,
      CP4: (value: number) => value !== 1,
      CP5: (value: number) => value !== 1,
      CP6: (value: number) => value <= 0,
      CP7: (value: number) => value <= 0,
      CP8: (value: number) => value === 0,
      CP9: (value: number) => value !== 2,
    };

    const condition = cpConditions[cp_name];

    if (condition && condition(status)) {
      return false;
    }

    return true;
  }

  async createLogDevice(dto: CreateLogDevice): Promise<any> {
    try {
      this.errorHandler.logDebug('Starting Create Log Device');
      const createData = {
        device_id: dto.device_id,
        item_id: dto.item_id,
        item_name: dto.item_name,
        device_name: dto.device_name,
        updated_by: dto.updated_by,
        status: dto.status,
        connection: dto.connection,
      };
      const devices = await this.cpDeviceLogRepository.create(createData);
      await this.cpDeviceLogRepository.save(devices);
      this.errorHandler.logDebug('Create Log Device Successfully');
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'createLogDevice error');
    }
  }

  async createLogTonages(dto: CreateLogTonages): Promise<any> {
    try {
      this.errorHandler.logDebug('Starting Create Log Tonages');
      const createData = {
        device_id: dto.device_id,
        item_id: dto.item_id,
        item_name: dto.item_name,
        device_name: dto.device_name,
        updated_by: dto.updated_by,
        value: dto.value,
        connection: dto.connection,
      };
      const devices = await this.cpTonagesLogRepository.create(createData);
      await this.cpTonagesLogRepository.save(devices);
      this.errorHandler.logDebug('Create Log Tonages Successfully');
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'createLogTonages Error');
    }
  }

  private async connectionDeviceFail(
    dto: ConnectionDeviceFailDTO,
  ): Promise<any> {
    try {
      await this.changeStatusConnectionDevice(
        dto.item_id,
        false,
        dto.device_id,
      );
      await this.cpDevicesRepository.update(dto.id_device, {
        status: false,
      });
      let updateData = {
        device_id: dto.device_id,
        item_id: dto.item_id,
        item_name: dto.item_name,
        device_name: dto.device_name,
        updated_by: 'USCAVIS',
        status: dto.status_device,
        connection: false,
      };
      await this.createLogDevice(updateData);

      const dataCp = await this.cpRepository.findOneBy({
        cp_id: dto.cp_id,
      });

      if (dataCp.priority_update_status === 'API') {
        let ecnryptIDCp = encryptJSAES(dto.cp_id.toString());
        await this.updateStatusCP(ecnryptIDCp, {
          status: dto.status_cp,
          reason: dto.reason,
        });
        await this.createLogCp({
          cp_id: dto.cp_id,
          status: dto.status_cp,
          reason: dto.reason,
          updated_by: 'USCAVIS',
        });
      }
    } catch (error) {
      return error.message;
    }
  }

  async updateAllPriorityCp(dto: UpdateAllPriorityCpDTO): Promise<any> {
    try {
      if (!dto.priority) {
        return {
          statusCode: 400,
          message: 'Priority is required',
        };
      }
      if (dto.priority !== 'API' && dto.priority !== 'ADMIN') {
        return {
          statusCode: 400,
          message: 'Value Priority invalid',
        };
      }
      await this.databaseService.query(
        `UPDATE cps SET priority_update_status = '${dto.priority}'`,
      );

      return {
        statusCode: 200,
        message: `Success Update All Priority CP to ${dto.priority}`,
      };
    } catch (error) {
      return error.message;
    }
  }

  async findLogDeviceCp(id: string, dto: dtoListLogCp): Promise<any> {
    try {
      let limit = 10;
      let page = 1;
      if (dto.page) {
        page = dto.page;
      }
      if (dto.limit) {
        limit = dto.limit;
      }
      const skip = (page - 1) * limit;
      const cp_id = decryptJSAES(id);

      const result = await this.databaseService.query(`
          SELECT cdl.device_id, cdl.device_name, cdl.item_name, cdl.item_id, cdl."status", cdl.auditupdate, cdl."connection"
          FROM cp_devices cd
          JOIN cp_device_log cdl
            ON cd.uid = cdl.device_id
            AND cd.item_id = cdl.item_id
          WHERE cd.cp_id = ${cp_id}
          ORDER BY cdl.auditupdate DESC
          LIMIT ${limit} OFFSET ${skip};
        `);
      const [totalData] = await this.databaseService.query(`
         SELECT COUNT(*) AS total
          FROM cp_devices cd
          JOIN cp_device_log cdl
            ON cd.uid = cdl.device_id
            AND cd.item_id = cdl.item_id
          WHERE cd.cp_id = ${cp_id};
        `);
      const data = result;
      const total = totalData.total;

      return {
        statusCode: 200,
        data: data.map((data) => {
          return {
            ...data,
          };
        }),
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }
  async findLogTonagesCp(id: string, dto: dtoListLogCp): Promise<any> {
    try {
      let limit = 10;
      let page = 1;
      if (dto.page) {
        page = dto.page;
      }
      if (dto.limit) {
        limit = dto.limit;
      }
      const skip = (page - 1) * limit;
      const cp_id = decryptJSAES(id);

      const result = await this.databaseService.query(`
          SELECT ctl.device_id, ctl.device_name, ctl.item_name, ctl.item_id, ctl."value", ctl.auditupdate, ctl."connection"
          FROM cp_tonages ct
          JOIN cp_tonages_log ctl
            ON ct.uid = ctl.device_id
            AND ct.item_id = ctl.item_id
          WHERE ct.cp_id = ${cp_id}
          ORDER BY ctl.auditupdate DESC
          LIMIT ${limit} OFFSET ${skip};
        `);
      const [totalData] = await this.databaseService.query(`
         SELECT COUNT(*) AS total
          FROM cp_tonages cd
          JOIN cp_tonages_log cdl
            ON cd.uid = cdl.device_id
            AND cd.item_id = cdl.item_id
          WHERE cd.cp_id = ${cp_id};
        `);
      const data = result;
      const total = totalData.total;

      return {
        statusCode: 200,
        data: data.map((data) => {
          return {
            ...data,
          };
        }),
        total,
        page,
        lastPage: Math.ceil(total / limit),
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }
  async getCpEntranceOptionList(payload: CpEntraceTypeOptionListDTO) {
    const [data, total] = await this.cpEntranceTypeRepository.findAndCount({
      skip: (payload.page - 1) * payload.limit,
      take: payload.limit,
      where: !!payload.search
        ? [{ type: ILike(`%${payload.search}%`) }]
        : undefined,
    });

    return {
      data,
      total,
      page: payload.page,
      lastPage: Math.ceil(total / payload.limit),
    };
  }
  async getCpExitOptionList(payload: GetCpExitTypeOptionListDTO) {
    const [data, total] = await this.cpExitTypeRepository.findAndCount({
      skip: (payload.page - 1) * payload.limit,
      take: payload.limit,
      where: !!payload.search
        ? [{ type: ILike(`%${payload.search}%`) }]
        : undefined,
    });

    return {
      data,
      total,
      page: payload.page,
      lastPage: Math.ceil(total / payload.limit),
    };
  }
}
