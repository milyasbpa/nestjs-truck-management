import { DatabaseService } from 'src/utils/database.service';
import { forwardRef, HttpException, Inject, Injectable } from '@nestjs/common';
import { QueryLoaderService } from '@utils/query-loader.service';
import { mapTruckType, sleep } from '@utils/functions.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { VideotroNotifMappingService } from '../vidiotron-notif/videotro-notif-mapping.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueueLaneRules } from 'src/queue_lane/entities/queue_lane_rule.entity';
import { CacheService } from '@utils/cache.service';
import { exit } from 'process';
import { SimpangBayahService } from 'src/services/simpangbayah.service';
import { MutexService } from '@utils/mutex.service';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';

@Injectable()
export class TruckMonitoringService {
  //private readonly logger = new Logger(TruckMonitoringService.name);
  private queryLoader = new QueryLoaderService('queries.sql');
  private lockMonitorServiceSimpangBayah: boolean;

  constructor(
    @InjectRepository(QueueLaneRules)
    private readonly queuelaneRepo: Repository<QueueLaneRules>,
    @Inject(forwardRef(() => DatabaseService))
    private databaseService: DatabaseService,
    @Inject(forwardRef(() => ErrorHandlerService))
    private errorHandler: ErrorHandlerService,
    // @Inject(forwardRef(() => VideotroNotifMappingService))
    // private videoTronNotif: VideotroNotifMappingService,
    //@Inject(forwardRef(() => CacheService))
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => SimpangBayahService))
    private readonly simpangBayahService: SimpangBayahService,
    @Inject(forwardRef(() => MutexService))
    private readonly lockedService: MutexService,
    private vidioTronNotifService: VidiotronNotifService,
  ) {}

  async monitorTrucks() {
    this.errorHandler.logDebug('Starting Monitoring trucks');
    if (this.lockMonitorServiceSimpangBayah === true) {
      this.errorHandler.logDebug('MonitorTrucks is already running!');
      return;
    }
    const startTime = Date.now();
    try {
      this.lockMonitorServiceSimpangBayah = true;
      // Step 1: Fetch trucks near geolocation "simpang bayah"
      const query = this.queryLoader.getQueryById('query_simpang_bayah');
      const trucks = await this.databaseService.query(query);
      for (const truck of trucks) {
        //dimatikan pindah via kafka
        //await this.assignmentToCPQueueByTruck(null, truck, '');
      }
      const checkDuplicate = await this.databaseService.query(
        `SELECT truck_id, lane_id, truck_type,status,COUNT(*) AS total
            FROM cp_queue_assignments
            WHERE status != 'COMPLETED'
            GROUP BY truck_id, lane_id, truck_type,status
            HAVING COUNT(*) > 1;`,
      );
      if (checkDuplicate) {
        for (const row of checkDuplicate) {
          const dataDuplicate = await this.databaseService.query(
            `SELECT assignment_id FROM cp_queue_assignments 
                WHERE truck_id = '${row.truck_id}' AND lane_id = '${row.lane_id}' AND STATUS != 'COMPLETED'
                ORDER BY assignment_id ASC`,
          );

          let index = 1;
          for (const data of dataDuplicate) {
            const deleteQuery = `
                DELETE FROM cp_queue_assignments 
                WHERE assignment_id = ${dataDuplicate[index].assignment_id}`;
            await this.databaseService.query(deleteQuery);
            index += 1;
          }
        }
      }
      await this.databaseService.query(
        this.queryLoader.getQueryById('last_job_executed'),
        ['job-monitor-simpang-bayah'],
      );
      //const result =
      //await this.simpangBayahService.getCpQueueAssignmentChanges();
    } catch (error) {
      this.errorHandler.logError('Error monitoring simpang bayah:', error);
      this.errorHandler.saveLogToDB(
        'Job-ApiGetMonitoringSimpangBayah',
        'import',
        'error',
        error,
        null,
      );
      return error.message;
    } finally {
      this.lockMonitorServiceSimpangBayah = false;
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.errorHandler.logDebug(
        `Truckmonitor was done in ${executionTime} ms`,
      );
    }
  }

  private async getEligibleLane(truckType: string) {
    const query = this.queryLoader.getQueryById('query_rule_simpangbayah');
    return await this.databaseService.query(query, [truckType]);
  }

  async checkLaneCapacityAndSafety(
    laneId: number,
    truck_type: string,
    max_capacity: number,
    checkByTruckType: boolean,
    isOverLoadedAllowed: boolean,
  ): Promise<any> {
    let result: any;
    let query = null;
    if (checkByTruckType) {
      query = this.queryLoader.getQueryById('query_rule_lane');
      result = await this.databaseService.query(query, [laneId, truck_type]);
    } else {
      query = this.queryLoader.getQueryById('query_rule_lane_no_truck_type');
      result = await this.databaseService.query(query, [laneId]);
    }
    if (!result.length) {
      return {
        isElligable: false,
        lane_id_result: laneId,
        current_data: 0,
        current_data_in_percent: 'undefined',
        message: `Not Found data for this query: query`,
      };
    }
    const current_count = result[0].current_count;
    let currentPercent: number = 0;
    currentPercent = Number(
      ((Number(max_capacity) - Number(current_count)) / Number(max_capacity)) *
        100,
    );
    currentPercent = parseFloat(currentPercent.toFixed(2));
    if (isOverLoadedAllowed === true) {
      return {
        isElligable: true,
        lane_id_result: laneId,
        current_data: Number(max_capacity) - Number(current_count),
        current_data_in_percent: currentPercent,
        message: `This Lane is overloaded by pass`,
      };
    } else {
      if (Number(current_count) < Number(max_capacity)) {
        return {
          isElligable: true,
          lane_id_result: laneId,
          current_data_in_percent: currentPercent,
          current_data: Number(max_capacity) - Number(current_count),
          message: `This Lane is still valid under maximum capacity.`,
        };
      } else {
        return {
          isElligable: false,
          lane_id_result: laneId,
          current_data_in_percent: currentPercent,
          current_data: Number(max_capacity) - Number(current_count),
          message: `This Lane is overloaded`,
        };
      }
    }
  }

  private async addTruckToQueue(
    client: any | null,
    laneId: number,
    truck: any,
    typeOfTruck: string,
    driver_name: string,
    lane_id_sb: number,
  ) {
    const lane_name_sb = await this.getLaneNameSimpangBayah(lane_id_sb);
    const conn = client || this.databaseService;
    const query = this.queryLoader.getQueryById('add_truck_queue');
    await conn.query(query, [
      truck.truck_id,
      laneId,
      typeOfTruck,
      driver_name,
      lane_name_sb,
    ]);
  }
  private async isTruckIDNotCompleted(truck_id: number): Promise<boolean> {
    const query = this.queryLoader.getQueryById(
      'prevent_truck_id_before_complated',
    );
    const row = await this.databaseService.queryOne(query, [Number(truck_id)]);
    return row.exists;
  }

  // public async sendNotifFromSimpangBayahToLane(
  //   noLambung: string,
  //   typeOfTruck: string,
  //   laneId: number,
  // ): Promise<void> {
  //   try {
  //     const maxQueue = await this.getTotalMaxCapacityOfLanes(laneId);
  //     const currentQueue = await this.getCountOfLaneLoad(laneId);
  //     console.log({
  //       checklogMaxQueue: maxQueue,
  //       checkLogCurrentQueue: currentQueue,
  //     });
  //     if (noLambung) {
  //       const lane = `L${laneId}`;
  //       await this.videoTronNotif.sendNotificationSimpangBayahToLane(
  //         lane,
  //         noLambung,
  //         typeOfTruck,
  //         maxQueue,
  //         currentQueue,
  //         laneId,
  //       );
  //       console.info(`truck ${noLambung} assign to lane ${lane}`);
  //     } else {
  //       console.error(`Truck whit noLambung ${noLambung} not found`);
  //     }
  //   } catch (error: any) {
  //     console.error(error);
  //   }
  // }

  // async getTotalMaxCapacityOfLanes(laneId: number): Promise<number> {
  //   try {
  //     const query = this.queryLoader.getQueryById('lane_max_capacity');
  //     const data = await this.databaseService.queryOne(query, [laneId]);
  //     return Number(data.max_capacity);
  //   } catch (error: any) {
  //     console.error(error);
  //     throw new HttpException('Failed to get data from database', 400);
  //   }
  // }
  //
  // async getCountOfLaneLoad(laneId: number): Promise<number> {
  //   try {
  //     const query = this.queryLoader.getQueryById('current_load_lane');
  //     const data = await this.databaseService.queryOne(query, [laneId]);
  //     return Number(data.count);
  //   } catch (error: any) {
  //     console.error(error);
  //     throw new HttpException('Failed to get data from database', 400);
  //   }
  // }

  async getQueueLanes() {
    const query = this.queryLoader.getQueryById('query_queue_lane');
    const list = await this.databaseService.query(query, []);
    return list;
  }

  async assignmentToCPQueueByTruck(
    conn: any | null,
    truck: any,
    driver_name: string,
    lane_id_sb: number,
  ): Promise<any> {
    const client = conn || this.databaseService;
    const messagePercheck = [];
    let message: any;
    let isValid = false;
    let lane_id;
    debugger;
    try {
      this.errorHandler.logDebug(`{ StartingProcessTruckID: ${truck.truck_id}`);
      const isExist = await this.isTruckIDNotCompleted(truck.truck_id);
      this.errorHandler.logDebug(`{ CheckingExist: ${isExist}}`);
      if (isExist === true) {
        messagePercheck.push(
          `The Truck_id : ${truck.truck_id} is already exists in cp_queue_assignment has not completed!,failed to saved!`,
        );
        message = JSON.stringify(messagePercheck);
        this.errorHandler.saveLogToDB(
          'AssignmentToCPQueue',
          `AssignmentToCPQueue-${truck.truck_id}`,
          'debug',
          JSON.stringify(message),
          null,
        );
        return {
          truck_id: truck.truck_id,
          status: isValid,
          lane_id_sb: lane_id_sb,
          lane_id_queue: null,
          message: JSON.stringify(messagePercheck),
        };
      }
      this.errorHandler.logDebug('Starting Checking Truck');
      this.errorHandler.logDebug(`Checking truck ID: ${truck.truck_id}`);
      // Step 2: Check lane rulespeoftruck);
      let typeoftruck = mapTruckType(truck.typeoftruck);
      if (!typeoftruck) {
        typeoftruck = truck.typeoftruck;
      }
      const listQL = await this.getQueueLanes();
      this.errorHandler.logDebug(`{ GetListLane: ${JSON.stringify(listQL)}}`);
      const { last_lane_id, DataLanes } = await this.getLanesEllible(
        listQL,
        typeoftruck,
        truck,
      );
      lane_id = last_lane_id;
      if (lane_id !== null) {
        await this.addTruckToQueue(
          client,
          lane_id,
          truck,
          typeoftruck,
          driver_name,
          lane_id_sb,
        );
        this.errorHandler.logDebug(
          `Truck ID: ${truck.truck_id} added to lane ${lane_id}`,
        );
        const infoLanes = JSON.stringify(DataLanes);
        const msg = `Truck ID: ${truck.truck_id} added to lane ${lane_id} & Info each-lanes: ${infoLanes} `;
        this.errorHandler.saveLogToDB(
          'AssignmentToCPQueue',
          `AssignmentToCPQueue-${truck.truck_id}`,
          'debug',
          msg,
          null,
        );
        isValid = true;
      } else {
        isValid = false;
      }
      const queue_lane_name = await this.getLaneNameById(lane_id);
      return {
        truck_id: truck.truck_id,
        status: isValid,
        lane_id_sb: lane_id_sb,
        lane_id_queue: lane_id,
        queue_lane_name: queue_lane_name,
        message: 'checking ok',
      };
    } catch (error) {
      this.errorHandler.logError('Error monitoring trucks:', error);
      this.errorHandler.saveLogToDB(
        'AssignmentToCPQueue',
        `AssignmentToCPQueue-${truck.truck_id}`,
        'error',
        JSON.stringify(error),
        null,
      );
      return {
        truck_id: truck.truck_id,
        status: 'error',
        lane_id_queue: null,
        lane_id_sb: lane_id_sb,
        queue_lane_name: '',
        message: error,
      };
    }
  }
  async getLanesEllible(
    listQL: any,
    typeoftruck: any,
    truck: any,
  ): Promise<any> {
    let lane_id;
    let Roleofmax_capacity;
    let isTruckType: boolean = true;
    let isOverLoadedAllowed: boolean = false;
    const messagePercheck = [];
    const DataLanes = [];
    for (const QL of listQL) {
      lane_id = QL.id;
      Roleofmax_capacity = 0;
      if (typeoftruck === null) {
        isTruckType = false;
        Roleofmax_capacity = QL.max_capacity;
        typeoftruck = 'DT';
      } else {
        const RsRole1 = await this.queuelaneRepo.findOne({
          where: { queue_lane_id: QL.id, truck_type: typeoftruck },
        });
        if (RsRole1) {
          //isOverLoadedAllowed = RsRole1.overload_allowed;
          isTruckType = true;
          Roleofmax_capacity = RsRole1.max_capacity;
        } else {
          isTruckType = false;
          Roleofmax_capacity = QL.max_capacity;
        }
        isOverLoadedAllowed = true;
      }
      this.errorHandler.logDebug('Starting Checking Eligible Truck');
      // Step 3: Check capacity and safety distance
      const {
        isElligable,
        lane_id_result,
        current_data,
        current_data_in_percent,
        message,
      } = await this.checkLaneCapacityAndSafety(
        lane_id,
        typeoftruck,
        Roleofmax_capacity,
        isTruckType,
        isOverLoadedAllowed,
      );
      //console.log({ CheckingEligible: isElligable });
      if (isElligable) {
        DataLanes.push({
          lane_id: lane_id_result,
          current_data: current_data,
          current_data_in_percent: current_data_in_percent,
        });
        messagePercheck.push(
          `The Truck_id : ${truck.truck_id} is elligable for lane :${lane_id_result} , info:${message}`,
        );
      } else {
        messagePercheck.push(
          `The Truck_id : ${truck.truck_id} is not elligable for lane :${lane_id_result}, info:${message}`,
        );
      }
    }
    const message = JSON.stringify(messagePercheck);
    this.errorHandler.saveLogToDB(
      'AssignmentToCPQueue',
      `AssignmentToCPQueue-${truck.truck_id}`,
      'debug',
      JSON.stringify(message),
      null,
    );

    let idx = 0;
    let last_lane_id = null;
    let last_data = null;
    for (const item of DataLanes) {
      if (idx == 0) {
        last_lane_id = item.lane_id;
        last_data = Number(item.current_data_in_percent);
      } else {
        if (Number(last_data) < Number(item.current_data_in_percent)) {
          last_lane_id = item.lane_id;
          last_data = item.current_data_in_percent;
        }
      }
      idx++;
    }
    return { last_lane_id, DataLanes };
  }
  async getLaneNameById(id: number): Promise<string> {
    const Rs = await this.databaseService.queryOne(
      'SELECT lane_name FROM queue_lane WHERE id=$1',
      [id],
    );
    if (Rs) {
      return Rs.lane_name;
    } else {
      return '';
    }
  }
  async getLaneNameSimpangBayah(id: number): Promise<string> {
    const Rs = await this.databaseService.queryOne(
      `SELECT lane_code FROM lanes WHERE id=$1`,
      [id],
    );
    if (Rs != null) {
      return Rs.lane_code;
    } else {
      return '';
    }
  }
  /*Not used anymore 
    async assignmentToCPQueueByTruck(
    conn: any | null,
    truck: any,
    driver_name: string,
    lane_id_sb: number,
  ): Promise<any> {
    const client = conn || this.databaseService;
    const messagePercheck = [];
    let message: any;
    let isValid = false;
    try {
      console.log({ StartingProcessTruckID: truck.truck_id });
      const isExist = await this.isTruckIDNotCompleted(truck.truck_id);
      console.log({ CheckingExist: isExist });
      if (isExist === true) {
        messagePercheck.push(
          `The Truck_id : ${truck.truck_id} is already exists in cp_queue_assignment has not completed!,failed to saved!`,
        );
        message = JSON.stringify(messagePercheck);
        this.errorHandler.saveLogToDB(
          'AssignmentToCPQueue',
          `AssignmentToCPQueue-${truck.truck_id}`,
          'debug',
          JSON.stringify(message),
          null,
        );
        return {
          truck_id: truck.truck_id,
          status: isValid,
          lane_id_sb: lane_id_sb,
          lane_id_queue: null,
          message: JSON.stringify(messagePercheck),
        };
      }
      console.log('Starting Checking Truck');
      this.errorHandler.logDebug(`Checking truck ID: ${truck.truck_id}`);
      // Step 2: Check lane rulespeoftruck);
      let typeoftruck = mapTruckType(truck.typeoftruck);
      if (!typeoftruck) {
        typeoftruck = truck.typeoftruck;
      }
      const listQL = await this.getQueueLanes();
      console.log({ GetListLane: listQL });
      let lane_id;
      let Roleofmax_capacity;
      let isEligible;
      let isTruckType: boolean = true;
      isEligible = false;
      let queue_lane_name;
      for (const QL of listQL) {
        lane_id = QL.id;
        queue_lane_name = QL.lane_name;
        Roleofmax_capacity = 0;
        if (typeoftruck === null) {
          isTruckType = false;
          Roleofmax_capacity = QL.max_capacity;
          typeoftruck = 'DT';
        } else {
          const RsRole1 = await this.queuelaneRepo.findOne({
            where: { queue_lane_id: QL.id, truck_type: typeoftruck },
          });
          if (RsRole1) {
            isTruckType = true;
            Roleofmax_capacity = RsRole1.max_capacity;
          } else {
            isTruckType = false;
            Roleofmax_capacity = QL.max_capacity;
          }
        }
        console.log('Starting Checking Eligible Truck');
        // Step 3: Check capacity and safety distance
        isEligible = await this.checkLaneCapacityAndSafety(
          lane_id,
          typeoftruck,
          Roleofmax_capacity,
          isTruckType,
        );
        console.log({ CheckingEligible: isEligible });
        if (isEligible) {
          // Step 4: Add truck to the queue
          await this.addTruckToQueue(
            client,
            lane_id,
            truck,
            typeoftruck,
            driver_name,
          );
          this.logger.debug(
            `Truck ID: ${truck.truck_id} added to lane ${lane_id}`,
          );
          isValid = true;
          messagePercheck.push({
            truck_id: truck.truck_id,
            truck_type: typeoftruck,
            lane_id: lane_id,
            status: 'VALID',
          });
          break;
        } else {
          messagePercheck.push({
            truck_id: truck.truck_id,
            truck_type: typeoftruck,
            lane_id: lane_id,
            status: 'INVALID',
          });
          isValid = false;
        }
      }
      if (isValid) {
        const tmp = JSON.stringify(messagePercheck);
        message = {
          checking_lane: tmp,
          status: 'Assigned successfully',
        };
      } else {
        const tmp = JSON.stringify(messagePercheck);
        message = {
          checking_lane: tmp,
          status: 'Assigned Invalid',
        };
      }

      this.errorHandler.saveLogToDB(
        'AssignmentToCPQueue',
        `AssignmentToCPQueue-${truck.truck_id}`,
        'debug',
        JSON.stringify(message),
        null,
      );
      return {
        truck_id: truck.truck_id,
        status: isValid,
        lane_id_sb: lane_id_sb,
        lane_id_queue: lane_id,
        queue_lane_name: queue_lane_name,
        message: 'checking ok',
      };
    } catch (error) {
      this.logger.error('Error monitoring trucks:', error);
      this.errorHandler.saveLogToDB(
        'AssignmentToCPQueue',
        `AssignmentToCPQueue-${truck.truck_id}`,
        'error',
        JSON.stringify(error),
        null,
      );
      return {
        truck_id: truck.truck_id,
        status: 'error',
        lane_id_queue: null,
        lane_id_sb: lane_id_sb,
        message: error,
      };
    }
  }*/
}
