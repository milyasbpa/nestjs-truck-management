import { TruckHistoryService } from './../history/truck_history_cp/truck_history_cp.service';
import { TruckHistoryCpEntity } from './../history/truck_history_cp/entities/truck_history_cp.entities';
import { isValid } from 'date-fns';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RfidReaderIn } from './entities/rfid-reader-in.entity';
import { Repository } from 'typeorm';
import { RfidReaderOut } from './entities/rfid-reader-out.entity';
import { ValidationService } from '@utils/validation-service';
import { rfidNotifValidation } from './rfid-validation';
import {
  entranceTypeEnum,
  exitTypeEnum,
  QueueStatusEnum,
  TypeOfRFIDSubmitionEnum,
  WebSocketAntrianCp,
} from '@utils/enums';
import { RfidTransaction } from './entities/rfid-transaction.entity';
import { Trucks } from '../trucks/entities/trucks.entity';
import { CpDetail } from 'src/jobs/entities/cp_details.entity';
import {
  archiveDataDTO,
  detailRfidTransactionDTO,
  DtCountLocationDTO,
  listAnomalyDTO,
  listRfidTransactionDTO,
  removeAnomaliesDTO,
  removeListTransactionWithouRfidOutDTO,
  rfidAnomalyDTO,
  RfidCpQueueDTO,
  RfidNotifIn,
  RfidNotifOut,
  updateThresholdDTO,
} from './dto/rfid-notif';
import { DatabaseService } from '@utils/database.service';
import { DomainError } from '@utils/domains-error';
import * as ExcelJS from 'exceljs';
import { RfidAnomaly } from './entities/rfid-anomaly.entity';
import { RfidThreshold } from './entities/rfid-threshold.entity';
import * as moment from 'moment';
import { RfidTransactionArchieve } from './entities/rfid-transaction-archive.entity';
import { CpLog } from 'src/jobs/entities/cp_logs.entity';
import { RfidCpQueue } from './entities/rfid-cp-queue.entity';
import { RuleCpQueueDto } from '../jobs/dto/rule-cp-queue.dto';
import { QueryLoaderService } from '@utils/query-loader.service';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { CpQLogService } from 'src/cp-queue-assignments-log/cpQueueAssignmentsLog.service';
import { AssignmentLogCreate } from 'src/cp-queue-assignments-log/dto/cp-queue-assignments-log';
import { LaneService } from 'src/lane/lane.service';
import { SocketClientService } from 'src/websocket/websocket-client.service';
@Injectable()
export class RfidService {
  //private readonly logger = new Logger(RfidService.name);
  private queryLoader = new QueryLoaderService('queries.sql');

  constructor(
    @InjectRepository(RfidReaderIn)
    private readonly rfidReaderInRepository: Repository<RfidReaderIn>,
    @InjectRepository(RfidReaderOut)
    private readonly rfidReaderOutRepository: Repository<RfidReaderOut>,
    @InjectRepository(RfidTransaction)
    private readonly rfidTransactionRepository: Repository<RfidTransaction>,
    @InjectRepository(RfidTransactionArchieve)
    private readonly rfidTransactionArchieveRepository: Repository<RfidTransactionArchieve>,
    @InjectRepository(Trucks)
    private readonly trucksRepository: Repository<Trucks>,
    @InjectRepository(RfidAnomaly)
    private readonly rfidAnomalyRepository: Repository<RfidAnomaly>,
    @InjectRepository(RfidThreshold)
    private readonly rfidThresholdRepository: Repository<RfidThreshold>,
    @InjectRepository(CpLog)
    private readonly cpLogRepository: Repository<CpLog>,
    @InjectRepository(RfidCpQueue)
    private readonly rfidCpQueueRepository: Repository<RfidCpQueue>,
    @InjectRepository(CpDetail)
    private readonly cpDetailRepository: Repository<CpDetail>,
    @InjectRepository(kafkaDTTruckCountLocation)
    private readonly dtCountLocationRepository: Repository<kafkaDTTruckCountLocation>,
    private validationService: ValidationService,
    private databaseService: DatabaseService,
    private vidoTronNotifService: VidiotronNotifService,
    private CpQAssignmentsLog: CpQLogService,
    private laneService: LaneService,
    private readonly errHandler: ErrorHandlerService,
    private readonly truckHistoryService: TruckHistoryService,
    private readonly socketClientService: SocketClientService,
  ) {}

