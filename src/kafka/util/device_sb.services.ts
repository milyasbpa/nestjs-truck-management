import { QueryLoaderService } from '@utils/query-loader.service';
import { TruckMonitoringService } from './../../jobs/trucksmonitor.service';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@utils/database.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { DeviceSBData } from '../dto/device_sb.payload';
import { VidiotronNotifService } from 'src/vidiotron-notif/vidiotron-notif.service';
import { DeviceCPData } from '../dto/device_cp.payload';
import { parseCP, removeAllSpaces } from '@utils/functions.service';
import { connect } from 'http2';
import { LaneService } from 'src/lane/lane.service';
import {
  entranceTypeEnum,
  exitTypeEnum,
  QueueStatusEnum,
  WebSocketAntrianCp,
} from '@utils/enums';
import { CpQLogService } from 'src/cp-queue-assignments-log/cpQueueAssignmentsLog.service';
import { AssignmentLogCreate } from 'src/cp-queue-assignments-log/dto/cp-queue-assignments-log';
import { SocketClientService } from 'src/websocket/websocket-client.service';

@Injectable()
export class DeviceSBService {
  private readonly logger = new Logger(DeviceSBService.name);
  private queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ErrorHandlerService))
    private readonly errHandler: ErrorHandlerService,
    @Inject(forwardRef(() => TruckMonitoringService))
    private readonly truckMonitorService: TruckMonitoringService,
    private vidioTronNotifService: VidiotronNotifService,
    @Inject(forwardRef(() => LaneService))
    private laneService: LaneService,
    private CpQLogService: CpQLogService,
    private readonly socketClientService: SocketClientService,
  ) {}

  async ProcessAssignment(data: DeviceSBData[]) {
    const client = await this.databaseService.beginTransaction();
    try {
      // Step 1: Save trucks first
      for (const item of data) {
        const truck = {
          id: item.id,
          name: item.name,
          tipe_truck: item.tipe_truck,
        };

        // logic untuk trigger ke vidiotron gini nanti om gon, di komen aja dulu kalau sudah dapat lane_id antrian nya
        // let idSimpangBayah = 1;

        // if (item.geofence === 'Antrian SB Lane 1') {
        //   // idealnya cek dari id lanes simpang bayah by name
        //   const [lanesSimpangBayah] = await this.databaseService.query(
        //     'SELECT id FROM lanes WHERE lane_code = "LANE 1"',
        //   );
        //   idSimpangBayah = lanesSimpangBayah.id;
        // } else if (item.geofence === 'Antrian SB Lane 2') {
        //   const [lanesSimpangBayah] = await this.databaseService.query(
        //     'SELECT id FROM lanes WHERE lane_code = "LANE 2"',
        //   );
        //   idSimpangBayah = lanesSimpangBayah.id;
        // } else if (item.geofence === 'Antrian SB Lane 3') {
        //   const [lanesSimpangBayah] = await this.databaseService.query(
        //     'SELECT id FROM lanes WHERE lane_code = "LANE 3"',
        //   );
        //   idSimpangBayah = lanesSimpangBayah.id;
        // } else if (item.geofence === 'Antrian SB Lane 4') {
        //   const [lanesSimpangBayah] = await this.databaseService.query(
        //     'SELECT id FROM lanes WHERE lane_code = "LANE 4"',
        //   );
        //   idSimpangBayah = lanesSimpangBayah.id;
        // }

        // await this.truckML.sendNotifFromSimpangBayahToLane(
        //   truck.name,
        //   item.tipe_truck,
        //   lane_id,
        //   idSimpangBayah
        // );

        await this.saveTrucksIfNotExist(truck);
      }
      await this.updateLanesToSimpangBayah(data);
      // Step 2: Generate placeholders fr batch insert to device_at_simpang_bayah
      const values = data.flatMap((item) => [
        item.id,
        item.vendor_id,
        item.name,
        item.driver_name,
        item.tipe_truck,
        item.contractor,
        item.lat,
        item.lng,
        item.geofence,
        item.status,
        item.speed,
        item.course,
        item.gps_time,
        'IN-SB',
      ]);

      const placeholders = data
        .map(
          (_, index) =>
            `($${index * 14 + 1}, $${index * 14 + 2}, $${index * 14 + 3}, $${index * 14 + 4}, $${index * 14 + 5}, $${index * 14 + 6}, $${index * 14 + 7}, $${index * 14 + 8}, $${index * 14 + 9}, $${index * 14 + 10}, $${index * 14 + 11}, $${index * 14 + 12}, $${index * 14 + 13}, $${index * 14 + 14})`,
        )
        .join(', ');

      // Step 3: Save device data and process assignment queue
      await Promise.all([
        this.saveDeviceSBMain(client, placeholders, values),
        this.AssinmentCPQueue(client, data),
      ]);
      // Commit transaction
      await this.databaseService.commitTransaction(client);
    } catch (error) {
      await this.databaseService.rollbackTransaction(client);
      this.errHandler.logError('Ooops ERROR Proccess Assignment Kafka', error);
    }
  }

  async saveDeviceSBMain(
    client: any,
    placeholders: string,
    values: any[],
  ): Promise<any> {
    const query = `INSERT INTO device_at_simpang_bayah (
    truck_id, vendor_id, 
    nomor_lambung, driver_name,
    truck_type, contractor, 
    lat, lng, geofence, 
    status, speed, 
    course, gps_time,
    device_status
  )
  VALUES ${placeholders}
  ON CONFLICT (keylocked)
  DO NOTHING
`;

    await client.query(query, values);
  }
  async AssinmentCPQueue(client: any, data: DeviceSBData[]) {
    let truckInfo = null;
    for (const item of data) {
      try {
        const truck = {
          truck_id: item.id,
          typeoftruck: item.tipe_truck,
          nomor_lambung: item.name,
        };
        truckInfo = truck;
        const lane_id = await this.getLaneIsEligebleSimpangBayah(item);

        const {
          truck_id,
          status,
          queue_lane_name,
          lane_id_sb,
          lane_id_queue,
          message,
        } = await this.truckMonitorService.assignmentToCPQueueByTruck(
          client,
          truck,
          item.driver_name,
          lane_id,
        );
        const vidiotron = await this.databaseService.query(`SELECT v.is_dynamic
                        FROM vidiotron v
                        JOIN vidiotron_lane vl ON v.id = vl.vidiotron_id
                        WHERE vl.lane_id='${lane_id_sb}'`);

        if (vidiotron[0].is_dynamic !== false) {
          await this.databaseService.query(
            `UPDATE queue_vidiotron SET flag = 1 WHERE lane_id = ${lane_id_sb} AND nomorlambung = 'IDLE'`,
          );
          await this.vidioTronNotifService.saveNotifLane(
            lane_id_queue,
            truck_id,
            item.name,
            item.geofence.split(', ').pop(),
            lane_id_sb,
            queue_lane_name,
          );
        }
        await this.setSaveLogsDetectChangesSimpangBayah(client, lane_id_sb);
      } catch (error) {
        this.logger.error(`AssignmentToCPQueue-${truckInfo.truck_id}`, error);
        await this.errHandler.saveLogToDB(
          'AssignmentToCPQueue',
          `AssignmentToCPQueue-${truckInfo.truck_id}`,
          'debug',
          JSON.stringify(error),
          null,
        );
      }
    }
  }
  async saveTrucksIfNotExist(truck) {
    try {
      const isExist = await this.isTruckNotExistById(truck);
      if (!isExist) {
        const isExistName = await this.isTruckNotExistByName(truck);
        if (!isExistName) {
          const query = this.queryLoader.getQueryById('insert_trucks_urgent');
          await this.databaseService.query(query, [
            truck.id,
            truck.name,
            truck.tipe_truck,
          ]);
        } else {
          this.errHandler.logInfo(
            `This transaction will failed, available name of truck :${truck.name}, but different  truck id : ${truck.id} `,
          );
        }
      }
    } catch (error) {
      this.errHandler.logError('Urgent Save Truck was failed!', error);
    }
  }
  async isTruckNotExistById(truck) {
    const query = this.queryLoader.getQueryById('query_check_truck_id');
    const Rs = await this.databaseService.queryOne(query, [truck.id]);
    return Rs.isexist;
  }
  async isTruckNotExistByName(truck) {
    const query = this.queryLoader.getQueryById('query_check_truck_by_name');
    const Rs = await this.databaseService.queryOne(query, [truck.name]);
    return Rs.isexist;
  }
  async getLaneIsEligebleSimpangBayah(item: any): Promise<any> {
    this.errHandler.logDebug(`{ geofenceSimpangBayah: ${item.geofence}}`);

    let idSimpangBayah: number;
    const lastValue = item.geofence.split(', ').pop();
    this.errHandler.logDebug(`{lastValueGeofence: ${lastValue}}`);

    // TODO(BOBY): Enahncement
    // if (lastValue === 'Antrian SB Lane 1') {
    //   // idealnya cek dari id lanes simpang bayah by name
    //   const [lanesSimpangBayah] = await this.databaseService.query(
    //     "SELECT id FROM lanes WHERE lane_code = 'LANE 1'",
    //   );
    //   idSimpangBayah = lanesSimpangBayah.id;
    // } else if (lastValue === 'Antrian SB Lane 2') {
    //   const [lanesSimpangBayah] = await this.databaseService.query(
    //     "SELECT id FROM lanes WHERE lane_code = 'LANE 2'",
    //   );
    //   idSimpangBayah = lanesSimpangBayah.id;
    // } else if (lastValue === 'Antrian SB Lane 3') {
    //   const [lanesSimpangBayah] = await this.databaseService.query(
    //     "SELECT id FROM lanes WHERE lane_code = 'LANE 3'",
    //   );
    //   idSimpangBayah = lanesSimpangBayah.id;
    // } else if (lastValue === 'Antrian SB Lane 4') {
    //   const [lanesSimpangBayah] = await this.databaseService.query(
    //     "SELECT id FROM lanes WHERE lane_code = 'LANE 4'",
    //   );
    //   idSimpangBayah = lanesSimpangBayah.id;
    // }

    const lanesSimpangBayah = await this.databaseService.query(
      'SELECT lanes.id, lanes.lane_name, COUNT(qv.id) AS queue_count FROM lanes LEFT JOIN queue_vidiotron qv ON qv.lane_id = lanes.id AND qv.flag = 0 GROUP BY lanes.id, lanes.lane_name;',
    );

    idSimpangBayah = lanesSimpangBayah.sort(
      (a, b) => a.queue_count - b.queue_count,
    )[0].id;

    this.errHandler.logDebug(`ID SIMPANG BAYAH: ${idSimpangBayah}`);

    /*const query = `SELECT id,coalesce(max_capacity,0) max_capacity FROM lanes`;
    const listLanes = await this.databaseService.query(query);
    let lane_id: number = null;
    for (const lane of listLanes) {
      const total_trucks = await this.getTotalTrucksInLanes(lane.id, truck);
      const isEligible = await this.getRuleOfSimpangBayah(
        lane.id,
        truck.tipe_truck,
      );
      if (isEligible) {
        //lane ini dipakai jika terjadi overloading
        lane_id = lane.id;
      }
      if (isEligible && Number(total_trucks) <= Number(lane.max_capacity)) {
        lane_id = lane.id;
        break;
      }
    }*/
    return idSimpangBayah;
  }
  async getTotalTrucksInLanes(lane_id: number, truck: any) {
    const query = this.queryLoader.getQueryById(
      'query_check_device_at_simpang_bayah',
    );
    const Rs = await this.databaseService.queryOne(query, [lane_id]);
    return Rs.z_count;
  }
  async getRuleOfSimpangBayah(lane_id: number, truck_type: string) {
    const query = this.queryLoader.getQueryById('query_rule_in_simpang_bayah');
    const Rs = await this.databaseService.queryOne(query, [
      lane_id,
      truck_type,
    ]);
    return Rs.isexist;
  }
  async updateLanesToSimpangBayah(data: DeviceSBData[]) {
    for (const truck of data) {
      const query = `UPDATE device_at_simpang_bayah SET lane_id=$1 WHERE truck_id=$2 and device_status='IN-SB'`;
      const lane_id = await this.getLaneIsEligebleSimpangBayah(truck);
      await this.databaseService.query(query, [lane_id, truck.id]);
    }
  }
  async setWaitingStatusInCp_queue_Assignments(
    data: DeviceCPData[],
    is_update?: boolean,
  ) {
    const client = await this.databaseService.beginTransaction();
    try {
      const laneId = [];
      for (const truck of data) {
        if (is_update === true) {
          try {
            const geofenceTruckAktual = truck.geofence;
            const geofenceTruckAktualFinal = geofenceTruckAktual.includes(', ')
              ? geofenceTruckAktual.split(', ').pop()
              : geofenceTruckAktual;
            // Ambil data lane_id dan geofence_kode
            const getLaneIdTruck = await this.databaseService.query(`
              SELECT id                                
              FROM queue_lane ql                       
              WHERE geofence_kode = '${geofenceTruckAktualFinal}'
            `);
            this.errHandler.logDebug(
              `{ getLaneIdTruck: ${JSON.stringify(getLaneIdTruck)}}`,
            );
            this.errHandler.logDebug(`{ truckID: ${truck.id}}`);
            if (getLaneIdTruck.length > 0) {
              laneId.push(getLaneIdTruck[0].id);
              await this.databaseService
                .query(`UPDATE cp_queue_assignments SET lane_id= ${getLaneIdTruck[0].id} 
                  WHERE status='WAITING' AND truck_id=${truck.id};`);
            }
          } catch (error) {
            this.errHandler.logError('Ooops Error updating geofence', error);
          }
        }
        // Eksekusi secara berurutan untuk menjaga konsistensi transaksi
        await this.setStatusToWaiting(client, truck);
        await this.setDeviceAtSimpangBayahStatusToExitSB(client, truck);
      }
      // await this.laneService.sendDataToWebSocket(
      //   null,
      //   null,
      //   WebSocketAntrianCp.LANETOLANE,
      //   laneId,
      //   'GEOFENCE EXIT SB',
      // );
      await this.databaseService.commitTransaction(client);
    } catch (error) {
      await this.databaseService.rollbackTransaction(client);
      this.errHandler.logError('setWaitingStatusInCp_queue_Assignments', error);
    }
  }

  async setStatusToWaiting(conn: any | null, truck: any) {
    const client = conn || this.databaseService;
    const query = this.queryLoader.getQueryById('add_truck_queue_with_kafka');
    await client.query(query, [truck.id]);
  }
  async ProcessCOP(data: DeviceSBData[]) {
    const client = await this.databaseService.beginTransaction();
    
    if (!client) {
      this.errHandler.logError('ProcessCOP', 'Failed to get DB client');
      return;
    }
  
    try {
      for (const truck of data) {
        await this.setCPQueueAssigmentStatusToComplete(client, truck);
        await this.setDeviceAtSimpangBayahtStatusToExitCP(client, truck);
      }
      await this.databaseService.commitTransaction(client);
    } catch (error) {
      // Pastikan client ada sebelum rollback
      if (client) await this.databaseService.rollbackTransaction(client);
  
      this.errHandler.logError('ProcessCOP', error);
      this.errHandler.saveLogToDB(
        'ProcessCOP',
        'ProcessCOP',
        'error',
        JSON.stringify(error),
        null
      );
    }
  }  

  async setCPQueueAssigmentStatusToComplete(conn: any | null, truck: any) {
    const client = conn || this.databaseService;
    const socketClient = this.socketClientService.getSocket();
    //const socketClient =  SocketClientService.getInstance();
    try {
      const dataAssignments = await this.databaseService.query(
        `SELECT cqa.*, cps.cp_name , ced.cp_exit_type_name
        FROM cp_queue_assignments cqa 
        JOIN cps ON cps.cp_id = cqa.cp_queue_id 
        LEFT JOIN cp_exit_detail ced ON ced.cp_id = cps.cp_id
        WHERE truck_id = ${truck.id}
        ORDER BY auditupdate DESC LIMIT 1`,
      );
      if (dataAssignments.length > 0) {
        const assignment = dataAssignments[0];
        if (
          assignment.cp_exit_type_name === exitTypeEnum.GEOFENCE &&
          assignment.cp_exit_type_name !== null
        ) {
          if (assignment.status !== QueueStatusEnum.COMPLETED) {
            await this.laneService.sendDataToWebSocket(
              Number(assignment.cp_queue_id),
              null,
              WebSocketAntrianCp.COMPLETED,
              null,
              'GEOFENCE COP',
            );
            const query = this.queryLoader.getQueryById(
              'update_cp_queue_assignment_status_to_complate',
            );
            await client.query(query, [truck.id]);
            const msg = `${assignment.nomor_lambung} - Dumping Selesai ${assignment.cp_name}, via GEOFENCING COP`;
            socketClient.emit('toast_dumping_completed', {
              data: msg,
            });
            const dataInsertLogAssignment: AssignmentLogCreate = {
              assignments_id: assignment.assignment_id,
              flag: 'OUT',
              nomorlambung: assignment.nomor_lambung,
              truck_id: assignment.truck_id,
              cp_id: assignment.cp_queue_id,
              exit_by: 'GEOFENCE',
            };
            await this.CpQLogService.create(dataInsertLogAssignment);
          }
        } else if (assignment.cp_exit_type_name !== null) {
          await this.laneService.sendDataToWebSocket(
            Number(assignment.cp_queue_id),
            null,
            WebSocketAntrianCp.COMPLETED,
            null,
            'GEOFENCE COP',
          );
          const query = this.queryLoader.getQueryById(
            'update_cp_queue_assignment_status_to_complate',
          );
          await client.query(query, [truck.id]);
          const msg = `${assignment.nomor_lambung} - Dumping Selesai ${assignment.cp_name}, via GEOFENCING COP`;
          socketClient.emit('toast_dumping_completed', {
            data: msg,
          });
          const dataInsertLogAssignment: AssignmentLogCreate = {
            assignments_id: assignment.assignment_id,
            flag: 'OUT',
            nomorlambung: assignment.nomor_lambung,
            truck_id: assignment.truck_id,
            cp_id: assignment.cp_queue_id,
            exit_by: 'GEOFENCE',
          };
          await this.CpQLogService.create(dataInsertLogAssignment);
        }
      }
    } catch (error) {
      this.errHandler.logError(
        'Ooops Error Set CP Queue Assigment Status To Completed ',
        error,
      );
    }
  }
  async setDeviceAtSimpangBayahtStatusToExitCP(conn: any | null, truck: any) {
    const client = conn || this.databaseService;
    const query = this.queryLoader.getQueryById(
      'update_device_at_simpang_bayah_status_to_exit_cp',
    );
    await client.query(query, [truck.id]);
  }
  async setDeviceAtSimpangBayahStatusToExitSB(conn: any | null, truck: any) {
    const client = conn || this.databaseService;
    const query = this.queryLoader.getQueryById(
      'query_update_simpang_bayah_to_exit_sb',
    );
    await client.query(query, [truck.id]);
  }
  async setSaveLogsDetectChangesSimpangBayah(
    conn: any | null,
    lane_id_sb: number,
  ) {
    const query = this.queryLoader.getQueryById(
      'insert_logs_detect_simpang_bayah',
    );
    const client = conn || this.databaseService;
    await client.query(query, [Number(lane_id_sb)]);
  }

  async updateCPByGeofence(data: DeviceSBData[]) {
    const client = await this.databaseService.beginTransaction();
    try {
      for (const truck of data) {
        // Jalankan setiap operasi dengan menunggu hasilnya sebelum melanjutkan
        await this.setCPQueueAssigmentStatusToComplete(client, truck);
      }
      // Commit transaksi jika semua berhasil
      await this.databaseService.commitTransaction(client);
    } catch (error) {
      // Rollback transaksi jika terjadi error
      await this.databaseService.rollbackTransaction(client);

      // Log error ke sistem dan simpan ke database
      this.errHandler.logError('ProcessCOP', error);
      this.errHandler.saveLogToDB(
        'ProcessCOP', // Kategori log
        'ProcessCOP', // Nama proses
        'error', // Tingkat log
        JSON.stringify(error), // Detail error dalam bentuk string
        null, // Data tambahan jika diperlukan
      );
    }
  }
  async setCPQueueAssigmentByGeofence(data: DeviceSBData[]) {
    //cari cata culu ada tidak di db;
    let msg_log = '';
    for (const item of data) {
      const client = await this.databaseService.beginTransaction();
      try {
        const cp_name = parseCP(item.geofence);
        const [Rs, info_prev, cp_id_db] = await Promise.all([
          this.isInCpQueueAssignments(Number(item.id)),
          this.getInfoCurrentDataBeforeUpdateCpQueueAssignment(item.id),
          this.getCpIdByName(cp_name),
        ]);
        const dataAssignments = await this.databaseService.query(
          `SELECT cqa.*, cps.cp_name , ced.cp_entrance_type_name
          FROM cp_queue_assignments cqa 
          JOIN cps ON cps.cp_id = cqa.cp_queue_id 
          LEFT JOIN cp_entrance_detail ced ON ced.cp_id = cps.cp_id
          WHERE truck_id = ${item.id} AND cqa.status != 'COMPLETED' 
          ORDER BY auditupdate DESC LIMIT 1`,
        );
        let assignment;
        if (dataAssignments.length > 0) {
          assignment = dataAssignments[0];
          if (
            assignment.cp_entrance_type_name === entranceTypeEnum.GEOFENCE &&
            assignment.cp_entrance_type_name !== null
          ) {
            this.errHandler.logDebug('created log in geofence entrance config');

            const dataInsertLogAssignment: AssignmentLogCreate = {
              assignments_id: assignment.assignment_id,
              flag: 'IN',
              nomorlambung: assignment.nomor_lambung,
              truck_id: assignment.truck_id,
              cp_id: cp_id_db,
              entrance_by: 'GEOFENCE',
            };
            await this.CpQLogService.create(dataInsertLogAssignment);
          } else if (assignment.cp_entrance_type_name !== null) {
            this.errHandler.logDebug(
              'created log in geofence null entrance config',
            );
            const dataInsertLogAssignment: AssignmentLogCreate = {
              assignments_id: assignment.assignment_id,
              flag: 'IN',
              nomorlambung: assignment.nomor_lambung,
              truck_id: assignment.truck_id,
              cp_id: cp_id_db,
              entrance_by: 'GEOFENCE',
            };
            await this.CpQLogService.create(dataInsertLogAssignment);
          }
        }
        if (Rs != null) {
          if (Rs.cp_queue_id === cp_id_db) {
            //Jika data cp nya sama maka tidak perlu dilakukan perbaikan
            continue;
          }
        }
        const c_data = {
          truck_id: item.id,
          cp_id: cp_id_db,
          cp_name: cp_name,
        };
        msg_log =
          info_prev +
          'Update to : cp_id=' +
          cp_id_db +
          ' cp_name:' +
          cp_name +
          ' assigned by GEOFENCE';
        if (Rs !== null) {
          await this.setUpdateCpAqueueAssignment(client, c_data);
          const msgTooaster = `${assignment.nomor_lambung} di ${assignment.cp_name} Terdeteksi Berada di ${cp_name} berdasarkan Geofencing. Lokasi Telah diperbarui secara otomatis`;
          //const socketClient = SocketClientService.getInstance();
          const socketClient = this.socketClientService.getSocket();
          socketClient.emit('toast_update_geofence', {
            data: msgTooaster,
          });
          await this.laneService.sendDataToWebSocket(
            assignment.cp_queue_id,
            cp_id_db,
            WebSocketAntrianCp.CPTOCP,
            null,
            'GEOFENCE',
          );
        }
        await this.errHandler.saveLogToDB(
          'cpaq-goefence',
          'update',
          'debug',
          msg_log,
          null,
        );
        await this.databaseService.commitTransaction(client);
      } catch (error) {
        await this.errHandler.saveLogToDB(
          'cpaq-goefence',
          'update',
          'debug',
          msg_log,
          null,
        );
        await this.databaseService.rollbackTransaction(client);
      }
    }
  }
  async isInCpQueueAssignments(truck_id: number): Promise<any> {
    const query = `SELECT cp_queue_id,assigned_by FROM cp_queue_assignments WHERE truck_id=$1 AND status!='COMPLETED'`;
    const Rs = await this.databaseService.queryOne(query, [truck_id]);
    return Rs;
  }
  async setUpdateCpAqueueAssignment(conn: any | null, data: any) {
    const query = this.queryLoader.getQueryById(
      'update_cp_queue_assignment_in_cp',
    );
    const client = conn || this.databaseService;
    await client.query(query, [data.cp_id, data.truck_id]);
  }
  async getInfoCurrentDataBeforeUpdateCpQueueAssignment(
    truck_id: number,
  ): Promise<any> {
    const query = this.queryLoader.getQueryById(
      'get_info_cp_queue_assignments_before_update',
    );
    const Rs = await this.databaseService.queryOne(query, [truck_id]);
    let msg = '';
    if (Rs !== null) {
      msg = 'Data before:' + JSON.stringify(Rs.prev_data);
    }
    return msg;
  }
  async getCpIdByName(
    cp_name: string,
    conn: any | null = null,
  ): Promise<number> {
    if (cp_name.length > 0) {
      const query = `SELECT cp_id FROM cps WHERE UPPER(REGEXP_REPLACE(cp_name, '\s+', '', 'g'))=$1`;
      const c_name = removeAllSpaces(cp_name).toUpperCase();
      const Rs = await this.databaseService.queryOne(query, [c_name]);
      if (Rs !== null) {
        return Rs.cp_id;
      }
    }
    return null;
  }
}
