import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { VidiotronNotif } from './entities/vidiotron-notif.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { SaveNotifDto } from './dto/save-notif.dto';
import { DatabaseService } from '@utils/database.service';
import {
  NotifCPResponseDto,
  NotifLaneResponseDto,
} from './dto/notif-response.dto';
import { QueueVidiotron } from './entities/vidiotron-queue.entity';
import { VidiotronNotifDto } from '../luminix/dto/vidiotron-notif.dto';
import { LuminixUtil } from '../luminix/luminix.util';
import { dot } from 'node:test/reporters';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { DeviceCPDataPayload } from 'src/kafka/dto/device_cp.payload';

@Injectable()
export class VidiotronNotifService {
  constructor(
    @InjectRepository(VidiotronNotif)
    private vidiotronNotifRepository: Repository<VidiotronNotif>,
    @InjectRepository(QueueVidiotron)
    private QueueVidiotronRepository: Repository<QueueVidiotron>,
    private databaseService: DatabaseService,
    private luminixUtil: LuminixUtil,
    private readonly errHandler: ErrorHandlerService,
  ) {}

  async saveNotif(dto: SaveNotifDto, typeLane?: string): Promise<any> {
    try {
      const notif = new VidiotronNotif();
      notif.cp_id = dto.cpId;
      notif.lane_id = dto.laneId;
      notif.status = dto.status;
      notif.header = dto.header;
      notif.body_description = dto.body;
      notif.total_description = dto.total;
      notif.type_truck_description = dto.typeTruck;
      notif.notif_type = dto.type;
      notif.command = dto.command;
      notif.vidiotron_id = dto.vidiotron_id;

      await this.vidiotronNotifRepository.save(notif);

    } catch (error: any) {
      this.errHandler.throwBadRequestError(error, 'saveNotif Error');
    }
  }

  async saveNotifCpQueue(
    cpQueueId?: number,
    laneId?: number,
    truckId?: number,
  ): Promise<void> {
    try {
      const dto: VidiotronNotifDto = await this.luminixUtil.getCommandCPQueue(
        cpQueueId,
        laneId,
        truckId,
      );
      const notif = new VidiotronNotif();
      notif.cp_id = dto.cp_id;
      notif.lane_id = dto.lane_id;
      notif.status = dto.status;
      notif.header = dto.header;
      notif.body_description = dto.body_description;
      notif.total_description = dto.total_description;
      notif.type_truck_description = dto.type_truck_description;
      notif.notif_type = dto.notif_type;
      notif.command = dto.command;
      notif.vidiotron_id = dto.vidiotron_id;

      await this.vidiotronNotifRepository.save(notif);

      // await this.databaseService.query(
      //   `
      //     INSERT INTO queue_vidiotron (lane_id, vidiotron_notif_id, nomorlambung, created_at, auditupdate, flag, lane_name,queue_lane_name,queue_lane_id)
      //     VALUES ('${dto.lane_id}', '${resultVidiotronNotif.vidiotron_notif_id}', '${nomorlambung}', now(), now(), 0, '${namingQueue}','${queueLaneName}', '${cpQueueId}' );
      //   `,
      // );
    } catch (error: any) {
      this.errHandler.throwBadRequestError(error, 'Save Notif Queue Error');
    }
  }

  public async saveNotifCp(
    cpId: number,
    laneId: number,
    truckId: number,
    nolam?: string,
    geofence?: string,
  ): Promise<void> {
    try {
      const dto: VidiotronNotifDto = await this.luminixUtil.getCommandCP(
        cpId,
        laneId,
        truckId,
      );
      const notif = new VidiotronNotif();
      notif.cp_id = dto.cp_id;
      notif.lane_id = dto.lane_id;
      notif.status = dto.status;
      notif.header = dto.header;
      notif.body_description = dto.body_description;
      notif.total_description = dto.total_description;
      notif.type_truck_description = dto.type_truck_description;
      notif.notif_type = dto.notif_type;
      notif.command = dto.command;
      notif.vidiotron_id = dto.vidiotron_id;

      const resultNotif = await this.vidiotronNotifRepository.save(notif);
      const nolam = await this.databaseService.query(
        `SELECT nomor_lambung FROM trucks WHERE id = $1`,
        [truckId],
      );
      await this.databaseService.query(
        `
          INSERT INTO queue_vidiotron_cp (lane_id, vidiotron_notif_id, nomorlambung, created_at, auditupdate, flag, cp_id)
          VALUES ('${dto.lane_id}', '${resultNotif.vidiotron_notif_id}', '${nolam[0].nomor_lambung}', now(), now(), 0, '${dto.cp_id}');
        `,
      );
    } catch (error: any) {
      this.errHandler.logError('saveNotifCp error',error);
    }
  }