  async notifFromRfidIn(request: RfidNotifIn): Promise<any> {
    let getCPID: number = null;
    this.errHandler.logDebug(
      `receive notif from rfid with request: ${JSON.stringify(request)}`,
    );
    this.validationService.validate(rfidNotifValidation.NOTIFYIN, request);

    try {
      // get cp detail master
      const cpDetails = await this.cpDetailRepository.find({
        where: {
          device_id: request.device_id,
        },
      });

      const truck = await this.trucksRepository.findOneBy({
        nomor_lambung: request.no_lambung,
      });

      if (truck == null) {
        const nextValId = await this.databaseService.query(`
          select nextval('truck_seq_id')
        `);

        const newEntity = await this.trucksRepository.insert({
          id: parseInt(nextValId[0].nextval),
          nomor_lambung: request.no_lambung,
          source: 'RFID',
        });

        if (newEntity.identifiers.length > 0) {
          truck.id = newEntity.identifiers[0].id;
        }
      }

      if (cpDetails) {
        const cpDetailsCreatedAt = new Date();
        cpDetails.forEach(async (cpDetail) => {
          this.errHandler.logDebug(`found cp detail ${cpDetail}`);

          // check previouse trx
          const prevTrx = await this.databaseService.query(`
              select rout.created_at time_out, rin.created_at time_in, cd_in.cp_id, rt.rfid_transaction_id from rfid_transaction rt
              inner join rfid_reader_in rin on rin.rfid_reader_in_id = rt.rfid_reader_in_id
              left join rfid_reader_out rout on rout.rfid_reader_out_id = rout.rfid_reader_out_id
              left join cp_detail cd_in ON cd_in.cp_detail_id = rin.cp_detail_id
              where cd_in.cp_id = ${cpDetail.cp_id}
              order by rt.rfid_transaction_id DESC
              LIMIT 1
           `);

          if (prevTrx.length > 0) {
            const timeIn = moment(prevTrx[0].time_in).tz('Asia/Singapore');
            const timeOut = moment(prevTrx[0].time_out).tz('Asia/Singapore');
            const cpId = prevTrx[0].cp_id;
            getCPID = cpId;
            const dataCpLog = await this.databaseService.query(
              `
              SELECT *
              FROM cp_logs
              WHERE action = 'close'
                AND cp_id = $1
                AND created_at BETWEEN $2 AND $3
              `,
              [cpId, timeIn, timeOut],
            );

            if (dataCpLog.length > 0) {
              await this.databaseService.query(
                `
                UPDATE rfid_transaction
                SET is_valid = false
                WHERE rfid_transaction_id = $1
                `,
                [prevTrx[0].rfid_transaction_id],
              );
            }
          }

          const rfidTransaction = new RfidTransaction();
          rfidTransaction.rfid_transaction_date =
            this.convertStringToTimeStamps(request.date);

          this.errHandler.logDebug(
            `create new rfid in with device id ${request.device_id}`,
          );
          const rfidReaderInNew = new RfidReaderIn();
          rfidReaderInNew.device_id = request.device_id;
          rfidReaderInNew.cp_detail_id = cpDetail.cp_detail_id;
          rfidReaderInNew.rfid_code = request.rfid_tag;
          rfidReaderInNew.photo_url = request.photo_url;
          rfidReaderInNew.created_at = cpDetailsCreatedAt;
          const rfidReaderIn =
            await this.rfidReaderInRepository.save(rfidReaderInNew);
          rfidTransaction.rfid_reader_in_id = rfidReaderIn.rfid_reader_in_id;
          rfidTransaction.event_type = TypeOfRFIDSubmitionEnum.ONPROCESS;

          rfidTransaction.device_id = cpDetail.device_id;
          rfidTransaction.truck_id = truck.id;
          rfidTransaction.driver_name = request.driver_name;
          rfidTransaction.is_valid_rfid = request.is_valid;
          await this.rfidTransactionRepository.save(rfidTransaction);
          await this.truckHistoryService.saveTruckHistoryCPRFID(
            rfidTransaction.is_valid_rfid,
            rfidTransaction.truck_id,
            getCPID,
            'In',
          );
          this.errHandler.logDebug(`{ cpDetailID: ${cpDetail.cp_id}}`);

          const dataAssignments = await this.databaseService.query(
            `SELECT cqa.* , ced.cp_entrance_type_name
              FROM cp_queue_assignments cqa 
              LEFT JOIN cp_entrance_detail ced ON ced.cp_id = cqa.cp_queue_id
              WHERE truck_id = ${truck.id}
              AND cqa.status != 'COMPLETED' 
              ORDER BY auditupdate DESC LIMIT 1`,
          );
          if (dataAssignments.length > 0) {
            const assignment = dataAssignments[0];
            if (assignment.cp_queue_id !== cpDetail.cp_id) {
              await this.databaseService.query(
                `UPDATE cp_queue_assignments SET cp_queue_id = ${cpDetail.cp_id} WHERE assignment_id = ${assignment.assignment_id} `,
              );
            }
            if (
              assignment.cp_entrance_type_name === entranceTypeEnum.RFID &&
              assignment.cp_entrance_type_name !== null
            ) {
              if (assignment.status !== QueueStatusEnum.ASSIGNED_TO_CP) {
                await this.databaseService.query(
                  `UPDATE cp_queue_assignments SET status = '${QueueStatusEnum.ASSIGNED_TO_CP}', assigned_by = 'RFID', cp_queue_id = ${cpDetail.cp_id} WHERE assignment_id = ${assignment.assignment_id} `,
                );
              }
              await this.laneService.sendDataToWebSocket(
                assignment.lane_id,
                cpDetail.cp_id,
                WebSocketAntrianCp.LANETOCP,
                null,
                'RFID',
              );
              this.errHandler.logDebug('created log rfid In RFID');
              const dataCreateLog: AssignmentLogCreate = {
                assignments_id: assignment.assignment_id,
                nomorlambung: request.no_lambung,
                truck_id: truck.id,
                flag: 'IN',
                cp_id: cpDetail.cp_id,
                entrance_by: 'RFID',
              };
              await this.CpQAssignmentsLog.create(dataCreateLog);
            } else if (assignment.cp_entrance_type_name === null) {
              await this.databaseService.query(
                `UPDATE cp_queue_assignments SET status = '${QueueStatusEnum.ASSIGNED_TO_CP}', assigned_by = 'RFID', cp_queue_id = ${cpDetail.cp_id} WHERE assignment_id = ${assignment.assignment_id} `,
              );

              const dataCreateLog: AssignmentLogCreate = {
                assignments_id: assignment.assignment_id,
                nomorlambung: request.no_lambung,
                truck_id: truck.id,
                flag: 'IN',
                cp_id: cpDetail.cp_id,
                entrance_by: 'RFID',
              };
              await this.CpQAssignmentsLog.create(dataCreateLog);
            }
          }
        });
      }
      return {
        status: 200,
        message: 'success',
      };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_NOTIFY_IN} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async CPQueueRFID(request: RfidCpQueueDTO): Promise<any> {
    try {
      const truck = await this.trucksRepository.findOneBy({
        nomor_lambung: request.no_lambung,
      });

      if (!truck) {
        throw new HttpException(
          `Truck with nomor_lambung ${request.no_lambung} not found.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const rfidCpQueue = new RfidCpQueue();
      rfidCpQueue.lane_id = request.lane_id;
      rfidCpQueue.created_at = request.date;
      rfidCpQueue.truck_id = truck.id;
      rfidCpQueue.device_id = request.device_id;
      rfidCpQueue.status = request.status;
      rfidCpQueue.is_valid = request.is_valid;
      rfidCpQueue.rfid_tag = request.rfid_tag;
      await this.rfidCpQueueRepository.save(rfidCpQueue);

      return true;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_CP_QUEUE} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async dtCountLocation(request: DtCountLocationDTO): Promise<any> {
    try {
      const data = await this.databaseService.query(`
        SELECT * 
        FROM kafka_dt_truck_count_location
        ORDER BY id DESC
        LIMIT 1;

        `);

      return data;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_DT_COUNT_LOCATION} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async notifFromRfidOut(request: RfidNotifOut): Promise<any> {
    this.errHandler.logDebug(
      `receive notif out from rfid with request: ${JSON.stringify(request)}`,
    );
    this.validationService.validate(rfidNotifValidation.NOTIFYOUT, request);

    try {
      const truck = await this.trucksRepository.findOneBy({
        nomor_lambung: request.no_lambung,
      });

      this.errHandler.logDebug(`found truck ${JSON.stringify(truck)}`);

      const cpDetailOut = await this.cpDetailRepository.findOne({
        where: {
          desc: 'OUT',
          device_id: request.device_id,
        },
      });

      this.errHandler.logDebug(`create new rfid out with code ${request.device_id}`);
      const rfidReaderOutNew = new RfidReaderOut();
      rfidReaderOutNew.device_id = request.device_id;
      rfidReaderOutNew.cp_detail_id = cpDetailOut.cp_detail_id;
      rfidReaderOutNew.rfid_code = request.rfid_tag;
      rfidReaderOutNew.created_at = moment(request.date).toDate();
      const rfidReaderOut =
        await this.rfidReaderOutRepository.save(rfidReaderOutNew);

      // get
      const existingRfidTransactions = await this.rfidTransactionRepository
        .createQueryBuilder('rfid_transaction')
        .where(
          `rfid_transaction.rfid_reader_out_id IS NULL AND rfid_transaction.truck_id = ${truck.id}`,
        )
        .getMany();

      existingRfidTransactions.forEach(async (existingRfidTransaction) => {
        try {
          this.errHandler.logDebug(
            `the existing rfid transaction found and set the id ${existingRfidTransaction.rfid_transaction_id}`,
          );
          const rfidTransaction = new RfidTransaction();
          rfidTransaction.rfid_transaction_date =
            this.convertStringToTimeStamps(request.date);
          rfidTransaction.rfid_transaction_id =
            existingRfidTransaction.rfid_transaction_id;
          rfidTransaction.truck_id = truck.id;
          rfidTransaction.rfid_reader_out_id = rfidReaderOut.rfid_reader_out_id;
          rfidTransaction.event_type = TypeOfRFIDSubmitionEnum.COMPLETED;
          rfidTransaction.rfid_reader_in_id =
            existingRfidTransaction.rfid_reader_in_id;
          rfidTransaction.device_id = existingRfidTransaction.device_id;

          const rfReaderIn = await this.rfidReaderInRepository.findOne({
            where: {
              rfid_reader_in_id: existingRfidTransaction.rfid_reader_in_id,
            },
          });

          const cpDetailIn = await this.cpDetailRepository.findOne({
            where: {
              cp_detail_id: rfReaderIn.cp_detail_id,
            },
          });

          // set invalid rfid based on request of fe
          rfidTransaction.is_valid_rfid = request.is_valid;
          if (cpDetailIn !== null && cpDetailOut !== null) {
            rfidTransaction.is_valid = cpDetailIn.cp_id == cpDetailOut.cp_id;
          } else {
            rfidTransaction.is_valid = false;
          }

          // send to endpoint to take out the truck
          // check if any anomaly
          const anomaly = await this.rfidAnomalyRepository.findOne({
            where: {
              rfid_transaction_id: existingRfidTransaction.rfid_transaction_id,
            },
          });

          if (anomaly) {
            anomaly.deleted_at = new Date();
            await this.rfidAnomalyRepository.save(anomaly);
          }

          await this.rfidTransactionRepository.save(rfidTransaction);
          await this.truckHistoryService.saveTruckHistoryCPRFID(
            rfidTransaction.is_valid_rfid,
            rfidTransaction.truck_id,
            cpDetailOut ? cpDetailOut?.cp_id : null,
            'Out',
          );
          const dataAssignments = await this.databaseService.query(
            `SELECT cqa.* ,cps.cp_name, ced.cp_exit_type_name
            FROM cp_queue_assignments cqa 
            JOIN cps ON cps.cp_id = cqa.cp_queue_id 
            LEFT JOIN cp_exit_detail ced ON ced.cp_id = cqa.cp_queue_id
            WHERE truck_id = ${truck.id}
            AND cqa.status != 'COMPLETED' 
            ORDER BY auditupdate DESC LIMIT 1`,
          );
          const socketClient = this.socketClientService.getSocket();
          if (dataAssignments.length > 0) {
            const assignment = dataAssignments[0];

            if (
              assignment.cp_exit_type_name === exitTypeEnum.RFID &&
              assignment.cp_exit_type_name !== null
            ) {
              if (assignment.status !== QueueStatusEnum.COMPLETED) {
                await this.databaseService.query(
                  `UPDATE cp_queue_assignments SET status = '${QueueStatusEnum.COMPLETED}', completed_by = 'RFID' WHERE assignment_id = ${assignment.assignment_id}`,
                );
              }
              await this.laneService.sendDataToWebSocket(
                Number(assignment.cp_queue_id),
                null,
                WebSocketAntrianCp.COMPLETED,
                null,
                'RFID',
              );
              const msg = `${assignment.nomor_lambung} - Dumping Selesai ${assignment.cp_name}, via RFID OUT`;
              socketClient.emit('toast_dumping_completed', {
                data: msg,
              });

              const dataCreateLog: AssignmentLogCreate = {
                assignments_id: assignment.assignment_id,
                nomorlambung: request.no_lambung,
                truck_id: truck.id,
                flag: 'OUT',
                cp_id: cpDetailOut.cp_id,
                exit_by: 'RFID',
              };

              await this.CpQAssignmentsLog.create(dataCreateLog);
            } else if (assignment.cp_exit_type_name === null) {
              await this.databaseService.query(
                `UPDATE cp_queue_assignments SET status = '${QueueStatusEnum.COMPLETED}', completed_by = 'RFID' WHERE assignment_id = ${assignment.assignment_id}`,
              );
              const msg = `${assignment.nomor_lambung} - Dumping Selesai ${assignment.cp_name}, via RFID OUT`;
              socketClient.emit('toast_dumping_completed', {
                data: msg,
              });

              const dataCreateLog: AssignmentLogCreate = {
                assignments_id: assignment.assignment_id,
                nomorlambung: request.no_lambung,
                truck_id: truck.id,
                flag: 'OUT',
                cp_id: cpDetailOut.cp_id,
                exit_by: 'RFID',
              };

              await this.CpQAssignmentsLog.create(dataCreateLog);
            }
          }
        } catch (error) {
          this.errHandler.logError('notifFromRfidOut', error);
        }
      });

      await this.assignNewTtruckToCP(truck.id);

      return {
        responseHttp: {
          status: 200,
          message: 'success',
        },
        responseData: {
          nomor_lambung: truck.nomor_lambung,
        },
      };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_NOTIFY_OUT} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async assignNewTtruckToCP(truck_id: number): Promise<void> {
    try {
      //find last assignment of truck
      this.errHandler.logDebug(
        `find last data from cp_queue_assignment by truck id ${truck_id}`,
      );
      const cpQueueAssignments = await this.databaseService.query(
        `
          SELECT * FROM cp_queue_assignments
          WHERE truck_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `,
        [truck_id],
      );

      if (cpQueueAssignments) {
        try {
          this.errHandler.logDebug(
            `found last data from cp_queue_assignment by truck id ${truck_id} assignment_id ${cpQueueAssignments[0].assignment_id}`,
          );
          const cpQueueAssignment = cpQueueAssignments[0];

          // update cp_queue_assignment
          this.errHandler.logDebug(
            `update cp_queue_assignment ${cpQueueAssignment.assignment_id}`,
          );
          await this.databaseService.query(
            `
            UPDATE cp_queue_assignments
            SET status = $1, auditupdate=now(),
            exit_cp_time=now()  
            WHERE assignment_id = $2
          `,
            [QueueStatusEnum.COMPLETED, cpQueueAssignment.assignment_id],
          );

          this.errHandler.logDebug(
            `find eligible cp for truck on lane ${cpQueueAssignment.lane_id}`,
          );
          const rulesCp = await this.getEligibleCp(cpQueueAssignment.lane_id);
          let cp;
          if (rulesCp && rulesCp.length > 0) {
            this.errHandler.logDebug(
              `found data rule_cp_assignment whit lane ${cpQueueAssignment.lane_id}`,
            );

            // Get CP with minimum current load
            cp = rulesCp.reduce((min, row) =>
              Number(row.current_load) < Number(min.current_load) ? row : min,
            );

            if (Number(cp.current_load) < cp.max_capacity) {
              if (!cp) {
                this.errHandler.logDebug(
                  `Cp Not found for queue on lane ${cpQueueAssignment.lane_id}`,
                );
              } else {
                this.errHandler.logDebug(`{ logReturnCpAutoAssign: ${JSON.stringify(cp)}}`);
                this.errHandler.logDebug(
                  `find last data cp_queue_assignment from lane ${cpQueueAssignment.lane_id}`,
                );
                const assignNewQueueToCPList = await this.databaseService.query(
                  'select * from cp_queue_assignments cqa where exit_time is null and exit_cp_time is null and status = $1 and lane_id=$2 order by assignment_id desc limit 1',
                  [QueueStatusEnum.WAITING, cpQueueAssignment.lane_id],
                );

                if (assignNewQueueToCPList.length > 0) {
                  const assignNewQueueToCP = assignNewQueueToCPList[0];
                  this.errHandler.logDebug(
                    `Truck ${assignNewQueueToCP.truck_id} with lane ${assignNewQueueToCP.lane_id} is eligible to cp ${cp.cp_id}`,
                  );
                  const updateQuery = this.queryLoader.getQueryById(
                    'update_cp_queue_assignment',
                  );
                  await this.databaseService.query(updateQuery, [
                    cp.cp_id,
                    assignNewQueueToCP.assignment_id,
                  ]);

                  await this.vidoTronNotifService.saveNotifCp(
                    cp.cp_id,
                    assignNewQueueToCP.lane_id,
                    assignNewQueueToCP.truck_id,
                  );
                }
              }
            } else {
              this.errHandler.logDebug(`${cp.cp_id} is full`);
            }
          }
        } catch (error) {
          this.errHandler.logError(`Ooops error assignments new trucks:`,error);

        }
      }
    } catch (error) {
      this.errHandler.logError('Ooops assignNewTtruckToCP error',error);
    }
  }

  private async getEligibleCp(laneId: number): Promise<any> {
    try {
      const result: RuleCpQueueDto[] = await this.databaseService.query(`
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
                    AND cqa.status != 'WAITING'
                    AND cqa.auditupdate >= CAST(CURRENT_DATE AS TIMESTAMP)
                    AND cqa.auditupdate <= CAST(CURRENT_DATE AS TIMESTAMP) + INTERVAL '11 hours 59 minutes'
            ) AS current_load
        FROM 
            rule_lane_cp rlc
        INNER JOIN cps cp ON cp.cp_id = rlc.cp_id
        WHERE 
            rlc.queue_lane_id = '${laneId}'
        `);
      return result;
    } catch (error: any) {
      this.errHandler.logError('Ooops getEligibleCp error ',error);
      return null;
    }
  }

  async removeListTransactionWithouRfidOut(
    request: removeListTransactionWithouRfidOutDTO,
  ) {
    try {
      const query = `
        UPDATE rfid_transaction rt SET deleted_at = NOW()
        WHERE NOT EXISTS (
            SELECT 1
            FROM rfid_reader_out rout
            WHERE rout.rfid_reader_out_id = rt.rfid_reader_out_id
        );
      `;
      const data = await this.databaseService.query(query);

      return true;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_REMOVE_RFID_WITHOUT_OUT} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async detailRfidTranaction(request: detailRfidTransactionDTO): Promise<any> {
    try {
      const query = `
        select  
          trucks.nomor_lambung,
          trucks.typeoftruck,
          rin.photo_url photo_url_in,
          rout.photo_url photo_url_out,
          rin.created_at AT TIME ZONE 'Asia/Singapore' rfid_created_at_in ,
          rout.created_at AT TIME ZONE 'Asia/Singapore' rfid_created_at_out
        from rfid_transaction rt
        inner join trucks on trucks.id  = rt.truck_id 
        LEFT JOIN rfid_reader_in rin 
          ON rin.rfid_reader_in_id = rt.rfid_reader_in_id
        LEFT JOIN rfid_reader_out rout 
          ON rout.rfid_reader_out_id = rt.rfid_reader_out_id
        where rt.rfid_transaction_id = ${request.id} AND rt.deleted_at IS NULL
      `;

      const data = await this.databaseService.query(query);

      if (data.length === 0) {
        this.errHandler.throwBadRequestError('Data not found.','error');
      }

      return data[0];
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_DETAIL_LIST_TRANSACTION} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async removeAnomalies(request: removeAnomaliesDTO) {
    try {
      const query = `
        UPDATE rfid_anomaly rt SET deleted_at = NOW() where id IN (${request.id.join(',')})       
      `;
      const data = await this.databaseService.query(query);

      return true;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_REMOVE_ANOMALY} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async archiveData(request: archiveDataDTO) {
    const rfidarchiveMaxThreshold = process.env.RFID_archive_MAX_THRESHOLD ?? 7;

    try {
      const archiveQuery = `
      INSERT INTO rfid_transaction_archive 
      SELECT * 
      FROM rfid_transaction 
      WHERE created_at > NOW() - INTERVAL '${rfidarchiveMaxThreshold} days'
      ;
    `;
      await this.databaseService.query(archiveQuery);

      // Delete moved records from the original table
      const deleteQuery = `
      DELETE FROM rfid_transaction 
      WHERE rfid_transaction_id IN (
        SELECT rfid_transaction_id 
        FROM rfid_transaction_archive
      );
    `;
      await this.databaseService.query(deleteQuery);

      return true;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_REMOVE_ANOMALY} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async listAnomaly(request: listAnomalyDTO, isExport: boolean = false) {
    try {
      const per_page = request.limit ?? 20;
      const page = request.page ?? 1;
      const order = request.order ?? 'DESC';
      const sort = request.sort ?? 'rt.created_at';
      const offset = (page - 1) * per_page;

      // raw query builder

      const qSelectData = `
        ra.id id,
        trucks.nomor_lambung,
        rt.driver_name,
        cp_master_in.cp_name cp_in,
        cp_master_out.cp_name cp_out,
        rin.created_at AT TIME ZONE 'Asia/Makassar' time_cp_in,
        rout.created_at AT TIME ZONE 'Asia/Makassar' time_cp_out
      `;

      const qJoinAndWhereClause = `
        inner join rfid_transaction rt ON rt.rfid_transaction_id = ra.rfid_transaction_id
        left join rfid_reader_in rin ON rin.rfid_reader_in_id = rt.rfid_reader_in_id
        left join rfid_reader_out rout ON rout.rfid_reader_out_id = rt.rfid_reader_out_id
        LEFT JOIN cp_detail cp_in
          ON cp_in.cp_detail_id = rin.cp_detail_id
        LEFT JOIN cp_detail cp_out
          ON cp_out.cp_detail_id = rout.cp_detail_id
        LEFT JOIN cps cp_master_in
          ON cp_master_in.cp_id = cp_in.cp_id
        LEFT JOIN cps cp_master_out
          ON cp_master_out.cp_id = cp_out.cp_id
        inner join trucks on trucks.id  = rt.truck_id   
        where ra.deleted_at IS NULL      
      `;

      let $qLimitation = ``;

      if (!isExport) {
        $qLimitation = `LIMIT ${per_page} OFFSET ${offset}`;
      }

      const queryData = `
        SELECT 
            ${qSelectData}
          FROM 
              rfid_anomaly ra
          ${qJoinAndWhereClause}                     
          order by ${sort} ${order} 
          ${$qLimitation}           
      `;

      const queryCountData = `
        SELECT 
          count(*) total
        FROM 
          rfid_anomaly ra
        ${qJoinAndWhereClause}
      `;

      const data = await this.databaseService.query(queryData);

      const countData = await this.databaseService.query(queryCountData);

      return {
        data: data,
        total: countData[0].total,
        page: page,
      };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_LIST_ANOMALY} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async rfidStatusList() {
    try {
      const queryData = `
      SELECT enumlabel 
        FROM pg_enum
        WHERE enumtypid = 'public.rfid_transaction_event_type_enum'::regtype;
      `;
      const data = await this.databaseService.query(queryData);

      return {
        data: data.map((item) => {
          return {
            id: item.enumlabel,
            name: item.enumlabel,
          };
        }),
      };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_LIST_TRANSACTION} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async listRfidTransaction(
    request: listRfidTransactionDTO,
    isExport: boolean = false,
  ) {
    try {
      const per_page = request.limit ?? 20;
      const page = request.page ?? 1;
      const order = request.order ?? 'DESC';
      let sort = request.sort ?? 'rt_created_at';
      const offset = (page - 1) * per_page;

      if (sort != 'rt_created_at') {
        switch (sort) {
          case 'nomor_lambung': {
            // sort = 'trucks.nomor_lambung';
            sort = 'trucks.nomor_lambung';
            break;
          }
          case 'rfid_in': {
            // sort = 'rin.rfid_code';
            sort = 'rfid_in';
            break;
          }
          case 'rfid_out': {
            // sort = 'rout.rfid_code';
            sort = 'rfid_out';
            break;
          }
          case 'rfid_in_date': {
            // sort = 'rin.created_at';
            sort = 'rfid_created_at_in';
            break;
          }
          case 'rfid_out_date': {
            // sort = 'rout.created_at';
            sort = 'rfid_created_at_out';
            break;
          }
          default: {
            throw new Error(
              'available sort values are nomor_lambung, rfid_in, rfid_out, rfid_in_date, and rfid_out_date.',
            );
          }
        }
      } else {
        sort = `
        MIN(rt.created_at) AT TIME ZONE 'Asia/Singapore'
        `;
      }

      let whereClause =
        ' AND is_valid IS TRUE AND rt.deleted_at IS NULL AND rin.created_at IS NOT NULL  ';

      if (request.nomor_lambung) {
        whereClause += ` AND  trucks.nomor_lambung = '${request.nomor_lambung}' `;
      }

      if (request.truck_out_date) {
        whereClause += ` AND rout.created_at::date = '${request.truck_out_date}'`;
      }

      if (request.truck_in_date) {
        whereClause += ` AND rin.created_at::date = '${request.truck_in_date}'`;
      }

      if (request.truck_out_date) {
        whereClause += ` AND rout.created_at::date = '${request.truck_out_date}'`;
      }

      if (request.rfid_code_in) {
        whereClause += ` AND rin.rfid_code = '${request.rfid_code_in}'`;
      }

      if (request.rfid_code_out) {
        whereClause += ` AND rout.rfid_code = '${request.rfid_code_out}'`;
      }

      if (request.status) {
        whereClause += ` AND rt.event_type = '${request.status}'`;
      }

      if (request.location_in) {
        whereClause += ` AND cp_master_in.cp_name = '${request.location_in}'`;
      }

      if (request.location_out) {
        whereClause += ` AND cp_master_out.cp_name = '${request.location_out}'`;
      }

      // raw query builder

      // const qSelectData = `
      //   rt.rfid_transaction_id id,
      //   trucks.nomor_lambung,
      //   rin.rfid_code rfid_in,
      //   rout.rfid_code rfid_out,
      //   rin.created_at AT TIME ZONE 'Asia/Singapore' rfid_created_at_in ,
      //   rout.created_at AT TIME ZONE 'Asia/Singapore' rfid_created_at_out,
      //   cp_master_in.cp_name cp_name_in,
      //   cp_master_out.cp_name cp_name_out,
      //   rt.event_type status
      // `;

      const qSelectData = `
        STRING_AGG(DISTINCT rt.rfid_transaction_id::text, ', ') AS id,
        trucks.nomor_lambung AS nomor_lambung,
        STRING_AGG(DISTINCT rin.rfid_code, ', ') AS rfid_in,
        STRING_AGG(DISTINCT rout.rfid_code, ', ') AS rfid_out,
        rin.created_at  AT TIME ZONE 'Asia/Makassar' AS rfid_created_at_in,
        MIN(rout.created_at AT TIME ZONE 'Asia/Makassar') AS rfid_created_at_out,
        STRING_AGG(DISTINCT cp_master_in.cp_name, ', ') AS cp_name_in,
        STRING_AGG(DISTINCT cp_master_out.cp_name, ', ') AS cp_name_out,
        (CASE WHEN MAX(ranomaly.rfid_transaction_id) IS NOT NULL THEN true ELSE false END) is_anomaly,
        rt.event_type AS status
      `;

      // const qJoinAndWhereClause = `
      //   inner join trucks on trucks.id  = rt.truck_id
      //   LEFT JOIN rfid_reader_in rin
      //     ON rin.rfid_reader_in_id = rt.rfid_reader_in_id
      //   LEFT JOIN rfid_reader_out rout
      //     ON rout.rfid_reader_out_id = rt.rfid_reader_out_id
      //   LEFT JOIN cp_detail cp_in
      //     ON cp_in.cp_detail_id = rin.cp_detail_id
      //   LEFT JOIN cp_detail cp_out
      //     ON cp_out.cp_detail_id = rout.cp_detail_id
      //   LEFT JOIN cps cp_master_in
      //     ON cp_master_in.cp_id = cp_in.cp_id
      //   LEFT JOIN cps cp_master_out
      //     ON cp_master_out.cp_id = cp_out.cp_id
      //   WHERE true ${whereClause}
      // `;
      const qJoinAndWhereClause = `
       INNER JOIN trucks ON trucks.id = rt.truck_id 
        LEFT JOIN rfid_reader_in rin 
          ON rin.rfid_reader_in_id = rt.rfid_reader_in_id
        LEFT JOIN rfid_reader_out rout 
          ON rout.rfid_reader_out_id = rt.rfid_reader_out_id
        LEFT JOIN cp_detail cp_in 
          ON cp_in.cp_detail_id = rin.cp_detail_id
        LEFT JOIN cp_detail cp_out 
          ON cp_out.cp_detail_id = rout.cp_detail_id
        LEFT JOIN cps cp_master_in 
          ON cp_master_in.cp_id = cp_in.cp_id
        LEFT JOIN cps cp_master_out 
          ON cp_master_out.cp_id = cp_out.cp_id
        LEFT JOIN cp_detail cp_detail_in 
          ON cp_detail_in.cp_detail_id = rin.cp_detail_id
        LEFT JOIN cp_detail cp_detail_out 
          ON cp_detail_out.cp_detail_id = rout.cp_detail_id           
        left join rfid_anomaly ranomaly ON ranomaly.rfid_transaction_id = rt.rfid_transaction_id
        WHERE true ${whereClause}        
      `;

      let $qLimitation = ``;

      if (!isExport) {
        $qLimitation = `LIMIT ${per_page} OFFSET ${offset}`;
      }

      const qGroupBy = `
        rin.created_at,
        trucks.nomor_lambung,
        rt.event_type
      `;

      const queryData = `
        SELECT 
            ${qSelectData}
          FROM 
              rfid_transaction rt
          ${qJoinAndWhereClause}  
          GROUP BY ${qGroupBy}                 
          order by ${sort} ${order} 
          ${$qLimitation}           
      `;

      // const queryCountData = `
      //   SELECT
      //     count(*) total
      //   FROM
      //     rfid_transaction rt
      //   ${qJoinAndWhereClause}
      // `;

      const queryCountData = `
        SELECT 
          count(*) as total
        FROM (
        SELECT ${qSelectData}
          FROM  rfid_transaction rt
        ${qJoinAndWhereClause}
        GROUP BY ${qGroupBy}
    ) as groupby
      `;

      const data = await this.databaseService.query(queryData);

      const countData = await this.databaseService.query(queryCountData);

      let thresholdValue = 0;
      // check the threshold
      const threshold = await this.rfidThresholdRepository.findOne({
        where: {
          description: 'RFID_THRESHOLD',
        },
      });

      if (threshold) {
        thresholdValue = threshold.max_threshold_in_hours;
      }

      return {
        data: data.map((d) => {
          d.rfid_created_at_in = moment(d.rfid_created_at_in).isValid()
            ? moment(d.rfid_created_at_in)
                .tz('Asia/Singapore')
                .format('YYYY-MM-DD HH:mm:ss')
            : null;
          d.rfid_created_at_out = moment(d.rfid_created_at_out).isValid()
            ? moment(d.rfid_created_at_out)
                .tz('Asia/Singapore')
                .format('YYYY-MM-DD HH:mm:ss')
            : null;
          return d;
        }),
        total: countData[0].total,
        threshold_value: thresholdValue,
        page: page,
      };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_LIST_TRANSACTION} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getThreshold(page: number, size: number) {
    try {
      const dataThreshold = await this.rfidThresholdRepository.findAndCount({
        take: size,
        skip: (page - 1) * size,
      });

      return dataThreshold;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_THRESHOLD_GET} : ${err.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateThreshold(data: updateThresholdDTO) {
    try {
      const dataThreshold = await this.rfidThresholdRepository.findOne({
        where: {
          description: 'RFID_THRESHOLD',
        },
      });

      if (!dataThreshold) {
        // then insert new row
        const threshold = new RfidThreshold();
        threshold.max_threshold_in_hours = data.max_threshold_hours;
        threshold.description = 'RFID_THRESHOLD';
        threshold.min_threshold_in_hours = data.min_threshold_hours;

        await this.rfidThresholdRepository.create(threshold);
        return { message: 'Update successful' };
      }

      dataThreshold.max_threshold_in_hours = data.max_threshold_hours;
      dataThreshold.min_threshold_in_hours = data.min_threshold_hours;

      await this.rfidThresholdRepository.save(dataThreshold); // ✅ Corrected usage

      return { message: 'Update successful' };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_THRESHOLD_UPDATE} : ${err.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async updateAnomaly(id: number, data: rfidAnomalyDTO) {
    try {
      const dataAnomaly = await this.rfidAnomalyRepository.findOne({
        where: {
          id: id,
        },
      });

      if (!dataAnomaly) {
        throw new HttpException('Data not found', HttpStatus.BAD_REQUEST);
      }

      await this.rfidAnomalyRepository.update(id, data); // ✅ Corrected usage

      return { message: 'Update successful' };
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_ANOMALY_UPDATE} : ${err.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createAnomaly(data: rfidAnomalyDTO) {
    try {
      return await this.rfidAnomalyRepository.create(data);
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_ANOMALY_UPDATE} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async cronJobAnomalyValidation() {
    try {
      // check the threshold
      const threshold = await this.rfidThresholdRepository.findOne({
        where: {
          description: 'RFID_THRESHOLD',
        },
      });

      if (threshold) {
        const existingRfidTransactions = await this.rfidTransactionRepository
          .createQueryBuilder('rfid_transaction')
          .where(
            `
              rfid_transaction.rfid_reader_out_id IS NULL and 
              NOW() > rfidReaderIn.created_at + INTERVAL '${threshold.max_threshold_in_hours} hour'                           
            `,
          )
          .andWhere(
            `NOT EXISTS (
              SELECT 1 FROM rfid_anomaly 
              WHERE rfid_anomaly.rfid_transaction_id = rfid_transaction.rfid_transaction_id
            )`,
          )
          .leftJoinAndSelect('rfid_transaction.rfid_reader_in', 'rfidReaderIn')
          .leftJoinAndSelect(
            'rfid_transaction.rfid_reader_out',
            'rfidReaderOut',
          )
          .getMany();

        existingRfidTransactions.forEach(async (existingRfidTransaction) => {
          const anomaly = new RfidAnomaly();
          anomaly.desc = 'RFID_THRESHOLD';
          anomaly.rfid_transaction_id =
            existingRfidTransaction.rfid_transaction_id;
          anomaly.type_anomaly = 'THRESHOLD';
          await this.rfidAnomalyRepository.save(anomaly);
        });
      }
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_CRON_JOB_ANOMALY} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async exportListRfidTransaction(res, request: listRfidTransactionDTO) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet1');

      const data = await this.listRfidTransaction(request, true);

      worksheet.columns = [
        { header: 'No. Lambung', key: 'nomor_lambung' },
        { header: 'CP. RFID Masuk', key: 'cp_name_in' },
        { header: 'CP. RFID Keluar', key: 'cp_name_out' },
        { header: 'RFID IN', key: 'rfid_in' },
        { header: 'RFID OUT', key: 'rfid_out' },
        { header: 'Waktu Masuk', key: 'rfid_created_at_in' },
        { header: 'Waktu Keluar', key: 'rfid_created_at_out' },
        { header: 'Status', key: 'status' },
      ];

      worksheet.addRows(data.data);

      const buffer = await workbook.xlsx.writeBuffer();
      res.header(
        `Content-Disposition', 'attachment; filename=${
          new Date().getFullYear() +
          '-' +
          new Date().getMonth() +
          '-' +
          new Date().getDate()
        }.xlsx`,
      );
      res.type(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.send(buffer);
    } catch (err: any) {}
  }

  async checkTruckOutIn(
    nomor_lambung: string,
    dateTruck: string,
  ): Promise<any> {
    try {
      const query = `
        SELECT trucks.nomor_lambung, rout.created_at as date_truck_out, rin.created_at as date_truck_in
          FROM rfid_transaction rt
          INNER JOIN trucks on trucks.id = rt.truck_id
          LEFT JOIN rfid_reader_in rin ON rin.rfid_reader_in_id = rt.rfid_reader_in_id
          LEFT JOIN rfid_reader_out rout ON rout.rfid_reader_out_id = rt.rfid_reader_out_id
        WHERE trucks.nomor_lambung = '${nomor_lambung}' AND 
          (  
            (
              CASE 
                WHEN rout.rfid_reader_out_id IS NOT NULL AND rout.created_at IS NOT NULL
                then to_date_immutable(rout.created_at::date) = '${dateTruck}'
                ELSE 
                  false
              END
            ) OR
            (
              CASE 
                WHEN rin.rfid_reader_in_id IS NOT NULL AND rin.created_at IS NOT NULL
                then to_date_immutable(rin.created_at::date) = '${dateTruck}'
                ELSE 
                  false
              END
            )
          )

      `;

      // Assuming `this.databaseService.query` executes the raw SQL query
      const data = await this.databaseService.query(query);

      return data;
    } catch (err: any) {
      throw new HttpException(
        `Error Service ${DomainError.RFID_SERVICE_EXPORT_LIST_TRANSACTION} : ${err}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  convertStringToTimeStamps(dateString: string): Date {
    try {
      const [datePart, timePart] = dateString.split(' ');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hours, minutes, seconds] = timePart.split(':').map(Number);
      return new Date(year, month - 1, day, hours, minutes, seconds);
    } catch (error: any) {
      return null;
    }
  }
}
