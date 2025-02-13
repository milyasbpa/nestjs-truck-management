import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { QueryLoaderService } from '@utils/query-loader.service';
import { DatabaseService } from '@utils/database.service';
import { CpQueueAssignment } from './entities/cpqueueassignments.entity';
import { RuleCpQueueDto } from './dto/rule-cp-queue.dto';
import { VideotroNotifMappingService } from '../vidiotron-notif/videotro-notif-mapping.service';
import { TrucksService } from '../trucks/trucks.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cps } from './entities/cps.entity';
import { CpQueues } from './entities/cp_queues.entity';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class TrucksToCPService {
  private readonly logger = new Logger(TrucksToCPService.name);
  private queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private databaseService: DatabaseService,
    // @Inject(forwardRef(() => VideotroNotifMappingService))
    // private videoTronNotif: VideotroNotifMappingService,
    @Inject(forwardRef(() => TrucksService))
    private truckService: TrucksService,
    @InjectRepository(CpQueues)
    private cpQueuesRepository: Repository<CpQueues>,
    private vidoTronNotifService: VidiotronNotifService,
    private readonly errHandler: ErrorHandlerService,
  ) {}

  async updateQueueCPtoCP() {
    new Promise(async (resolve) => {
      try {
        //get the truck from table cp_queue_assignment where exit_time is null sort by id desc
        //create entity cp_queue_assignment
        this.errHandler.logDebug('Fetch data from lane queue');
        const query = this.queryLoader.getQueryById('select_queue_assignment');
        const cpqueueAssignment: CpQueueAssignment[] =
          await this.databaseService.query(query);

        this.errHandler.logDebug(
          `result select_queue_assignment : ${cpqueueAssignment.length}`,
        );
        //looping data, and check where cp will be assign
        //get cp base on lane on truck, check which cp whit less queue
        for (const queue of cpqueueAssignment) {
          this.errHandler.logDebug(
            `Checking is truck ${queue.truck_id} eligible to cp ${queue.lane_id}`,
          );
          let cp;
          const result: RuleCpQueueDto[] = await this.getEligibleCp(
            queue.lane_id,
          );
          if (result && result.length > 0) {
            this.errHandler.logDebug(
              `found data rule_cp_assignment whit lane ${queue.lane_id}`,
            );
            let remain_percentage: number = 0; //initial;
            result.map((row) => {
              this.errHandler.logDebug(`{
                currentLoad: ${row.current_load},
                maxCapacity: ${row.max_capacity},
              }`);
              const remain_in_percentage_current =
                ((Number(row.max_capacity) - Number(row.current_load)) /
                  Number(row.max_capacity)) *
                100;
              if (Number(row.current_load) <= Number(row.max_capacity)) {
                if (remain_in_percentage_current >= remain_percentage) {
                  remain_percentage = remain_in_percentage_current;
                  cp = row;
                }
                this.errHandler.logDebug(`Found Assgin to cp ${row.cp_id}`);
              }
            });
          }
          this.errHandler.logDebug(
            `{logReturnCpAutoAssign: ${JSON.stringify(cp)}}`,
          );
          // let cp: RuleCpQueueDto = await this.getEligibleCp(queue.lane_id);
          if (!cp) {
            this.errHandler.logDebug(
              `Truck ${queue.truck_id} with lane ${queue.lane_id} is not eligible`,
            );
            continue;
          } else {
            //update data cp_queue_assignment
            this.errHandler.logDebug(
              `Truck ${queue.truck_id} with lane ${queue.lane_id} is eligible to cp ${cp.cp_id}`,
            );
            const updateQuery = this.queryLoader.getQueryById(
              'update_cp_queue_assignment',
            );
            await this.databaseService.query(updateQuery, [
              cp.cp_id,
              queue.assignment_id,
            ]);

            // const truck = await this.databaseService.query(
            //   `SELECT nomor_lambung FROM trucks WHERE id = ${queue.truck_id}`,
            // );

            // const vidiotron = await this.databaseService
            //   .query(`SELECT ql.id, ql.lane_name, v.is_dynamic
            // FROM queue_lane ql
            // LEFT JOIN vidiotron_cp vc ON vc.cp_id = ql.id
            // JOIN vidiotron v ON vc.vidiotron_id = v.id
            // WHERE ql.id = '${queue.lane_id}'`);
            // if (vidiotron[0].is_dynamic === true) {
            //   await this.vidoTronNotifService.saveNotifCpQueue(
            //     cp.cp_queue_id,
            //     queue.lane_id,
            //     queue.truck_id,
            //   );
            // }
            await this.vidoTronNotifService.saveNotifCpQueue(
              cp.cp_id,
              queue.lane_id,
              queue.truck_id,
            );
            // await this.vidoTronNotifService.saveNotifCp(
            //   cp.cp_id,
            //   queue.lane_id,
            //   queue.truck_id,
            // );
          }
        }
        await this.databaseService.query(
          this.queryLoader.getQueryById('last_job_executed'),
          ['job-monitor-cp'],
        );
      } catch (error: any) {
        this.logger.error(error);
      }
      resolve(true);
    });
  }

  private async getEligibleCp(laneId: number): Promise<any> {
    try {
      // const query = this.queryLoader.getQueryById('rule_cp_queue_assignment');
      const result: RuleCpQueueDto[] = await this.databaseService.query(
        `
        SELECT 
            rlc.cp_id,
            cp.max_capacity,
            (
                SELECT 
                    COUNT(*) 
                FROM 
                    cp_queue_assignments cqa 
                WHERE 
                    cqa.cp_queue_id = rlc.cp_id 
                    AND cqa.status IN ('ASSIGNED_TO_CP','ARRIVED','ASSIGNED_TO_CP')
                    AND cqa.auditupdate >= CAST(CURRENT_DATE AS TIMESTAMP)
                    AND cqa.auditupdate <= CAST(CURRENT_DATE AS TIMESTAMP) + INTERVAL '11 hours 59 minutes'
            ) AS current_load
        FROM 
            rule_lane_cp rlc
        INNER JOIN cps cp ON cp.cp_id = rlc.cp_id
        WHERE 
            rlc.queue_lane_id = $1
        `,
        [laneId],
      );
      return result;
    } catch (error: any) {
      this.logger.error(error);
      return null;
    }
  }

  async observStatusAssignCpInRfidStatus(): Promise<any> {
    try {
      this.errHandler.logDebug(
        'Starting Job Observation Status Truck Assign CP in Rfid Status',
      );
      const result = await this.databaseService.query(`
        SELECT assignment_id, truck_id, status, auditupdate, exit_time
        FROM cp_queue_assignments
        WHERE status = 'ASSIGNED_TO_CP'
    `);

      for (const row of result) {
        // Use `of` to iterate through the result array
        this.errHandler.logDebug('Starting Observation Status truck in Rfid');

        const [returnStatus] = await this.databaseService.query(`
            SELECT event_type, auditupdate
            FROM rfid_transaction
            WHERE truck_id = ${row.truck_id}
            ORDER BY auditupdate DESC
            LIMIT 1
        `);
        const auditUpdateTime = new Date(row.auditupdate);

        // Hitung batas maksimum waktu
        const [getRfidTresholdMax] = await this.databaseService.query(
          'SELECT max_threshold_in_hours FROM rfid_threshold',
        );
        const nowUTC = new Date();
        const nowWITA = new Date(nowUTC.getTime() + 8 * 60 * 60 * 1000);
        const maxThresholdInMs =
          getRfidTresholdMax.max_threshold_in_hours * 60 * 60 * 1000;
        const maxAllowedTime = new Date(
          auditUpdateTime.getTime() + maxThresholdInMs,
        );

        if (returnStatus && returnStatus.event_type === 'Completed') {
          this.errHandler.logDebug(
            `Truck status Completed in Rfid last update: ${returnStatus.auditupdate}`,
          );
          this.errHandler.logDebug('Comparing status in Cp Assignments');
          if (row.status !== 'COMPLETED') {
            if (nowWITA > maxAllowedTime) {
              await this.databaseService.query(`
                      UPDATE cp_queue_assignments
                      SET status = 'COMPLETED'
                      WHERE assignment_id = ${row.assignment_id}
                  `);
            }
            this.errHandler.logDebug(
              `Status updated to COMPLETED for assignment_id: ${row.assignment_id}`,
            );
          }
        } else if (!returnStatus) {
          this.errHandler.logDebug(
            'Start Pocess Completed Status Truck With Null RFID',
          );
          const [getAssignment] = await this.databaseService.query(`
            SELECT assignment_id FROM cp_queue_assignments WHERE truck_id = ${row.truck_id} ORDER BY auditupdate DESC LIMIT 1
          `);
          if (nowWITA > maxAllowedTime) {
            await this.databaseService.query(`
              UPDATE cp_queue_assignments
              SET status = 'COMPLETED'
              WHERE assignment_id = ${getAssignment.assignment_id}
          `);
          }
          this.errHandler.logDebug(
            `Status updated to COMPLETED for assignment_id: ${getAssignment.assignment_id}`,
          );
          this.errHandler.logDebug(
            'Done Process Completed Status Truck With Null RFID',
          );
        } else {
          if (row.auditupdate) {
            // Periksa apakah waktu sekarang melebihi batas maksimum
            // if (nowWITA > maxAllowedTime) {
            //   console.log(
            //     'Start Prosess Completed Status assignment over treshold RFID',
            //   );
            //   await this.databaseService.query(`
            //     UPDATE cp_queue_assignments
            //     SET status = 'COMPLETED'
            //     WHERE assignment_id = ${row.assignment_id}
            //     `);
            //   console.log(
            //     'Done Prosess Completed Status assignment over treshold RFID',
            //   );
            // } else {
            //   console.log(
            //     `Truck With ID ${row.truck_id} masih dalam batas waktu`,
            //   );
            // }
          }
        }
      }
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'observStatusAssignCpInRfidStatus error',
      );
    }
  }

  // private async sendNotifToVidioTron(
  //   truckId: number,
  //   maxQueue: number,
  //   currentQueue: number,
  //   laneId: number,
  //   cp_queue_id: number,
  // ): Promise<void> {
  //   try {
  //     //get truck data and create message from truck information
  //     const truck = await this.truckService.findOne(truckId);
  //     const cPQueues = await this.cpQueuesRepository.findOneBy({
  //       queue_id: cp_queue_id,
  //     });
  //     if (truck && cPQueues) {
  //       const lane = `L${laneId}`;
  //       const cpName = cPQueues.queue_name;
  //       const noLambung = truck.nomor_lambung;
  //       const truckType = truck.typeoftruck;
  //       this.videoTronNotif.sendNotificationLaneQueueToCp(
  //         lane,
  //         cpName,
  //         noLambung,
  //         truckType,
  //         maxQueue,
  //         currentQueue,
  //         laneId,
  //         cPQueues.queue_id,
  //       );
  //       console.info(`truck ${truckId} assign to cp ${cpName}`);
  //     } else {
  //       console.error(`Truck whit id ${truckId} not found`);
  //     }
  //   } catch (error: any) {
  //     console.error(error);
  //   }
  // }

  async getElligableCP(cpqAssignment: any) {
    const truck_id = cpqAssignment.truck_id;
    const truck_type = cpqAssignment.assignme;
    const CPSInfo = [];
    //cari cps
    const query = `select max_capacity from cps WHERE status is true`;
    const CpsList = await this.databaseService.query(query);
    for (const cps of CpsList) {
      const max_capacity = cps.max_capacity;
      //cek queue_rule_lane
    }
  }
  async isValiByQueue_Rule_lane_CP(cp_id: number, queue_lane_id: number) {
    const query =
      'SELECT EXISTS(SELECT 1 FROM rule_lane_cp_queues WHERE cp_queue_id=$1 AND queue_lane_id=$2) exists';
    const Rs = await this.databaseService.queryOne(query, [
      cp_id,
      queue_lane_id,
    ]);
    return Rs.exists;
  }
  async getCurrentLoadEachCPS(cp_id: number, queue_lane_id: number) {
    const query =
      'SELECT EXISTS(SELECT 1 FROM rule_lane_cp_queues WHERE cp_queue_id=$1 AND queue_lane_id=$2) exists';
    const Rs = await this.databaseService.queryOne(query, [
      cp_id,
      queue_lane_id,
    ]);
    return Rs.exists;
  }
}