  async saveNotifLane(
    queue_lane_id: number,
    truckId: number,
    nomorlambung?: string,
    geofence?: string,
    lane_id_sb?: number,
    queue_lane_name?: string,
  ): Promise<void> {
    try {
      if (queue_lane_id === null) return;
      const dto: VidiotronNotifDto = await this.luminixUtil.getCommandLane(
        queue_lane_id,
        truckId,
        lane_id_sb,
      );
      const notif = new VidiotronNotif();
      notif.cp_id = dto.cp_id !== null ? dto.cp_id : null;
      notif.lane_id = dto.lane_id;
      notif.status = dto.status;
      notif.header = dto.header;
      notif.body_description = dto.body_description;
      notif.total_description = dto.total_description;
      notif.type_truck_description = dto.type_truck_description;
      notif.notif_type = dto.notif_type;
      notif.command = dto.command;
      notif.vidiotron_id = dto.vidiotron_id;

      const returnNotif = await this.vidiotronNotifRepository.save(notif);
      let nolam = '';
      if (nomorlambung) {
        nolam = nomorlambung;
      }
      await this.databaseService.query(
        `
          INSERT INTO queue_vidiotron (lane_id, vidiotron_notif_id, nomorlambung, created_at, auditupdate, flag, lane_name,queue_lane_name,queue_lane_id)
          VALUES ('${dto.lane_id}', '${returnNotif.vidiotron_notif_id}', '${nolam}', now(), now(), 0, '${geofence}','${queue_lane_name}', '${queue_lane_id}' );
        `,
      );
    } catch (error: any) {
      this.errHandler.logError(`AssignmentToCPQueue-${truckId}`, error);
      await this.errHandler.saveLogToDB(
        'AssignmentToCPQueue',
        `AssignmentToCPQueue-${truckId}`,
        'debug',
        JSON.stringify(error),
        null,
      );
    }
  }
  async saveNotifRefreshSbayah(
    updateQueueVidiotronDto: DeviceCPDataPayload,
  ): Promise<void> {
    try {
      for (const truck of updateQueueVidiotronDto.data) {
        const laneId = await this.databaseService.query(
          `SELECT lane_id FROM queue_vidiotron WHERE nomorlambung = $1`,
          [truck.name],
        );
        const lane_id_sb = laneId[0].lane_id;
        if (lane_id_sb === null) return;
        const dto: VidiotronNotifDto =
          await this.luminixUtil.getCommandLaneRefresh(lane_id_sb);
        const notif = new VidiotronNotif();
        notif.cp_id = dto.cp_id !== null ? dto.cp_id : null;
        notif.lane_id = dto.lane_id;
        notif.status = dto.status;
        notif.header = dto.header;
        notif.body_description = dto.body_description;
        notif.total_description = dto.total_description;
        notif.type_truck_description = dto.type_truck_description;
        notif.notif_type = dto.notif_type;
        notif.command = dto.command;
        notif.vidiotron_id = dto.vidiotron_id;

        const returnNotif = await this.vidiotronNotifRepository.save(notif);
      }
    } catch (error: any) {
      this.errHandler.logError('Error Refresh Vidiotron ', error);
    }
  }
  async saveNotifIdleScreen(
    updateQueueVidiotronDto: DeviceCPDataPayload,
  ): Promise<void> {
    try {
      for (const truck of updateQueueVidiotronDto.data) {
        const laneId = await this.databaseService.query(
          `SELECT lane_id FROM queue_vidiotron WHERE nomorlambung = $1`,
          [truck.name],
        );
        const lane_id_sb = laneId[0].lane_id;
        const geofenceTruckAktualFinal = truck.geofence.includes(', ')
          ? truck.geofence.split(', ').pop()
          : truck.geofence;
        const checkData = await this.databaseService.query(
          `SELECT * FROM geofence_service_logs WHERE geofence_target_value = '${geofenceTruckAktualFinal}' LIMIT 1`,
        );
        if (checkData[0].count === 0) {
          await this.saveIdleLane(lane_id_sb);
        }
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops Error Idle Vidiotron ',error);
    }
  }

  private async saveIdleLane(lane_id_sb: number) {
    if (lane_id_sb === null) return;
    const dto: VidiotronNotifDto =
      await this.luminixUtil.getCommandLaneIdle(lane_id_sb);
    const notif = new VidiotronNotif();
    notif.cp_id = dto.cp_id !== null ? dto.cp_id : null;
    notif.lane_id = dto.lane_id;
    notif.status = dto.status;
    notif.header = dto.header;
    notif.body_description = dto.body_description;
    notif.total_description = dto.total_description;
    notif.type_truck_description = dto.type_truck_description;
    notif.notif_type = dto.notif_type;
    notif.command = dto.command;
    notif.vidiotron_id = dto.vidiotron_id;

    const returnNotif = await this.vidiotronNotifRepository.save(notif);
    await this.databaseService.query(
      `
        INSERT INTO queue_vidiotron (lane_id, vidiotron_notif_id, nomorlambung, created_at, auditupdate, flag, lane_name,queue_lane_name,queue_lane_id)
        VALUES ('${lane_id_sb}', '${returnNotif.vidiotron_notif_id}', 'IDLE', now(), now(), 0, 'IDLE','IDLE', 0 );
      `,
    );
  }
  async saveNotifIdleScreenCp(
    queue_lane_id: number,
    cp_id: number,
    lane_code: string,
  ): Promise<void> {
    try {
        const queue_lane = queue_lane_id;
        if (queue_lane === null) return;
        const dto: VidiotronNotifDto =
          await this.luminixUtil.getCommandCpIdle(queue_lane, cp_id,lane_code);
        const notif = new VidiotronNotif();
        notif.cp_id = dto.cp_id !== null ? dto.cp_id : null;
        notif.lane_id = dto.lane_id;
        notif.status = dto.status;
        notif.header = dto.header;
        notif.body_description = dto.body_description;
        notif.total_description = dto.total_description;
        notif.type_truck_description = dto.type_truck_description;
        notif.notif_type = dto.notif_type;
        notif.command = dto.command;
        notif.vidiotron_id = dto.vidiotron_id;

        const returnNotif = await this.vidiotronNotifRepository.save(notif);
    } catch (error: any) {
      this.errHandler.logError('Ooops Error Refresh Vidiotron ',error);
    }
  }
  async saveNotifOffStaticLane(
    truckId: number,
    nomorlambung?: string,
    geofence?: string,
    lane_id_sb?: number,
    queue_lane_name?: string,
    vidiotronID?: number,
  ): Promise<void> {
    try {
      const notif = new VidiotronNotif();
      notif.cp_id = null;
      notif.lane_id = lane_id_sb;
      notif.status = false;
      notif.header = `L${lane_id_sb}`;
      notif.body_description = '-';
      notif.total_description = `${queue_lane_name} - OFF`;
      notif.type_truck_description = '';
      notif.notif_type = 'LANE';
      notif.command = '';
      notif.vidiotron_id = vidiotronID;

      const returnNotif = await this.vidiotronNotifRepository.save(notif);

      await this.databaseService.query(
        `
          INSERT INTO queue_vidiotron (lane_id, vidiotron_notif_id, nomorlambung, created_at, auditupdate, flag, lane_name,queue_lane_name,queue_lane_id)
          VALUES ('${lane_id_sb}', '${returnNotif.vidiotron_notif_id}', '${nomorlambung}', now(), now(), 0, '${geofence}','${queue_lane_name}', 0 );
        `,
      );
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'Save Notif Off Static Lane : error',
      );
    }
  }

