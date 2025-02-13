import { DatabaseService } from '@utils/database.service';
import { HttpException, Injectable } from '@nestjs/common';
import { VideoTronNotifDto } from '../jobs/dto/video-tron-notif.dto';
import { VidiotronDto } from './dto/vidiotron.dto';
import { VidiotronNotifDto } from './dto/vidiotron-notif.dto';
import { QueueStatusEnum, VidiotronTypeEnum } from '@utils/enums';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class LuminixUtil {
  constructor(
    private databaseService: DatabaseService,
    private readonly errHandler: ErrorHandlerService,
  ) {}

  static AVAILABLE = '#ffffff';
  static FULL = '#FFFFFF';
  static ALMOST_FULL = '#FFFFFF';

  static TYPE_OF_NOTIF_LANE = 'LANE';
  static TYPE_OF_NOTIF_REFRESH = 'REFRESH';
  static TYPE_OF_NOTIF_IDLE = 'IDLE-LANE';
  static TYPE_OF_NOTIF_IDLE_CP = 'IDLE-CP';
  static TYPE_OF_NOTIF_CP = 'CP';

  async getCommandCP(
    cpId: number,
    laneId: number,
    truckId: number,
  ): Promise<VidiotronNotifDto> {
    const vidiotron = await this.getVidioTronIdByCpId(laneId);
    if (vidiotron.is_dynamic) {
      return this.getCommandCPDynamic(laneId, cpId, truckId, vidiotron.id);
    } else {
      return this.getCommandCPStatic(cpId, vidiotron.id);
    }
  }

  async getCommandCPStatic(
    cpId: number,
    vidiotronId: number,
  ): Promise<VidiotronNotifDto> {
    const cp = await this.getCPById(cpId);
    const cpName = cp[0].cp_name ? cp[0].cp_name : '';
    const currentQueue = await this.getCountOfCPLoad(cpId);
    const maxQueue = cp[0].max_capacity ? Math.floor(cp[0].max_capacity) : 0;
    const command = this.getNotificationLaneToCPStatic(
      cpName,
      currentQueue,
      maxQueue,
    );
    return {
      header: cpName,
      body_description: '',
      type_truck_description: '',
      total_description: `(${currentQueue}/${maxQueue})`,
      cp_id: null,
      lane_id: null,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_CP,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: false,
    };
  }

  async getCommandCPDynamic(
    laneId: number,
    cpId: number,
    truckId: number,
    vidioTronId: number,
  ): Promise<VidiotronNotifDto> {
    const lane = `L${laneId}`;
    const truck = await this.getNomorLambungAndTypeTruckByTruckId(truckId);
    const noLambung = truck ? truck.nomor_lambung : '';
    const cp = await this.getCPById(cpId);
    const cpName = cp[0].cp_name ? cp[0].cp_name : 'CP' + cpId;
    this.errHandler.logDebug(`{VidiotronCp: ${JSON.stringify(cp)}}`);
    this.errHandler.logDebug(`{ VidiotronCpName: ${cp[0].cp_name}}`);
    const truckType = truck ? truck.typeoftruck : '';
    const maxQueue = cp[0].max_capacity ? Math.floor(cp[0].max_capacity) : 0;
    const currentQueue = await this.getCountOfCPLoad(cpId);
    const command = this.getCommandNotificationLaneQueueToCpQueueDynamic(
      lane,
      noLambung,
      cpName,
      truckType,
      maxQueue,
      currentQueue,
    );
    return {
      header: lane,
      body_description: `${noLambung} >>> ${cpName}`,
      type_truck_description: `(${truckType})`,
      total_description: `(${currentQueue}/${maxQueue})`,
      cp_id: cpId,
      lane_id: laneId,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_CP,
      command: command,
      vidiotron_id: vidioTronId,
      is_dynamic: false,
    };
  }

  async getCommandLane(
    queue_lane_id: number,
    truckId: number,
    lane_id_sb?: number,
    queue_lane_name?: string,
  ): Promise<VidiotronNotifDto | null> {
    const vidiotron = await this.getVidioTronIdByLaneId(lane_id_sb);
    if (vidiotron) {
      if (vidiotron.is_dynamic) {
        return this.getCommandLaneDynamic(
          queue_lane_id,
          truckId,
          vidiotron.id,
          lane_id_sb,
          queue_lane_name,
        );
      } else {
        return this.getCommandLaneStatic(vidiotron.id, lane_id_sb);
      }
    } else {
      return null;
    }
  }
  async getCommandLaneRefresh(
    lane_id_sb?: number,
  ): Promise<VidiotronNotifDto | null> {
    const vidiotron = await this.getVidioTronIdByLaneId(lane_id_sb);
    return this.getCommandRefresh(lane_id_sb, vidiotron.id);
  }
  async getCommandLaneIdle(
    lane_id_sb?: number,
  ): Promise<VidiotronNotifDto | null> {
    const vidiotron = await this.getVidioTronIdByLaneId(lane_id_sb);
    return this.getCommandIdle(lane_id_sb, vidiotron.id, 'lane');
  }
  async getCommandCpIdle(
    queue_lane_id: number,
    cp_id: number,
    lane_code: string
  ): Promise<VidiotronNotifDto | null> {
    const vidiotron = await this.getVidioTronIdByCpId(cp_id);
    return this.getCommandIdleQueue(queue_lane_id, vidiotron.id, lane_code);
  }

  public async getCommandLaneStatic(
    vidiotronId?: number,
    lane_id_sb?: number,
  ): Promise<VidiotronNotifDto | null> {
    let maxValue: number;
    this.errHandler.logDebug(
      `{ProcessNotifStatic: 'Start process notif static' }`,
    );
    if (vidiotronId == null) {
      const vidiotron = await this.getVidioTronIdByLaneId(lane_id_sb);
      if (vidiotron) {
        vidiotronId = vidiotron.id;
        maxValue = vidiotron.max_value;
      }
    }
    const dataVidiotron = await this.getDataVidiotronByVidiotronId(vidiotronId);
    maxValue = dataVidiotron.max_value;
    const resultQueueLane =
      await this.getConfigQueueLaneVidiotronStatic(vidiotronId);
    if (!resultQueueLane || resultQueueLane.length == 0) {
      this.errHandler.logDebug(`{
        resultQueueLaneVidiotronStatic: 'Vidiotron Not Configure Static'}`);
      return;
    }
    let lane = `${resultQueueLane[0].lane_code}`;
    let truckType = await this.getTruckTypeFromLane(
      resultQueueLane[0].queue_lane_id,
    );
    const currentQueue = await this.getCurrentLoadLane(
      resultQueueLane[0].queue_lane_id,
      vidiotronId,
    );
    const maxQueue = await this.getMaxCapacityLane(
      resultQueueLane[0].queue_lane_id,
    );
    let command: string;
    if (maxValue !== 1) {
      let currentQueueLeft: number;
      let maxQueueLeft: number;
      let truckTypeLeft: string;
      let currentQueueRight: number;
      let maxQueueRight: number;
      let truckTypeRight: string;
      let statusLaneLeft = true;
      let statusLaneRight = true;
      let LaneLeft = `${resultQueueLane[0].lane_code}`;
      let LaneRight = `${resultQueueLane[1].lane_code}`;
      const dataQueueLane = await this.databaseService.query(`SELECT 
                              status, 
                              lane_code 
                          FROM 
                              queue_lane 
                          WHERE 
                              queue_lane.id IN (${resultQueueLane[0].queue_lane_id}, ${resultQueueLane[1].queue_lane_id})`);
      if (resultQueueLane.length > 0) {
        this.errHandler.logDebug(`{ getCurrentStatic: 'Get Current Static' }`);
        currentQueueLeft = await this.getCurrentLoadLane(
          resultQueueLane[0].queue_lane_id,
          vidiotronId,
        );
        maxQueueLeft = await this.getMaxCapacityLane(
          resultQueueLane[0].queue_lane_id,
        );
        truckTypeLeft = await this.getTruckTypeFromLane(
          resultQueueLane[0].queue_lane_id,
        );
        currentQueueRight = await this.getCurrentLoadLane(
          resultQueueLane[1].queue_lane_id,
          vidiotronId,
        );
        maxQueueRight = await this.getMaxCapacityLane(
          resultQueueLane[1].queue_lane_id,
        );
        truckTypeRight = await this.getTruckTypeFromLane(
          resultQueueLane[1].queue_lane_id,
        );
        if (dataQueueLane[0].status === false) {
          truckTypeLeft = `${dataQueueLane[0].lane_code} - OFF`;
          LaneLeft = `L${lane_id_sb}`;
          statusLaneLeft = false;
        }
        if (dataQueueLane[1].status === false) {
          truckTypeRight = `${dataQueueLane[1].lane_code} - OFF`;
          LaneRight = `L${lane_id_sb}`;
          statusLaneRight = false;
        }
        command = this.getNotificationSimpangBayahToLaneStatic2(
          LaneLeft,
          truckTypeLeft,
          currentQueueLeft,
          maxQueueLeft,
          LaneRight,
          truckTypeRight,
          currentQueueRight,
          maxQueueRight,
          statusLaneLeft,
          statusLaneRight,
        );
      }
    } else {
      const dataQueueLane = await this.databaseService.query(`SELECT 
        status, 
        lane_code 
    FROM 
        queue_lane 
    WHERE 
        queue_lane.id = ${resultQueueLane[0].queue_lane_id}`);
      if (dataQueueLane[0].status === false) {
        (lane = `L${lane_id_sb}`),
          (truckType = `${dataQueueLane[0].lane_code} - OFF`);
      }
      command = this.getNotificationSimpangBayahToLaneStatic(
        lane,
        truckType,
        currentQueue,
        maxQueue,
      );
    }
    return {
      header: lane,
      body_description: '',
      type_truck_description: `(${truckType})`,
      total_description: `(${currentQueue}/${maxQueue})`,
      cp_id: null,
      lane_id: lane_id_sb,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_LANE,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: false,
    };
  }

  async getCommandLaneDynamic(
    queue_lane_id: number,
    truckId: number,
    vidiotronId: number,
    lane_id_sb?: number,
    queue_lane_name?: string,
  ): Promise<VidiotronNotifDto | null> {
    const nameQueueLane = await this.databaseService.query(
      `SELECT lane_code FROM queue_lane WHERE id = ${queue_lane_id}`,
    );
    const truck = await this.getNomorLambungAndTypeTruckByTruckId(truckId);
    const noLambung = truck != null ? truck.nomor_lambung : '';
    const truckType = truck != null ? truck.typeoftruck : '';
    const laneSb = `L${lane_id_sb}`;
    const lane_antrian = `${nameQueueLane[0].lane_code}`;
    this.errHandler.logDebug(`{ getCurrentDinamis: 'Get Current Dinamis' }`);
    const currentQueue = await this.getCurrentLoadLane(
      queue_lane_id,
      vidiotronId,
    );
    this.errHandler.logDebug(
      `{ LogCurrentQueue:${JSON.stringify(currentQueue)}`,
    );
    const maxQueue = await this.getMaxCapacityLane(queue_lane_id);
    const command = this.getNotificationSimpangBayahToLaneDynamic(
      laneSb,
      noLambung,
      truckType,
      currentQueue,
      maxQueue,
      lane_antrian,
    );
    return {
      header: laneSb,
      body_description: `${noLambung} >>> ${lane_antrian}`,
      type_truck_description: `(${truckType})`,
      total_description: `(${currentQueue}/${maxQueue})`,
      cp_id: null,
      lane_id: lane_id_sb,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_LANE,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: true,
    };
  }
  async getCommandRefresh(
    lane_id_sb: number,
    vidiotronId: number,
  ): Promise<VidiotronNotifDto | null> {
    const laneSb = `L${lane_id_sb}`;
    const command = this.getRefreshNotificationSimpangBayah(laneSb);
    return {
      header: laneSb,
      body_description: '',
      type_truck_description: '',
      total_description: '',
      cp_id: null,
      lane_id: lane_id_sb,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_REFRESH,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: true,
    };
  }
  async getCommandIdle(
    lane_id: number,
    vidiotronId: number,
    type: string,
  ): Promise<VidiotronNotifDto | null> {
    const laneSb = `L${lane_id}`;
    const command = this.getIdleNotificationSimpangBayah(laneSb);
    return {
      header: laneSb,
      body_description: '',
      type_truck_description: '',
      total_description: '',
      cp_id: null,
      lane_id: lane_id,
      status: false,
      notif_type:
        type == 'lane'
          ? LuminixUtil.TYPE_OF_NOTIF_IDLE
          : LuminixUtil.TYPE_OF_NOTIF_CP,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: true,
    };
  }
  async getCommandIdleQueue(
    lane_id: number,
    vidiotronId: number,
    lane_code: string
  ): Promise<VidiotronNotifDto | null> {
    const laneSb = `${lane_code}`;
    const command = this.getIdleNotificationSimpangBayah(laneSb);
    return {
      header: laneSb,
      body_description: 'IDLE',
      type_truck_description: '',
      total_description: '',
      cp_id: null,
      lane_id: lane_id,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_CP,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: true,
    };
  }

  async getCommandCPQueue(
    cpQueueId: number,
    laneId: number,
    truckId: number,
  ): Promise<VidiotronNotifDto> {
    const vidiotron = await this.getVidioTronIdByCpId(laneId);
    if (vidiotron.is_dynamic) {
      this.errHandler.logDebug(`{IsDynamicVtronCp: ${vidiotron.is_dynamic}}`);
      return this.getCommandCPQueueDynamic(
        laneId,
        cpQueueId,
        truckId,
        vidiotron.id,
      );
    } else {
      return this.getCommandCPQueueStatic(cpQueueId, vidiotron.id);
    }
  }

  async getCommandCPQueueStatic(
    cpQueueId: number,
    vidiotronId: number,
  ): Promise<VidiotronNotifDto> {
    const cpQueue = await this.getCPQueueById(cpQueueId);
    const cpName = cpQueue[0].queue_name ? cpQueue[0].queue_name : '';
    const currentQueue = await this.getCountOfCPLoad(cpQueueId);
    const maxQueue = cpQueue[0].max_capacity
      ? Math.floor(cpQueue[0].max_capacity)
      : 0;
    const command = this.getNotificationLaneToCPStatic(
      cpName,
      currentQueue,
      maxQueue,
    );
    return {
      header: cpName,
      body_description: '',
      type_truck_description: '',
      total_description: `(${currentQueue}/${maxQueue})`,
      cp_id: null,
      lane_id: null,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_CP,
      command: command,
      vidiotron_id: vidiotronId,
      is_dynamic: false,
    };
  }

  async getCommandCPQueueDynamic(
    laneId: number,
    cpId: number,
    truckId: number,
    vidioTronId: number,
  ): Promise<VidiotronNotifDto> {
    const lane = `L${laneId}`;
    const truck = await this.getNomorLambungAndTypeTruckByTruckId(truckId);
    const noLambung = truck ? truck.nomor_lambung : '';
    const cpQueue = await this.getCPQueueById(cpId);
    this.errHandler.logDebug(`{ LogCpqueue: ${JSON.stringify(cpQueue)} }`);
    this.errHandler.logDebug(`{ LogCpqueueName: ${cpQueue[0].cp_name}}`);
    const cpName = cpQueue[0].cp_name ? cpQueue[0].cp_name : '';
    const truckType = truck ? truck.typeoftruck : '';
    const maxQueue = cpQueue[0].max_capacity
      ? Math.floor(cpQueue[0].max_capacity)
      : 0;
    const currentQueue = await this.getCountOfCPLoad(cpId);
    const command = this.getCommandNotificationLaneQueueToCpQueueDynamic(
      lane,
      noLambung,
      cpName,
      truckType,
      maxQueue,
      currentQueue,
    );
    return {
      header: lane,
      body_description: `${noLambung} >>> ${cpName}`,
      type_truck_description: `(${truckType})`,
      total_description: `(${currentQueue}/${maxQueue})`,
      cp_id: cpId,
      lane_id: laneId,
      status: false,
      notif_type: LuminixUtil.TYPE_OF_NOTIF_CP,
      command: command,
      vidiotron_id: vidioTronId,
      is_dynamic: true,
    };
  }

  async getViditronNotif(vidiotron_notif_id: number): Promise<any> {
    const viditronNotifs = await this.databaseService.query(
      `select vn.*, v.is_dynamic  from vidiotron_notif vn left join vidiotron v on v.id = vn.vidiotron_id `,
      [vidiotron_notif_id],
    );

    if (viditronNotifs.length == 0) {
      return null;
    }

    return viditronNotifs[0];
  }

  async getMaxCapacityLane(laneId: number): Promise<number> {
    let maxLoad = 0;
    try {
      const maxLoadQuery = await this.databaseService.query(
        `select max_capacity from queue_lane where id = $1`,
        [laneId],
      );

      if (maxLoadQuery.length > 0) {
        maxLoad = maxLoadQuery[0].max_capacity;
      }
    } catch (error: any) {
      this.errHandler.logError('getMaxCapacityLane', error);
    }

    return Math.floor(maxLoad);
  }
  async getConfigQueueLaneVidiotronStatic(vidiotron_id: number): Promise<any> {
    try {
      const queue_lane_config = await this.databaseService.query(
        `select queue_lane_id, ql.lane_code from vidiotron_config_lane vcl JOIN queue_lane ql ON vcl.queue_lane_id = ql.id where vidiotron_id = $1`,
        [vidiotron_id],
      );
      if (queue_lane_config.length > 0) {
        return queue_lane_config;
      }
      return [];
    } catch (error: any) {
      this.errHandler.logError('getConfigQueueLaneVidiotronStatic', error);
    }
  }

  async getCurrentLoadLane(
    laneId: number,
    vidiotron_id: number,
  ): Promise<number> {
    let currentLoad = 0;
    this.errHandler.logDebug(`{ VidiotronId: ${vidiotron_id} }`);
    this.errHandler.logDebug(`{ LaneID: ${laneId} }`);
    try {
      const configCountingVidiotron = await this.databaseService.query(
        `SELECT count_geofence FROM vidiotron WHERE id = ${vidiotron_id}`,
      );
      this.errHandler.logDebug(`{
        CountingVidiotron: ${configCountingVidiotron[0].count_geofence},
      }`);
      if (
        configCountingVidiotron[0].count_geofence === true ||
        configCountingVidiotron[0].count_geofence === 'true'
      ) {
        const geofenceLane = await this.databaseService.query(
          `SELECT geofence_kode FROM queue_lane WHERE id =${laneId}`,
        );
        this.errHandler.logDebug(
          `{ geofenceLane: ${JSON.stringify(geofenceLane)}}`,
        );
        const currentLoadQuery = await this.databaseService
          .query(`SELECT COUNT(*)
              FROM geofence_service_logs
              WHERE geofence_target_value = '${geofenceLane[0].geofence_kode}'`);

        this.errHandler.logDebug(`
          'GEOFENCE LOAD :
          ${currentLoadQuery[0].count} : laneId`);

        if (currentLoadQuery.length > 0) {
          currentLoad = currentLoadQuery[0].count;
        } else {
          currentLoad = 0;
          this.errHandler.logDebug(
            `Error Get Counting Geofence ${geofenceLane[0].geofence_kode}`,
          );
        }
      } else {
        this.errHandler.logDebug(`{
          ProcessingCountAssignment: 'Processing Count Assignment',
        }`);
        const countingData = await this.databaseService.query(
          `SELECT COUNT(*) FROM cp_queue_assignments WHERE status = 'WAITING' AND lane_id = ${laneId}`,
        );
        this.errHandler.logDebug(`{
          CountAssignment: ${countingData[0].count},
        }`);
        if (countingData.length > 0) {
          currentLoad = countingData[0].count;
        } else {
          currentLoad = 0;
          this.errHandler.logDebug(
            `Error Get Counting Assignment Queue id ${laneId}`,
          );
        }
        this.errHandler.logDebug(
          `{ DoneCountAssignment: 'Done Count Assignment' }`,
        );
      }
    } catch (error: any) {
      this.errHandler.throwBadRequestError(error, 'Ooops Geofence Load error.');
    }

    return Math.floor(currentLoad);
  }

  getStringFromDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(date.getDate()).padStart(2, '0');

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0'); // Ensure 3 digits

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  async getTruckTypeFromLane(laneId: number): Promise<string> {
    const truckTypes = '';
    try {
      const truckTypeQuery = await this.databaseService.query(
        `select allow_unit from queue_lane where id = $1`,
        [laneId],
      );

      return truckTypeQuery[0].allow_unit;
    } catch (error: any) {
      this.errHandler.logError('Ooops getTruckTypeFromLane error', error);
      return '';
    }

    return truckTypes;
  }

  async getVidioTronIdByLaneId(laneId: number): Promise<VidiotronDto | null> {
    try {
      this.errHandler.logDebug(`find vidiotron for lane with id ${laneId}`);
      const result = await this.databaseService.query(
        'select v.* from vidiotron v join vidiotron_lane vl on vl.vidiotron_id = v.id where vl.lane_id = $1 limit 1',
        [laneId],
      );

      if (result.length === 0) {
        this.errHandler.logDebug(
          `vidiotron not found for lane with id ${laneId}`,
        );
        return null;
      }

      this.errHandler.logDebug(
        `found vidiotron ${result[0].id} for lane ${laneId}`,
      );
      return result[0];
    } catch (error: any) {
      this.errHandler.logError('Ooops getVidioTronIdByLaneId error', error);
      return null;
    }
  }
  async getDataVidiotronByVidiotronId(
    vidiotronId: number,
  ): Promise<VidiotronDto | null> {
    try {
      this.errHandler.logDebug(
        `find vidiotron for lane with id vidiotron ${vidiotronId}`,
      );
      const result = await this.databaseService.query(
        'select v.* from vidiotron v where v.id = $1 limit 1',
        [vidiotronId],
      );

      if (result.length === 0) {
        this.errHandler.logDebug(`vidiotron not found with id ${vidiotronId}`);
        return null;
      }

      this.errHandler.logDebug(`found vidiotron ${result[0].id}`);

      return result[0];
    } catch (error: any) {
      this.errHandler.logError(
        'Ooops getDataVidiotronByVidiotronId error',
        error,
      );
      return null;
    }
  }

  async getVidioTronIdByCpId(cpId: number): Promise<VidiotronDto | null> {
    try {
      this.errHandler.logDebug(`find vidiotron for cp with id ${cpId}`);
      const result = await this.databaseService.query(
        'select * from vidiotron v join vidiotron_cp vc on vc.vidiotron_id = v.id where vc.cp_id = $1 limit 1',
        [cpId],
      );

      if (result.length === 0) {
        this.errHandler.logDebug(`vidiotron not found for cp with id ${cpId}`);
        return null;
      }

      this.errHandler.logDebug(
        `found vidiotron ${result[0].id} for cp ${cpId}`,
      );
      return result[0];
    } catch (error: any) {
      this.errHandler.logError('Ooops getVidioTronIdByCpId error', error);
      return null;
    }
  }

  async getNomorLambungAndTypeTruckByTruckId(truck_id: number): Promise<any> {
    try {
      const trucksQuery = await this.databaseService.query(
        'select nomor_lambung, typeoftruck  from trucks t where t.id=$1',
        [truck_id],
      );
      if (trucksQuery.length > 0) {
        return trucksQuery[0];
      } else {
        return null;
      }
    } catch (error: any) {
      this.errHandler.logError(
        'Ooops getNomorLambungAndTypeTruckByTruckId error',
        error,
      );
      return null;
    }
  }

  async getCPById(cpId: number): Promise<any> {
    try {
      const cpQuery = await this.databaseService.query(
        `select * from cps where cp_id=${cpId}}`,
      );
      if (cpQuery.length > 0) {
        return cpQuery;
      } else {
        return null;
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops getCPById error', error);
      return null;
    }
  }

  async getCPQueueById(cpId: number): Promise<any> {
    try {
      this.errHandler.logDebug(`{ CpQueueID: ${cpId} }`);
      const cpQueueQuery = await this.databaseService.query(
        `select * from cps where cp_id=${cpId}`,
      );
      this.errHandler.logDebug(`{ ReturnCpQueueQuery: ${cpQueueQuery[0]} }`);
      this.errHandler.logDebug(
        `{ ReturnCpQueueQueryJson: ${cpQueueQuery.length} }`,
      );
      if (cpQueueQuery.length > 0) {
        this.errHandler.logDebug(
          'Return Query Cp Name: ' + cpQueueQuery[0].cp_name,
        );
        return cpQueueQuery;
      } else {
        return null;
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops getCPQueueById error', error);
      return null;
    }
  }

  async getCountOfCPLoad(cpId: number): Promise<number> {
    let currentLoad = 0;
    try {
      const query: string = `select count(*) from cp_queue_assignments where cp_queue_id = $1 and status = $2`;

      const currentLoadQuery = await this.databaseService.query(query, [
        cpId,
        QueueStatusEnum.ASSIGNED_TO_CP,
      ]);

      if (currentLoadQuery.length > 0) {
        currentLoad = currentLoadQuery[0].count;
      }
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'Failed to get data from database',
      );
    }

    return Math.floor(currentLoad);
  }

  getNotificationSimpangBayahToLaneDynamic(
    laneSb: string,
    noLambung: string,
    truckType: string,
    currentQueue: number,
    maxQueue: number,
    lane_antrian: string,
  ): any {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: laneSb,
      pos_x: 150,
      pos_y: 3,
      absolute: true,
      align: 'left',
      size: 50,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: noLambung,
      pos_x: 10,
      pos_y: 65,
      absolute: true,
      align: 'left',
      size: 42,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 3,
      tipe: 'text',
      text: '>>',
      pos_x: 235,
      pos_y: 67,
      absolute: true,
      align: 'left',
      size: 42,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 4,
      tipe: 'text',
      text: lane_antrian,
      pos_x: 300,
      pos_y: 64,
      absolute: true,
      align: 'left',
      size: 42,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    if (truckType.startsWith('Dump')) {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 70,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else if (truckType.startsWith('Double')) {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 40,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else if (truckType.startsWith('Side')) {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 50,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 70,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    }

    let color = LuminixUtil.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = LuminixUtil.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = LuminixUtil.ALMOST_FULL;
    }

    notifConfig.push({
      line_id: 6,
      tipe: 'text',
      text: `(${currentQueue}/${maxQueue})`,
      pos_x: 164,
      pos_y: 116,
      absolute: true,
      align: 'left',
      size: 24,
      color: color,
      speed: 10,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    return notifConfig;
  }

  getNotificationSimpangBayahToLaneStatic(
    lane: string,
    truckType: string,
    currentQueue: number,
    maxQueue: number,
  ): any {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: lane,
      pos_x: 162,
      pos_y: 3,
      absolute: true,
      align: 'left',
      size: 50,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: `(${truckType})`,
      pos_x: 100,
      pos_y: 72,
      absolute: true,
      align: 'left',
      size: 32,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    let color = LuminixUtil.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = LuminixUtil.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = LuminixUtil.ALMOST_FULL;
    }

    notifConfig.push({
      line_id: 3,
      tipe: 'text',
      text: `(${currentQueue}/${maxQueue})`,
      pos_x: 160,
      pos_y: 116,
      absolute: true,
      align: 'left',
      size: 24,
      color: color,
      speed: 10,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    return notifConfig;
  }
  getRefreshNotificationSimpangBayah(lane: string): any {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: lane,
      pos_x: 162,
      pos_y: 3,
      absolute: true,
      align: 'left',
      size: 50,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: `-`,
      pos_x: 155,
      pos_y: 72,
      absolute: true,
      align: 'left',
      size: 32,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    return notifConfig;
  }
  getIdleNotificationSimpangBayah(lane: string): any {
    let notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: lane,
      pos_x: 162,
      pos_y: 3,
      absolute: true,
      align: 'left',
      size: 50,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: 'IDLE SCREEN',
      pos_x: 100,
      pos_y: 75,
      absolute: true,
      align: 'left',
      size: 28,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    return notifConfig;
  }
  getNotificationSimpangBayahToLaneStatic2(
    laneLeft: string,
    truckTypeLeft: string,
    currentQueueLeft: number,
    maxQueueLeft?: number,
    laneRight?: string,
    truckTypeRight?: string,
    currentQueueRight?: number,
    maxQueueRight?: number,
    statusLaneLeft?: boolean,
    statusLaneRight?: boolean,
  ): any {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: laneLeft,
      pos_x: 71,
      pos_y: 25,
      absolute: true,
      align: 'left',
      size: 30,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });
    if (truckTypeLeft === null) {
      truckTypeLeft = '';
    }
    if (truckTypeRight === null) {
      truckTypeRight = '';
    }
    const elementLeft = truckTypeLeft.split(',');
    const elementRight = truckTypeRight.split(',');

    if (statusLaneLeft === false) {
      notifConfig.push({
        line_id: 2,
        tipe: 'text',
        text: `${truckTypeLeft}`,
        pos_x: 46,
        pos_y: 108,
        absolute: true,
        align: 'left',
        size: 19,
        color: '#FF0000',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else {
      if (elementLeft.length === 3) {
        notifConfig.push({
          line_id: 2,
          tipe: 'text',
          text: `(${truckTypeLeft})`,
          pos_x: 46,
          pos_y: 108,
          absolute: true,
          align: 'left',
          size: 19,
          color: '#ffffff',
          speed: 0,
          image: '',
          padding: 0,
          line_height: 1.2,
          width: 0,
          font: 0,
          style: 'normal',
        });
      } else if (elementLeft.length === 2) {
        notifConfig.push({
          line_id: 2,
          tipe: 'text',
          text: `(${truckTypeLeft})`,
          pos_x: 49,
          pos_y: 108,
          absolute: true,
          align: 'left',
          size: 19,
          color: '#ffffff',
          speed: 0,
          image: '',
          padding: 0,
          line_height: 1.2,
          width: 0,
          font: 0,
          style: 'normal',
        });
      } else {
        notifConfig.push({
          line_id: 2,
          tipe: 'text',
          text: `(${truckTypeLeft})`,
          pos_x: 63,
          pos_y: 108,
          absolute: true,
          align: 'left',
          size: 19,
          color: '#ffffff',
          speed: 0,
          image: '',
          padding: 0,
          line_height: 1.2,
          width: 0,
          font: 0,
          style: 'normal',
        });
      }
    }

    notifConfig.push({
      line_id: 7,
      tipe: 'text',
      text: laneRight,
      pos_x: 263,
      pos_y: 24,
      absolute: true,
      align: 'center',
      size: 30,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    if (statusLaneRight === false) {
      notifConfig.push({
        line_id: 8,
        tipe: 'text',
        text: `${truckTypeRight}`,
        pos_x: 232,
        pos_y: 108,
        absolute: true,
        align: 'center',
        size: 19,
        color: '#FF0000',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else {
      if (elementRight.length === 3) {
        notifConfig.push({
          line_id: 8,
          tipe: 'text',
          text: `(${truckTypeRight})`,
          pos_x: 232,
          pos_y: 108,
          absolute: true,
          align: 'center',
          size: 19,
          color: '#ffffff',
          speed: 0,
          image: '',
          padding: 0,
          line_height: 1.2,
          width: 0,
          font: 0,
          style: 'normal',
        });
      } else if (elementRight.length === 2) {
        notifConfig.push({
          line_id: 8,
          tipe: 'text',
          text: `(${truckTypeRight})`,
          pos_x: 246,
          pos_y: 108,
          absolute: true,
          align: 'center',
          size: 19,
          color: '#ffffff',
          speed: 0,
          image: '',
          padding: 0,
          line_height: 1.2,
          width: 0,
          font: 0,
          style: 'normal',
        });
      } else {
        notifConfig.push({
          line_id: 8,
          tipe: 'text',
          text: `(${truckTypeRight})`,
          pos_x: 262,
          pos_y: 108,
          absolute: true,
          align: 'center',
          size: 19,
          color: '#ffffff',
          speed: 0,
          image: '',
          padding: 0,
          line_height: 1.2,
          width: 0,
          font: 0,
          style: 'normal',
        });
      }
    }

    notifConfig.push({
      line_id: 13,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 0,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 14,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 15,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 15,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 30,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 16,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 45,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 17,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 60,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 18,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 75,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 19,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 90,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 20,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 105,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 21,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 120,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 22,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 135,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 23,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 150,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 24,
      tipe: 'text',
      text: 'I',
      pos_x: 182,
      pos_y: 165,
      absolute: true,
      align: 'left',
      size: 19,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    // kanan
    let colorRight = LuminixUtil.AVAILABLE;
    if (currentQueueRight >= maxQueueRight) {
      colorRight = LuminixUtil.FULL;
    } else if (maxQueueRight - currentQueueRight <= 5) {
      colorRight = LuminixUtil.ALMOST_FULL;
    }
    let colorLeft = LuminixUtil.AVAILABLE;
    if (currentQueueLeft >= maxQueueLeft) {
      colorLeft = LuminixUtil.FULL;
    } else if (maxQueueLeft - currentQueueLeft <= 5) {
      colorLeft = LuminixUtil.ALMOST_FULL;
    }

    if (statusLaneRight !== false) {
      notifConfig.push({
        line_id: 11,
        tipe: 'text',
        text: `${currentQueueRight}/${maxQueueRight}`,
        pos_x: 262,
        pos_y: 74,
        absolute: true,
        align: 'left',
        size: 19,
        color: colorRight,
        speed: 10,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    }
    // kanan

    if (statusLaneLeft !== false) {
      notifConfig.push({
        line_id: 6,
        tipe: 'text',
        text: `${currentQueueLeft}/${maxQueueLeft}`,
        pos_x: 65,
        pos_y: 74,
        absolute: true,
        align: 'left',
        size: 19,
        color: colorLeft,
        speed: 10,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    }
    // kiri

    return notifConfig;
  }

  getCommandNotificationLaneQueueToCpQueueDynamic(
    lane: string,
    noLambung: string,
    cpName: string,
    truckType: string,
    maxQueue: number,
    currentQueue: number,
  ): any {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: lane,
      pos_x: 162,
      pos_y: 3,
      absolute: true,
      align: 'left',
      size: 46,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: noLambung,
      pos_x: 36,
      pos_y: 65,
      absolute: true,
      align: 'left',
      size: 38,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 3,
      tipe: 'text',
      text: '>>',
      pos_x: 215,
      pos_y: 67,
      absolute: true,
      align: 'left',
      size: 38,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 4,
      tipe: 'text',
      text: cpName,
      pos_x: 265,
      pos_y: 64,
      absolute: true,
      align: 'left',
      size: 38,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    if (truckType.startsWith('Dump')) {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 70,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else if (truckType.startsWith('Double')) {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 40,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else if (truckType.startsWith('Side')) {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 50,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    } else {
      notifConfig.push({
        line_id: 5,
        tipe: 'text',
        text: `(${truckType})`,
        pos_x: 70,
        pos_y: 147,
        absolute: true,
        align: 'left',
        size: 32,
        color: '#ffffff',
        speed: 0,
        image: '',
        padding: 0,
        line_height: 1.2,
        width: 0,
        font: 0,
        style: 'normal',
      });
    }

    // notifConfig.push({
    //   line_id: 5,
    //   tipe: 'text',
    //   text: `(${truckType})`,
    //   pos_x: 163,
    //   pos_y: 147,
    //   absolute: true,
    //   align: 'left',
    //   size: 28,
    //   color: '#ffffff',
    //   speed: 0,
    //   image: '',
    //   padding: 0,
    //   line_height: 1.2,
    //   width: 0,
    //   font: 0,
    //   style: 'normal',
    // });

    let color = LuminixUtil.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = LuminixUtil.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = LuminixUtil.ALMOST_FULL;
    }

    notifConfig.push({
      line_id: 6,
      tipe: 'text',
      text: `(${currentQueue}/${maxQueue})`,
      pos_x: 164,
      pos_y: 116,
      absolute: true,
      align: 'left',
      size: 20,
      color: color,
      speed: 10,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });
    return notifConfig;
  }

  getNotificationLaneToCPStatic(
    cpName: string,
    currentQueue: number,
    maxQueue: number,
  ): any {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'text',
      text: cpName,
      pos_x: 127,
      pos_y: 38,
      absolute: true,
      align: 'left',
      size: 46,
      color: '#fed835',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: ``,
      pos_x: 137,
      pos_y: 90,
      absolute: true,
      align: 'left',
      size: 28,
      color: '#ffffff',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    let color = LuminixUtil.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = LuminixUtil.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = LuminixUtil.ALMOST_FULL;
    }

    notifConfig.push({
      line_id: 3,
      tipe: 'text',
      text: `(${currentQueue}/${maxQueue})`,
      pos_x: 164,
      pos_y: 116,
      absolute: true,
      align: 'left',
      size: 20,
      color: color,
      speed: 10,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'normal',
    });

    return notifConfig;
  }
}
