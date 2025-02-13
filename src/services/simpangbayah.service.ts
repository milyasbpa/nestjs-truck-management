import { DragDropPayLoadDto } from './dto/dragdrop';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { forwardRef, Inject, Injectable, LoggerService } from '@nestjs/common';
import { QueryLoaderService } from '@utils/query-loader.service';
import { DatabaseService } from '@utils/database.service';
import {
  decryptJSAES,
  encryptJSAES,
  mapTruckType,
  stringToBoolean,
} from '@utils/functions.service';
import { SaveRerouteCPQueueDTO } from './dto/create_cp_assignment.dto';
import { Any, Repository } from 'typeorm';
import { CpQueueAssignment } from 'src/jobs/entities/cpqueueassignments.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { QueueStatusEnum, WebSocketAntrianCp } from '@utils/enums';
import { LaneService } from 'src/lane/lane.service';
import { log } from 'console';
@Injectable()
export class SimpangBayahService {
  private queryLoaderService = new QueryLoaderService('queries.sql');
  private isLockedCPQueue: boolean;

  constructor(
    @InjectRepository(CpQueueAssignment)
    private readonly cpaRepo: Repository<CpQueueAssignment>,
    private readonly databaseService: DatabaseService,
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => LaneService))
    private readonly laneService: LaneService,
  ) {}
  async getLocation(): Promise<any> {
    try {
      const query = this.queryLoaderService.getQueryById('query_simpang_bayah');
      const results = await this.databaseService.query(query);
      const lists = results.map((row) => ({
        ...row,
        truck_id: encryptJSAES(row.truck_id.toString()),
      }));
      return { statusCode: 200, data: lists };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'Data failed to query.');
    }
  }
  async getSummaryCPQueue(search: string, status: string): Promise<any> {
    try {
      const bstatus = stringToBoolean(status);
      let results = null;
      let query = this.queryLoaderService.getQueryById('summary_cp_queue');
      if (search) {
        query = query.replaceAll(
          `::search`,
          ` AND cqa.nomor_lambung ilike $2 `,
        );
      } else {
        query = query.replaceAll(`::search`, ` `);
      }
      const ids = [];
      if (bstatus === null) {
        ids.push(false);
        ids.push(true);
      } else {
        ids.push(bstatus);
      }
      this.errorHandler.logDebug(`querydebugger :${query}`);
      if (!search) {
        results = await this.databaseService.query(query, [ids]);
      } else {
        results = await this.databaseService.query(query, [
          ids,
          '%' + search + '%',
        ]);
      }
      this.errorHandler.logDebug(`query :${query}`);
      if (!results[0]?.result.lane_info) {
        return { statusCode: 200, data: null };
      }
      const lanes = results[0].result.lane_info;
      const sumofqueue = results[0].result.sum_queue_in_cp;
      // const last_updated = results[0].result.last_updated;

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
      const last_updated = lanes.sort(
        (a: { audit_update: string }, b: { audit_update: string }) => {
          return (
            new Date(b.audit_update).getTime() -
            new Date(a.audit_update).getTime()
          );
        },
      );

      const lists = {
        last_updated: last_updated[0].audit_update,
        sum_queue_in_cp: sumofqueue,
        lane_info: listsoflane,
      };
      return { statusCode: 200, data: lists };
    } catch (error) {
      return error.message;
      this.errorHandler.throwBadRequestError(error, 'Data failed to query.');
    }
  }
  async saveCpAqueueAssignment(
    data: SaveRerouteCPQueueDTO,
    metadata: Record<string, any>,
  ): Promise<any> {
    if (this.isLockedCPQueue) {
      return { message: 'Try again in few minutes!', errorCode: 400 };
    }
    this.isLockedCPQueue = true;
    let assignment_id: number;
    if (data.assignment_id.trim() === '' || data.assignment_id === 'null') {
      assignment_id = -1;
    } else {
      assignment_id = Number(decryptJSAES(data.assignment_id));
    }
    const lane_id_from = Number(decryptJSAES(data.lane_id_from));
    const lane_id_to = Number(decryptJSAES(data.lane_id_to));
    const lane_id = lane_id_to;
    try {
      if (lane_id_from != lane_id_to) {
        const truck_id = Number(decryptJSAES(data.truck_id));
        const user_id = Number(decryptJSAES(data.user_id));
        const isElligable = await this.isElligableInQueue(lane_id, truck_id);
        if (isElligable) {
          const query = this.queryLoaderService.getQueryById(
            'update_cp_aqueue_from_simpang_bayah',
          );
          await this.databaseService.query(query, [
            lane_id,
            truck_id,
            user_id,
            assignment_id,
          ]);
          await this.laneService.sendDataToWebSocket(
            lane_id_from,
            lane_id_to,
            WebSocketAntrianCp.LANETOLANE,
            null,
            'MANUAL'
          );
          const row = await this.getInfoCpQueueAssignment(assignment_id);
          this.isLockedCPQueue = false;
          return {
            message: row != null ? 'success' : 'failed',
            data: row,
            statusCode: 200,
          };
        } else {
          this.isLockedCPQueue = false;
          return { message: 'failed', data: null, statusCode: 400 };
        }
      } else {
        this.isLockedCPQueue = false;
        return { message: 'failed', data: data, statusCode: 400 };
      }
    } catch (error) {
      this.isLockedCPQueue = false;
      this.errorHandler.saveLogToDB(
        'crud-save-cp-queue',
        'save',
        'error',
        error,
        metadata != null ? JSON.stringify(metadata) : null,
      );
      this.errorHandler.throwBadRequestError(error, 'CP-Queue failed to save.');
    } finally {
      this.isLockedCPQueue = false;
    }
  }

  private async isElligableInQueue(
    lane_id: number,
    truck_id: number,
  ): Promise<boolean> {
    let role_max_capacity: number = 0;
    let current_load: number = 0;
    //Check By Truck Type If Exist in Rules in Queue_lane_rules
    const truck_type = await this.getTruckType(truck_id);
    let qRole1 =
      'SELECT max_capacity FROM queue_lane_rules WHERE  queue_lane_id=$1 AND truck_type=$2 LIMIT 1';
    const RowRole1 = await this.databaseService.queryOne(qRole1, [
      lane_id,
      truck_type,
    ]);
    if (!RowRole1) {
      //Only by lane_id for selection
      qRole1 = `SELECT max_capacity FROM queue_lane WHERE id=$1`;
      const RowRole1 = await this.databaseService.queryOne(qRole1, [lane_id]);
      role_max_capacity = RowRole1.max_capacity;
      const query = ` SELECT count(1) current_load FROM cp_queue_assignments cqa  WHERE exit_time is null AND status!='COMPLETED' AND cqa.lane_id=$1`;
      const Row = await this.databaseService.queryOne(query, [lane_id]);
      if (!Row) {
        return true;
      } else {
        current_load = Row.current_load;
      }
    } else {
      role_max_capacity = RowRole1.max_capacity;
      const query = `SELECT count(1) current_load FROM cp_queue_assignments cqa  WHERE exit_time is null AND status!='COMPLETED' AND cqa.lane_id=$1 AND truck_type=$2`;
      const Row = await this.databaseService.queryOne(query, [
        lane_id,
        truck_type,
      ]);
      if (!Row) {
        return true;
      } else {
        current_load = Row.current_load;
      }
    }
    return Number(current_load) <= Number(role_max_capacity);
  }

  async isElligableInCP(cp_id: number, truck_id: number): Promise<any> {
    //Check Apakah ada Rolesnya untuk cp if ada max pakai
    const truck_type = await this.getTruckType(truck_id);
    let query = this.queryLoaderService.getQueryById(
      'query_max_capacity_in_rule_of_cp',
    );
    let info = null;
    let Row = await this.databaseService.queryOne(query, [cp_id]);
    let RowCP: any;
    if (Row != null) {
      //Check cp_id & Rolesnya
      query = this.queryLoaderService.getQueryById(
        'query_max_capacity_truck_type_in_rule_of_cp',
      );
      Row = await this.databaseService.queryOne(query, [cp_id, truck_type]);
      if (Row == null) {
        query = this.queryLoaderService.getQueryById(
          'query_max_capacity_in_cps',
        );
        Row = await this.databaseService.queryOne(query, [cp_id, truck_id]);
        RowCP = await this.databaseService.queryOne(query, [cp_id]);
        info = `CP - ID :{cp_id}, max_capacity : ${Row.max_capacity} validated without type: ${truck_type}, Current load: ${RowCP.current_load}`;
      } else {
        query = this.queryLoaderService.getQueryById(
          'query_in_cp_queue_assignment_current_load_by_cp_id',
        );
        RowCP = await this.databaseService.queryOne(query, [cp_id, truck_type]);
        info = `CP - ID :{cp_id}, max_capacity : ${Row.max_capacity} of Type: ${truck_type}, Current load: ${RowCP.current_load}`;
      }
    } else {
      //else //diambil dari max_count in cps
      query = this.queryLoaderService.getQueryById('query_max_capacity_in_cps');
      Row = await this.databaseService.queryOne(query, [cp_id]);

      const qc = this.queryLoaderService.getQueryById(
        'query_in_cp_queue_assignment_current_load',
      );
      RowCP = await this.databaseService.queryOne(qc, [cp_id]);
      info = `CP - ID :{cp_id}, max_capacity : ${Row.max_capacity} validated without type: ${truck_type}, Current load: ${RowCP.current_load}`;
    }
    const result = {
      isElligable: Number(RowCP.current_load) <= Number(Row.max_capacity),
      message: info,
    };
    return result;
  }

  async isAssignmentIdExist(id: number): Promise<string> {
    const query = this.queryLoaderService.getQueryById(
      'is_assignment_id_exist',
    );
    const Row = await this.databaseService.queryOne(query, [id]);
    if (Number(Row.z_count) === 0) {
      return 'add';
    } else {
      return 'edit';
    }
  }
  async getInfoCpQueueAssignment(id: number): Promise<any> {
    const query = this.queryLoaderService.getQueryById(
      'find_cp_assignment_by_id_reroute_manual',
    );
    const rec = await this.databaseService.queryOne(query, [id]);
    rec.assignment_id = encryptJSAES(rec.assignment_id.toString());
    rec.lane_id = encryptJSAES(rec.lane_id.toString());
    rec.truck_id = encryptJSAES(rec.truck_id.toString());
    return rec;
  }

  async saveCpAqueueAssignmentV2(dragDrop: DragDropPayLoadDto): Promise<any> {
    //if lane to lane
    let assignment_id: any;
    let id_to, id_from, truck_id, user_id;
    try {
      if (dragDrop.key_encrypted === false) {
        id_to = Number(dragDrop.cplane_id_to);
        id_from = Number(dragDrop.cplane_id_from);
        truck_id = Number(dragDrop.truck_id);
        user_id = Number(dragDrop.user_id);
        if (dragDrop.assignment_id) {
          assignment_id = Number(dragDrop.assignment_id);
        }
      } else {
        id_to = Number(decryptJSAES(dragDrop.cplane_id_to));
        id_from = Number(decryptJSAES(dragDrop.cplane_id_from));
        truck_id = Number(decryptJSAES(dragDrop.truck_id));
        user_id = Number(decryptJSAES(dragDrop.user_id));
        if (dragDrop.assignment_id) {
          assignment_id = Number(dragDrop.assignment_id);
        }
      }
      const currentPayLoad = {
        cplane_id_to: id_to,
        cplane_id_from: id_from,
        type_from: dragDrop.type_from,
        type_to: dragDrop.type_to,
        user_id: user_id,
        truck_id: truck_id,
        assignment_id: assignment_id,
      };
      if (dragDrop.type_from === 'lane' && dragDrop.type_to === 'lane') {
        await this.laneToLane(currentPayLoad);
      } else if (dragDrop.type_from === 'lane' && dragDrop.type_to === 'cp') {
        await this.laneToCP(dragDrop);
      } else if (dragDrop.type_from === 'cp' && dragDrop.type_to === 'lane') {
        await this.CpToLane(dragDrop);
      } else if (dragDrop.type_from === 'cp' && dragDrop.type_to === 'cp') {
        await this.CpToCP(dragDrop);
      } else if (
        dragDrop.type_from === 'outside' &&
        dragDrop.type_to === 'cp'
      ) {
        await this.OutsideToCP(dragDrop);
      } else if (
        dragDrop.type_from === 'outside' &&
        dragDrop.type_to === 'lane'
      ) {
        await this.OutsideToLane(dragDrop);
      }
      const dataList = await this.LoadAssignment(currentPayLoad);
      return {
        showCode: 200,
        data: dataList,
        message: 'process was done successfully.',
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(error, 'failed to process!');
    }
  }
  async laneToLane(data: any) {
    if (this.isLockedCPQueue) {
      return { message: 'Try again in few minutes!', errorCode: 400 };
    }
    const assignment_id = data.assignment_id;
    const lane_id_from = Number(data.cplane_id_from);
    const lane_id_to = Number(data.cplane_id_to);
    const lane_id = lane_id_to;
    if (lane_id_from != lane_id_to) {
      const truck_id = Number(data.truck_id);
      const user_id = data.user_id;
      const isElligable = await this.isElligableInQueue(lane_id, truck_id);
      if (isElligable) {
        const query = this.queryLoaderService.getQueryById(
          'update_cp_aqueue_from_simpang_bayah',
        );
        await this.databaseService.query(query, [
          lane_id,
          truck_id,
          user_id,
          assignment_id,
        ]);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  async laneToCP(data: any) {
    const from_id = Number(data.cplane_id_from);
    const to_id = Number(data.cplane_id_to);
    const assignment_id = data.assignment_id;
    if (from_id != to_id) {
      const truck_id = Number(data.truck_id);
      const user_id = data.user_id;
      const isElligable = await this.isElligableInCP(to_id, truck_id);
      if (isElligable) {
        const query = this.queryLoaderService.getQueryById(
          'update_cp_assignment_queue_from_lane_to_cp',
        );
        await this.databaseService.query(query, [
          to_id,
          truck_id,
          user_id,
          assignment_id,
        ]);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  async CpToLane(data: any) {
    const from_id = data.cplane_id_from;
    const to_id = data.cplane_id_to;
    const lane_id = to_id;
    if (from_id != to_id) {
      const truck_id = Number(data.truck_id);
      const user_id = data.user_id;
      const isElligable = await this.isElligableInQueue(lane_id, truck_id);
      if (isElligable) {
        const query = this.queryLoaderService.getQueryById(
          'update_cp_assignment_queue_from_cp_to_lane',
        );
        await this.databaseService.query(query, [
          lane_id,
          truck_id,
          user_id,
          data.assignment_id,
        ]);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  async CpToCP(data: any): Promise<boolean> {
    const from_id = data.cplane_id_from;
    const to_id = data.cplane_id_to;
    if (from_id != to_id) {
      const truck_id = Number(data.truck_id);
      const user_id = data.user_id;
      const isElligable = await this.isElligableInCP(to_id, truck_id);
      if (isElligable) {
        const query = this.queryLoaderService.getQueryById(
          'update_cp_assignment_queue_from_lane_to_cp',
        );
        await this.databaseService.query(query, [
          to_id,
          truck_id,
          user_id,
          data.assignment_id,
        ]);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }
  async OutsideToCP(data: any): Promise<boolean> {
    const to_id = data.cplane_id_to;
    const truck_id = data.truck_id;
    const isElligableInCP = await this.isElligableInCP(to_id, truck_id);
    if (isElligableInCP) {
      await this.InsertCpQueueAssignmentsOutsideToCP(data);
      return true;
    } else {
      return false;
    }
  }
  async OutsideToLane(data: any): Promise<boolean> {
    const to_id = data.cplane_id_to;
    const truck_id = data.truck_id;
    const isElligable = await this.isElligableInQueue(to_id, truck_id);
    if (isElligable) {
      await this.InsertCpQueueAssignmentsOutsideToLane(data);
      return true;
    } else {
      return false;
    }
  }
  async CPORLaneTOutSide(data: any) {
    const id = Number(data.assignment_id);
    const query = this.queryLoaderService.getQueryById(
      'query_exit_by_assigment_id',
    );
    await this.databaseService.query(query, [id]);
  }
  async getTruckType(truck_id: number): Promise<string> {
    const query = this.queryLoaderService.getQueryById('query_truck_type');
    const Rs = await this.databaseService.queryOne(query, [truck_id]);
    if (Rs) {
      return Rs.typeoftruck;
    } else {
      return '';
    }
  }
  async InsertCpQueueAssignmentsOutsideToCP(data: any) {
    const cp_id = data.cplane_id_to;
    const truck_id = data.truck_id;
    const user_id = data.user_id;
    const isExist = await this.isTruckIdStillExistInCp(truck_id);
    if (isExist) {
      return {
        showCode: 200,
        message: 'failed, truck is still in assignment!',
      };
    }
    const query = this.queryLoaderService.getQueryById(
      'insert_cp_queue_assignments',
    );
    await this.databaseService.query(query, [cp_id, null, truck_id, user_id]);
  }
  async InsertCpQueueAssignmentsOutsideToLane(data: DragDropPayLoadDto) {
    let lane_id: number;
    let truck_id: number;
    let user_id: number;
    lane_id = Number(data.cplane_id_to);
    truck_id = Number(data.truck_id);
    user_id = Number(data.user_id);
    const isExist = await this.isTruckIdStillExistInCp(truck_id);
    if (isExist) {
      return false;
    }
    const query = this.queryLoaderService.getQueryById(
      'insert_cp_queue_assignments',
    );
    await this.databaseService.query(query, [null, lane_id, truck_id, user_id]);
    return true;
  }

  async isTruckIdStillExistInCp(truck_id: number): Promise<boolean> {
    const query = this.queryLoaderService.getQueryById(
      'query_check_truck_id_still_in_cp_queue_assignments',
    );
    const Rs = await this.databaseService.queryOne(query, [truck_id]);
    return Rs.isexist;
  }
  async removeFromCPOrLane(data: any) {
    const id = Number(data.assignment_id);
    const user_id = Number(data.user_id);
    const Rs = await this.cpaRepo.findOne({ where: { assignment_id: id } });
    if (Rs) {
      if (Rs.cp_queue_id != null) {
        Rs.exit_cp_time = new Date();
        Rs.status = QueueStatusEnum.COMPLETED;
        Rs.auditupdate = new Date();
        Rs.updated_by = user_id;
      } else {
        Rs.exit_cp_time = new Date();
        Rs.exit_time = new Date();
        Rs.status = QueueStatusEnum.COMPLETED;
        Rs.auditupdate = new Date();
        Rs.updated_by = user_id;
      }
      await this.cpaRepo.save(Rs);
    }
  }
  async LoadAssignment(data: any): Promise<any> {
    const idSelectedCP: number[] = [];
    const idSelectedLane: number[] = [];
    const toDisplay: string[] = [];
    let Data: any;
    if (
      data.type_from.trim().toLowerCase() === 'cp' &&
      data.type_to.trim().toLowerCase() === 'cp'
    ) {
      toDisplay.push('cp');
      idSelectedCP.push(data.cplane_id_from);
      idSelectedCP.push(data.cplane_id_to);
    } else if (
      data.type_from.trim().toLowerCase() === 'cp' &&
      data.type_to.trim().toLowerCase() === 'lane'
    ) {
      idSelectedCP.push(data.cplane_id_from);
      toDisplay.push('cp');
      idSelectedLane.push(data.cplane_id_to);
      toDisplay.push('lane');
    } else if (
      data.type_from.trim().toLowerCase() === 'lane' &&
      data.type_to.trim().toLowerCase() === 'cp'
    ) {
      toDisplay.push('cp');
      toDisplay.push('lane');
      idSelectedLane.push(data.cplane_id_from);
      idSelectedCP.push(data.cplane_id_to);
    } else if (
      data.type_from.trim().toLowerCase() === 'lane' &&
      data.type_to.trim().toLowerCase() === 'lane'
    ) {
      toDisplay.push('lane');
      idSelectedLane.push(data.cplane_id_to);
      idSelectedLane.push(data.cplane_id_from);
    } else if (
      data.type_from.trim().toLowerCase() === 'outside' &&
      data.type_to.trim().toLowerCase() === 'lane'
    ) {
      idSelectedLane.push(data.cplane_id_to);
      toDisplay.push('lane');
    } else if (
      data.type_from.trim().toLowerCase() === 'outside' &&
      data.type_to.trim().toLowerCase() === 'cp'
    ) {
      idSelectedCP.push(data.cplane_id_to);
      toDisplay.push('cp');
    } else {
      return 'Invalid type_from to type_to source of CP/Lanes';
    }
    let cp_info: any;
    let lane_info: any;
    if (toDisplay.includes('cp')) {
      cp_info = await this.loadCPByChange(idSelectedCP);
    } else {
      cp_info: `{'ignore to reload data!.'}`;
    }

    if (toDisplay.includes('lane')) {
      lane_info = await this.loadLaneByChange(idSelectedLane);
    } else {
      lane_info = `{ignore to reload data!.}`;
    }
    const result = {
      cp_info: cp_info,
      lane_info: lane_info,
    };
    return result;
  }
  //Revision
  async loadCPByChange(id: number[]): Promise<any> {
    let Data = Any;
    const start_time = performance.now();
    try {
      if (id.length === 0) {
        return null;
      }
      const [
        RsLastDate,
        RsTotalTruckInCp,
        RsCps,
        RsTruckInfo,
        RsSumofTruckInCP,
        RsTruckType,
        RsRuleOfCP,
      ] = await Promise.all([
        this.getLastDateChanges(),
        this.getTotalTruckInCp(id),
        this.getCpInfoMaster(id),
        this.getTruckInfoInCp(id),
        this.getSumTruckInCP(id),
        this.getListofTruckTypeInCP(id),
        this.getListofruleofCP(id),
      ]);
      const RsCpInfo = await Promise.all(
        RsCps.map(async (row) => {
          const RsTruckInfoResult = RsTruckInfo.filter(
            (row2) => row.cp_id === row2.cp_queue_id,
          ).map((row2, idx) => {
            const truckInfo = row2.info_truck_in_cp;
            return truckInfo;
          });
          const RsSumofTruckInCpResult = RsSumofTruckInCP.filter(
            (row2) => row.cp_id === row2.cp_queue_id,
          ).map((row2) => {
            const truckInfo = row2.sumoftruck;
            return row2.sumoftruck;
          });
          const RsTruckTypeResult = RsTruckType.filter(
            (row2) => row.cp_id === row2.cp_queue_id,
          ).map((row2) => {
            return row2.truck_type;
          });

          const RsRuleOfCPResult = RsRuleOfCP.filter(
            (row2) => row.cp_id === row2.cp_id,
          ).map((row2) => {
            return row2.ruleofcp;
          });
          return {
            ...row,
            rule_cps: RsRuleOfCPResult.length !== 0 ? RsRuleOfCPResult[0] : [],
            truck_info:
              RsTruckInfoResult.length !== 0 ? RsTruckInfoResult[0] : [],
            sum_truck_in_cp:
              (RsSumofTruckInCpResult.length !== 0
                ? RsSumofTruckInCpResult[0]
                : '0') +
              '/' +
              row.max_capacity,
            listoftrucktype:
              RsTruckTypeResult.length !== 0 ? RsTruckTypeResult[0] : [],
          };
        }),
      );
      let sumOftruck = 0;
      const cps = RsCpInfo;
      const listsoflane = await Promise.all(
        cps.map(async (row) => {
          const truckCount = row.truck_info.length;
          const maxCapacity = row.max_capacity;
          const truck_info = await Promise.all(
            row.truck_info.map(async (truck) => {
              const data = await this.laneService.getRfidStatus(truck.truck_id);
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
                status_rfid:
                  data && data[0] && data[0].event_type
                    ? data[0].event_type
                    : null,
                latest_cp:
                  data && data[0] && data[0].cp_name ? data[0].cp_name : null,
              };
            }),
          );
          const capacityPercentage =
            (truck_info.filter((item) => item.status_rfid != 'Completed')
              .length /
              maxCapacity) *
            100;
          const truckInfoAfterFilter = truck_info.filter(
            (truck) => truck.status_rfid !== 'Completed',
          );
          sumOftruck += truckInfoAfterFilter.length;
          return {
            ...row,
            cp_id: encryptJSAES(row.cp_id.toString()),
            truck_info: truckInfoAfterFilter,
            load_percentage: capacityPercentage,
            sum_truck_in_cp:
              truck_info.filter((item) => item.status_rfid != 'Completed')
                .length +
              '/' +
              maxCapacity,
            available_truck:
              row.status === false && truckCount > 0 ? true : false,
          };
        }),
      );
      const end_time = performance.now();
      const Data = {
        last_updated: RsLastDate?.auditupdate,
        total_trucks_in_cp: sumOftruck,
        cp_info: listsoflane,
        duration_in: end_time - start_time + ' ms',
      };
      return Data;
    } catch (error) {
      this.errorHandler.logError('loadCPByChange', error);
    }
  }
  async loadCPByChange_ver1(id: number[]): Promise<any> {
    let Data: any;
    const start_time = performance.now();
    const query = this.queryLoaderService.getQueryById(
      'summary_cp_dashboard_by_cp_id_changes',
    );

    try {
      if (id.length <= 0) {
        return [];
      }
      const Rs = await this.databaseService.query(query, [id]);
      if (Rs) {
        const cp = Rs[0]?.result?.cp_info;
        const cp_info = Rs[0].result.cp_info;
        const cps = cp_info;
        const sumofqueue = Rs[0].result.total_trucks_in_cp;
        const last_updated = Rs[0].result.last_updated;
        let sumOftruck = 0;
        const listsoflane = await Promise.all(
          cps.map(async (row) => {
            const truckCount = row.truck_info.length;
            const maxCapacity = row.max_capacity;
            // const truck_info = await Promise.all(
            //   row.truck_info.map(async (truck) => {
            //     const data = await this.laneService.getRfidStatus(truck.truck_id);
            //     return {
            //       ...truck,
            //       assignment_id:
            //         truck.assignment_id != null
            //           ? encryptJSAES(truck.assignment_id.toString())
            //           : null,
            //       truck_id:
            //         truck.truck_id != null
            //           ? encryptJSAES(truck.truck_id.toString())
            //           : truck.truck_id,
            //       status_rfid: data != null ? data[0].event_type : null,
            //       latest_cp: data != null ? data[0].cp_name : null,
            //     };
            //   }),
            // );
            const truck_info = await Promise.all(
              row.truck_info.map(async (truck) => {
                const data = await this.laneService.getRfidStatus(
                  truck.truck_id,
                );
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
                  status_rfid:
                    data && data[0] && data[0].event_type
                      ? data[0].event_type
                      : null,
                  latest_cp:
                    data && data[0] && data[0].cp_name ? data[0].cp_name : null,
                };
              }),
            );
            const capacityPercentage =
              (truck_info.filter((item) => item.status_rfid != 'Completed')
                .length /
                maxCapacity) *
              100;
            const truckInfoAfterFilter = truck_info.filter(
              (truck) => truck.status_rfid !== 'Completed',
            );
            sumOftruck += truckInfoAfterFilter.length;
            return {
              ...row,
              cp_id: encryptJSAES(row.cp_id.toString()),
              truck_info: truckInfoAfterFilter,
              load_percentage: capacityPercentage,
              sum_truck_in_cp:
                truck_info.filter((item) => item.status_rfid != 'Completed')
                  .length +
                '/' +
                maxCapacity,
              available_truck:
                row.status === false && truckCount > 0 ? true : false,
            };
          }),
        );
        const end_time = performance.now();
        Data = {
          last_updated: last_updated,
          total_trucks_in_cp: sumOftruck,
          cp_info: listsoflane,
          duration_in: end_time - start_time + ' ms',
        };
      } else {
        Data = [];
      }
    } catch (error) {
      const vJson = JSON.stringify(id);
      this.errorHandler.logError(
        `Websocket - loadCPByChange:error query: ${query} - cp_id: ${vJson}`,
        error,
      );
    }
    return Data;
  }

  async loadLaneByChange(id: number[]): Promise<any> {
    const start_time = performance.now();
    let Data: any;
    const query = this.queryLoaderService.getQueryById(
      'query_summary_lane_changes_by_id',
    );
    try {
      if (id.length <= 0) {
        return [];
      }
      const Rs = await this.databaseService.query(query, [id]);
      if (Rs) {
        const lanes = Rs[0].result.lane_info;
        const sumofqueue = Rs[0].result.sum_queue_in_cp;
        const last_updated = Rs[0].result.last_updated;
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
        const end_time = performance.now();
        const Data = {
          last_updated: last_updated,
          sum_queue_in_cp: sumofqueue,
          lane_info: listsoflane,
          duration_in: end_time - start_time + ' ms',
        };
        return Data;
        /*const lane_info = Rs[0].result.lane_info.map((row) => ({
            ...row,
            id: encryptJSAES(row?.id?.toString()),
            truck_info: row.truck_info.map((row2) => ({
              ...row2,
              truck_id: encryptJSAES(row2?.truck_id?.toString()),
              assignment_id: encryptJSAES(row2.assignment_id.toString()),
            })),
          }));
          Data = {
            last_updated: Rs[0].result.last_updated,
            sum_queue_in_cp: Rs[0].result.sum_queue_in_cp,
            lane_info: lane_info,
          };*/
      } else {
        Data = [];
      }
    } catch (error) {
      const vJson = JSON.stringify(id);
      this.errorHandler.logError(
        `Websocket - loadLaneByChange:error query: ${query} - cp_id: ${vJson}`,
        error,
      );
    }
    return Data;
  }
  async getcpQueueAssignmentChangesByLane(): Promise<number[]> {
    const query = `
     SELECT id lane_id FROM logs.detect_lane_changes
    `;

    const list = await this.databaseService.query(query);

    return list.map((row) => row.lane_id);
  }

  async getcpQueueAssignmentChangesByCP(): Promise<number[]> {
    const query = `
      SELECT id cp_queue_id
      FROM logs.detect_cps_changes dcc 
    `;
    const list = await this.databaseService.query(query);
    return list.map((row) => row.cp_queue_id);
  }
  async getCpQueueAssignmentChanges(): Promise<any> {
    this.errorHandler.logDebug('getCpQueueAssignmentChanges');
    try {
      // Menjalankan kedua fungsi secara paralel dengan Promise.all
      const [QueueLane, cpQueueIds, masterLanes] = await Promise.all([
        this.getcpQueueAssignmentChangesByLane(),
        this.getcpQueueAssignmentChangesByCP(),
        this.getLoadLanesChangesSimpangBayah(),
      ]);
      const [cp_info, lane_info, listMLanes, completed_info] =
        await Promise.all([
          this.loadCPByChange(cpQueueIds),
          this.loadLaneByChange(QueueLane),
          this.getMasterLanes(masterLanes),
          this.getLastCompleted(),
        ]);

      if (
        cp_info !== null ||
        lane_info !== null ||
        masterLanes.length > 0 ||
        completed_info.length > 0
      ) {
        const result = {
          message: 'process was done successfully.',
          cp_info: cp_info,
          lane_info: lane_info,
          sb_lane_info: listMLanes,
          completed_assigment_id_info: completed_info,
        };
        await this.DeleteLogsCpqAssigmentAfterSentToClient();
        return result;
      } else {
        return null;
      }
    } catch (err) {
      this.errorHandler.logError('getCpQueueAssignmentChanges', err);
    }
  }

  async DeleteLogsCpqAssigmentAfterSentToClient(): Promise<any> {
    await Promise.all([
      this.DeleteLogsCqaAssignmentChanges(),
      this.DeleteLogsLanesChanges(),
      this.deleteLastCompleted(),
      this.deleteLogsChangesSimpangBayahLane(),
      this.DeleteLogsDetectCpChanges(),
    ]);
  }
  async DeleteLogsCqaAssignmentChanges(): Promise<any> {
    const query = `DELETE FROM logs.cp_queuement_changes`;
    await this.databaseService.query(query);
    return true;
  }
  async DeleteLogsDetectCpChanges(): Promise<any> {
    const query = `DELETE FROM logs.detect_cps_changes`;
    await this.databaseService.query(query);
    return true;
  }
  async DeleteLogsLanesChanges(): Promise<any> {
    const query = `DELETE FROM logs.detect_lane_changes`;
    await this.databaseService.query(query);
    return true;
  }
  async DeleteLogsLanesChangesSimpangBayah(): Promise<any> {
    const query = `DELETE FROM logs.detect_lane_simpang_bayah`;
    await this.databaseService.query(query);
    return true;
  }
  async getLoadLanesChanges() {
    const query = `select id FROM logs.detect_lane_changes`;
    try {
      const Rs = await this.databaseService.query(query);
      return Rs;
    } catch (error) {
      this.errorHandler.logError(
        'Websocket - getLoadLanesChanges:error query: ${query}',
        error,
      );
    }
    return null;
  }

  async getLoadLanesChangesSimpangBayah() {
    const query = this.queryLoaderService.getQueryById(
      'video_tron_notif_simpang_bayah',
    );
    try {
      const Rs = await this.databaseService.query(query);
      return Rs;
    } catch (error) {
      this.errorHandler.logError(
        'Websocket - getLoadLanesChangesSimpangBayah:error query: ${query}',
        error,
      );
    }
    return null;
  }

  async getLastCompleted(): Promise<any> {
    const query = 'select assignment_id  from logs.cpqa_last_completed ';
    const Rs = await this.databaseService.query(query);
    const listRs = Rs.map((row) => ({
      ...row,
      assignment_id: encryptJSAES(row.assignment_id.toString()),
    }));
    return listRs;
  }
  async getMasterLanes(masterLanes: any): Promise<any> {
    try {
      if (masterLanes) {
        const listMLanes = masterLanes.map((row) => ({
          ...row,
          lane_id_sb: encryptJSAES(row.lane_id_sb.toString()),
        }));
        return listMLanes;
      } else {
        return null;
      }
    } catch (error) {
      this.errorHandler.throwBadRequestError(error,'Get Master Lanes error');
    }
  }
  async deleteLastCompleted(): Promise<any> {
    const query = 'DELETE FROM logs.cpqa_last_completed';
    await this.databaseService.query(query);
    return true;
  }
  async deleteLogsChangesSimpangBayahLane(): Promise<any> {
    const query = 'DELETE FROM logs.detect_lane_simpang_bayah';
    await this.databaseService.query(query);
    return true;
  }

  //Parsing Query From Changes
  async getLastDateChanges(): Promise<any> {
    const query = this.queryLoaderService.getQueryById(
      'summary_last_date_changes',
    );
    return await this.databaseService.queryOne(query, ['job-monitor-cp']);
  }
  async getTotalTruckInCp(id: number[]): Promise<any> {
    const query = this.queryLoaderService.getQueryById(
      'total_trucks_in_cp_changes',
    );
    return await this.databaseService.query(query, [id]);
  }
  async getCpInfoMaster(id: number[]): Promise<any> {
    const query = this.queryLoaderService.getQueryById('cp_info_master');
    return await this.databaseService.query(query, [id]);
  }
  async getTruckInfoInCp(id: number[]): Promise<any> {
    const query = this.queryLoaderService.getQueryById('truck_info_in_cp');
    const Rs = await this.databaseService.query(query, [id]);
    return Rs;
  }
  async getSumTruckInCP(id: number[]): Promise<any> {
    const query = this.queryLoaderService.getQueryById('sum_truck_in_cp');
    return await this.databaseService.query(query, [id]);
  }
  async getListofTruckTypeInCP(id: number[]): Promise<any> {
    const query = this.queryLoaderService.getQueryById('listoftrucktypeInCP');
    return await this.databaseService.query(query, [id]);
  }
  async getListofruleofCP(id: number[]): Promise<any> {
    const query = this.queryLoaderService.getQueryById('ruleofcps_changes');
    return await this.databaseService.query(query, [id]);
  }
  async isExistChanges() {
    const q = this.queryLoaderService.getQueryById('is_exist_changes');
    const Rs = await this.databaseService.queryOne(q);
    return Rs.isexist;
  }
}