  async saveNotifLaneStatic(laneId: number, truckId: number): Promise<void> {
    try {
      const dto: VidiotronNotifDto =
        await this.luminixUtil.getCommandLaneStatic(laneId, truckId);
      const notif = new VidiotronNotif();
      notif.cp_id = dto.cp_id;
      notif.lane_id = dto.lane_id;
      notif.status = dto.status;
      notif.header = dto.header;
      notif.body_description = dto.body_description;
      notif.total_description = dto.total_description;
      notif.type_truck_description = dto.type_truck_description;
      notif.notif_type = dto.notif_type;
      notif.command = dto.command;
      notif.vidiotron_id = dto.vidiotron_id;

      await this.vidiotronNotifRepository.save(notif);
    } catch (error: any) {
      this.errHandler.throwBadRequestError(
        error,
        'Save Notif Off Static Lane : error',
      );
    }
  }

  async fetchNotifLane(): Promise<any> {
    try {
      // const result: NotifLaneResponseDto[] = await this.databaseService.query(
      //   'select  notif_id, l.id as lane_id, l.lane_code, l.lane_name, l.status, vn.notif_type, vn."header", vn.body_description, vn.total_description, vn.type_truck_description, vn.command, vn.vidiotron_id' +
      //     ' from lanes l left join (' +
      //     ' SELECT notif_id, lane_id, notif_type, "header", body_description, total_description, type_truck_description, command, vidiotron_id' +
      //     ' FROM (' +
      //     '    SELECT vidiotron_notif_id as notif_id, lane_id, notif_type, "header", body_description, total_description, type_truck_description, command, vidiotron_id,' +
      //     '           ROW_NUMBER() OVER (PARTITION BY cp_id ORDER by created_at  DESC) AS row_num' +
      //     "    FROM vidiotron_notif where notif_type = 'LANE' and status=any($1)" +
      //     ' ) subquery WHERE row_num = 1' +
      //     ' ) vn on vn.lane_id = l.id order by l.lane_name',
      //   [statuses],
      // );

      const result = await this.databaseService.query(
        `WITH RankedQueue AS (
          SELECT 
              qv.*,
              l.id AS lane_number,
              v.is_dynamic,  -- Tambahkan is_dynamic dari tabel vidiotron
              v.max_value,   -- Tambahkan max_value dari tabel vidiotron
              ROW_NUMBER() OVER (
                  PARTITION BY l.id 
                  ORDER BY 
                      CASE 
                          WHEN qv.nomorlambung = 'STATIC' THEN 1 
                          ELSE 0 
                      END DESC,  -- Prioritaskan STATIC terlebih dahulu
                      qv.id DESC -- Untuk STATIC, ambil yang terakhir berdasarkan ID
              ) AS rn
          FROM 
              lanes l
          LEFT JOIN 
              queue_vidiotron qv ON l.id = qv.lane_id
          LEFT JOIN 
              vidiotron_lane vl ON l.id = vl.lane_id
          LEFT JOIN 
              vidiotron v ON vl.vidiotron_id = v.id
          WHERE 
              (
                  v.is_dynamic = FALSE AND qv.nomorlambung = 'STATIC' AND qv.flag = 1  -- Jika is_dynamic = false, ambil STATIC
              )
              OR (
                  v.is_dynamic = TRUE AND (qv.nomorlambung != 'STATIC' AND (qv.flag = 0 OR qv.flag IS NULL))  -- Jika is_dynamic = true, ambil dinamis
              )
      ),
      FinalResult AS (
          SELECT 
              l.id AS lane_id,
              l.lane_name AS lane_name,
              l.lane_code AS lane_code,
              l.status AS lane_status,
              rq.vidiotron_notif_id,
              rq.nomorlambung,
              rq.flag,
              rq.lane_number,
              rq.is_dynamic,  -- Tambahkan is_dynamic ke FinalResult
              rq.max_value    -- Tambahkan max_value ke FinalResult
          FROM 
              lanes l
          LEFT JOIN 
              RankedQueue rq ON l.id = rq.lane_number AND rq.rn = 1
          LEFT JOIN 
              vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
      )
      SELECT 
          FinalResult.lane_id,
          FinalResult.lane_name,
          FinalResult.lane_code,
          FinalResult.lane_status,
          FinalResult.vidiotron_notif_id,
          FinalResult.nomorlambung,
          FinalResult.flag,
          FinalResult.lane_number,
          FinalResult.is_dynamic,  -- Ambil is_dynamic dari FinalResult
          FinalResult.max_value,   -- Ambil max_value dari FinalResult
          vn.*                     -- Ambil semua kolom dari vidiotron_notif
      FROM 
          FinalResult
      LEFT JOIN 
          vidiotron_notif vn ON FinalResult.vidiotron_notif_id = vn.vidiotron_notif_id
      ORDER BY 
          FinalResult.lane_name;
      `,
      );

      const transformedData = result
        .map((entry) => {
          if (
            entry.command &&
            entry.command.length >= 6 &&
            entry.is_dynamic === true
          ) {
            const commands = entry.command;

            return {
              lane_name: entry.lane_name,
              lane_id: entry.lane_id,
              data: [
                {
                  header: commands[0].text, // First command text as header
                  body_description: [
                    commands[1].text,
                    commands[2].text,
                    commands[3].text,
                  ].join(' '), // Concatenate body description
                  type_truck_description: commands[4].text, // Truck type description
                  total_description: commands[5].text, // Total description
                },
              ],
            };
          }
          if (entry.command && entry.is_dynamic === false) {
            const commands = entry.command;
            if (entry.max_value === 1) {
              return {
                lane_name: entry.lane_name,
                lane_id: entry.lane_id,
                data: [
                  {
                    header: commands[0].text, // First command text as header
                    body_description: '', // Concatenate body description
                    type_truck_description: commands[1].text, // Truck type description
                    total_description: commands[2].text, // Total description
                  },
                ],
              };
            }
            if (entry.max_value === 2) {
              let total_descriptionKiri = '';
              let total_descriptionKanan = '';
              let headerKiri = commands[0].text;
              let headerKanan = commands[2].text;
              const typeTruckKiri = commands[1].text;
              const typeTruckKanan = commands[3].text;
              if (commands[3].text.includes('OFF')) {
                headerKanan = commands[0].text;
                headerKiri = commands[0].text;
                total_descriptionKanan = '';
                total_descriptionKiri = commands[16] ? commands[16].text : '';
              } else {
                total_descriptionKiri = commands[17] ? commands[17].text : '';
                total_descriptionKanan = commands[16] ? commands[16].text : '';
              }
              return {
                lane_name: entry.lane_name,
                lane_id: entry.lane_id,
                lane_code: entry.lane_code,
                status: entry.status,
                data: [
                  {
                    header: headerKiri, // First command text as header
                    body_description: '', // Concatenate body description
                    type_truck_description: typeTruckKiri,
                    total_description: total_descriptionKiri,
                  },
                  {
                    header: headerKanan, // First command text as header
                    body_description: '', // Concatenate body description
                    type_truck_description: typeTruckKanan,
                    total_description: total_descriptionKanan,
                  },
                ],
              };
            }
          }
          // Return null or an empty object if no commands or less than 6 commands are found
          return {
            lane_name: entry.lane_name,
            lane_id: entry.lane_id,
            data: [],
          };
        })
        .filter(Boolean); // Filter out null or undefined values
      // Filter out null results if necessary

      return transformedData;

      // const processedResult = result.map((row) => {
      //   let lineTemplate = row.command;
      //   if (row.nomorlambung === "STATIC") {
      //     // Jika STATIC, buat dua objek dalam array
      //     return [
      //       {
      //         line_id: row.lane_id,
      //         tipe: "text",
      //         text: row.lane_name,
      //         additional_data: lineTemplate.filter((line) => line.line_id <= 6),
      //       },
      //       {
      //         line_id: row.lane_id + 1,
      //         tipe: "text",
      //         text: row.lane_code,
      //         additional_data: lineTemplate.filter((line) => line.line_id <= 6),
      //       },
      //     ];
      //   } else {
      //     // Jika dinamis
      //     const body_description = [
      //       lineTemplate.find((line) => line.line_id === 2)?.text,
      //       lineTemplate.find((line) => line.line_id === 3)?.text,
      //       lineTemplate.find((line) => line.line_id === 4)?.text,
      //     ].join(" ");
      //     const type_truck_description = lineTemplate.find((line) => line.line_id === 5)?.text;
      //     const total_description = lineTemplate.find((line) => line.line_id === 6)?.text;

      //     return {
      //       lane_id: row.lane_id,
      //       body_description,
      //       type_truck_description,
      //       total_description,
      //     };
      //   }
      // });

      // return processedResult

      return {
        statusCode: 200,
        message: 'Success',
        data: result,
      };
    } catch (error: any) {
      this.errHandler.logError('fetchNotifLane error',error);
    }
  }

  async fetchNotifcp(statuses?: boolean[]): Promise<any> {
    try {
      const result: NotifCPResponseDto[] = await this.databaseService.query(
        `SELECT 
            ql.lane_name,
          ql.status, 
            vn.notif_id, 
            vn.notif_type, 
            vn."header", 
            vn.body_description, 
            vn.total_description,
            vn.type_truck_description, 
            vn.command, 
            vn.vidiotron_id 
        FROM queue_lane ql 
        LEFT JOIN (
            SELECT 
                vidiotron_notif_id AS notif_id, 
                lane_id, 
                notif_type, 
                "header", 
                body_description, 
                total_description, 
                type_truck_description, 
                command, 
                vidiotron_id 
            FROM (
                SELECT 
                    vidiotron_notif_id, 
                    lane_id, 
                    notif_type, 
                    "header", 
                    body_description, 
                    total_description, 
                    type_truck_description, 
                    command, 
                    vidiotron_id, 
                    ROW_NUMBER() OVER (PARTITION BY lane_id ORDER BY created_at DESC) AS row_num 
                FROM vidiotron_notif
                WHERE notif_type = 'CP'
            ) subquery 
            WHERE row_num = 1
        ) vn ON vn.lane_id = ql.id 
        ORDER BY ql.lane_name;`,
      );
      // const result: NotifCPResponseDto[] = await this.databaseService.query(
      //   'select notif_id, c.cp_id, c.cp_name, c.status, vn.notif_type, vn."header", vn.body_description, vn.total_description, vn.type_truck_description, vn.command, vn.vidiotron_id' +
      //     ' from cps c left join (' +
      //     ' SELECT notif_id, cp_id, notif_type, "header", body_description, total_description, type_truck_description, command, vidiotron_id' +
      //     ' FROM (' +
      //     '    SELECT vidiotron_notif_id as notif_id, cp_id, notif_type, "header", body_description, total_description, type_truck_description, command, vidiotron_id,' +
      //     '           ROW_NUMBER() OVER (PARTITION BY cp_id ORDER by created_at  DESC) AS row_num' +
      //     "    FROM vidiotron_notif where notif_type = 'CP' and status = any($1)" +
      //     ' ) subquery WHERE row_num = 1' +
      //     ' ) vn on vn.cp_id = c.cp_id order by c.cp_name',
      //   [statuses],
      // );

      return {
        statusCode: 200,
        message: 'Success',
        data: result,
      };
    } catch (error: any) {
      this.errHandler.logError('fetchNotifcp error',error);
    }
  }

  async getRecentNotif(): Promise<any> {
    try {
      const notif = await this.QueueVidiotronRepository.findOne({
        order: {
          created_at: 'ASC',
        },
        where: {
          flag: 0,
        },
        relations: ['vidiotron_notif'],
      });

      const {
        created_at,
        auditupdate,
        created_by,
        updated_by,
        vidiotron_notif_id,
        ...result
      } = notif.vidiotron_notif;

      return {
        statusCode: 200,
        message: 'Success',
        data: result,
      };
    } catch (error: any) {
      this.errHandler.logError('getRecentNotif error',error);
    }
  }

  async getVidioTronIdByLaneId(laneId: number): Promise<number> {
    try {
      this.errHandler.logDebug(`find vidiotron for lane with id ${laneId}`);
      const result = await this.databaseService.query(
        'select v.id from vidiotron v join vidiotron_lane vl on vl.vidiotron_id = v.id where vl.lane_id = $1 limit 1',
        [laneId],
      );

      if (result.length === 0) {
        this.errHandler.logDebug(`vidiotron not found for lane with id ${laneId}`);
        return 0;
      }
      this.errHandler.logDebug(`found vidiotron ${result[0].id} for lane ${laneId}`);
      return result[0].id;
    } catch (error: any) {
      this.errHandler.logError('getVidioTronIdByLaneId error',error);
      return 0;
    }
  }

  async getVidioTronIdByCpId(cpId: number): Promise<number> {
    try {
      this.errHandler.logDebug(`find vidiotron for cp with id ${cpId}`);
      const result = await this.databaseService.query(
        'select v.id from vidiotron v join vidiotron_cp vc on vc.vidiotron_id = v.id where vc.cp_id = $1 limit 1',
        [cpId],
      );

      if (result.length === 0) {
        this.errHandler.logDebug(`vidiotron not found for cp with id ${cpId}`);
        return 0;
      }
      this.errHandler.logDebug(`found vidiotron ${result[0].id} for cp ${cpId}`);
      return result[0].id;
    } catch (error: any) {
      this.errHandler.logError('getVidioTronIdByCpId error',error);
      return 0;
    }
  }

  async updateStatusNotif(notifId: number): Promise<void> {
    try {
      await this.vidiotronNotifRepository.update(
        { vidiotron_notif_id: notifId },
        { status: true },
      );
    } catch (error: any) {
      this.errHandler.throwBadRequestError(error,'Ooops Update status notif gagal.');
    }
  }
}
