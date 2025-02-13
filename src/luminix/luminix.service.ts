import { Injectable } from '@nestjs/common';
import { LuminixLoginRequest } from './dto/luminix-login.dto';
import axios, { AxiosResponse } from 'axios';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { NotifCPResponseDto } from '../vidiotron-notif/dto/notif-response.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Vidiotron } from '../vidiotron-notif/entities/vidiotron.entity';
import { Repository } from 'typeorm';
import { Lanes } from '../lane/entities/lane.entity';
import { VideotroNotifMappingService } from '../vidiotron-notif/videotro-notif-mapping.service';
import { Cps } from '../jobs/entities/cps.entity';
import { DatabaseService } from '@utils/database.service';
import { ExternalAuthTokenDto } from './dto/external-auth-token.dto';
import { QueueVidiotron } from 'src/vidiotron-notif/entities/vidiotron-queue.entity';
import { SocketClientService } from 'src/websocket/websocket-client.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class LuminixService {
  constructor(
    private vidiotronNotifService: VidiotronNotifService,
    @InjectRepository(Vidiotron)
    private vidiotronRepository: Repository<Vidiotron>,
    @InjectRepository(Lanes)
    private laneRepository: Repository<Lanes>,
    @InjectRepository(Cps)
    private cpsRepository: Repository<Cps>,
    @InjectRepository(QueueVidiotron)
    private queueVidiotronRepository: Repository<QueueVidiotron>,
    private videotroNotifMappingService: VideotroNotifMappingService,
    private databaseService: DatabaseService,
    private errHandler: ErrorHandlerService,
    private readonly socketClientService: SocketClientService,
  ) {}

  async initNotif(): Promise<void> {
    this.errHandler.logDebug('start init notif luminix');
    await this.sendCPNotif();
    // await this.sendLaneNotif();
    await this.sendNotifCpOff();
    await this.sendNotifLaneOff();
  }

  async sendLaneNotif(): Promise<void> {
    try {
      // const response = await this.vidiotronNotifService.fetchNotifLane([false]);
      // if (response.statusCode == 200) {
      //   const data: NotifLaneResponseDto[] = response.data;

      //   for (const notif of data) {
      //     const startDate = Date.now();
      //     if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
      //       console.info(
      //         `assigned vidiotron not found for lane ${notif.lane_name}`,
      //       );
      //       continue;
      //     }
      //     const vidiotron = await this.vidiotronRepository.findOne({
      //       where: {
      //         id: notif.vidiotron_id,
      //       },
      //     });

      //     if (vidiotron) {
      //       console.info(`response notif lane ${JSON.stringify(notif)}`);
      //       console.info(`send notif fro vidiotron_notif_id ${notif.notif_id}`);
      //       const endDate = Date.now();
      //       await this.createComponent(
      //         notif.command,
      //         vidiotron.ip,
      //         `${endDate - startDate}`,
      //         'sendLaneNotif',
      //       );
      //       await this.vidiotronNotifService.updateStatusNotif(notif.notif_id);
      //     }
      //   }
      // }
      const response = await this.databaseService.query(`
        WITH RankedQueue AS (
            SELECT 
                qv.*,
                ROW_NUMBER() OVER (PARTITION BY qv.lane_id, qv.lane_name ORDER BY qv.id ASC) AS rn
            FROM queue_vidiotron qv
            WHERE qv.flag = 0
              AND qv.nomorlambung != 'STATIC'
        )
        SELECT DISTINCT ON (vn.vidiotron_id)
            rq.lane_id,
            rq.lane_name,
            rq.nomorlambung,
            rq.created_at,
            rq.auditupdate,
            l.status,
            rq.flag,
            vn.*
        FROM RankedQueue rq
        JOIN lanes l on l.id = rq.lane_id
        JOIN vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
        WHERE rq.rn = 1;
        `);
      // const response = await this.databaseService.query(`
      //   WITH RankedQueue AS (
      //         SELECT
      //             qv.*,
      //             ROW_NUMBER() OVER (PARTITION BY qv.lane_id, qv.lane_name ORDER BY qv.id ASC) AS rn
      //         FROM queue_vidiotron qv
      //         WHERE qv.flag = 0
      //         AND qv.nomorlambung != '${VidiotronTypeEnum.STATIC}'
      //     )
      //     SELECT
      //         rq.lane_id,
      //         rq.lane_name,
      //         rq.nomorlambung,
      //         rq.created_at,
      //         rq.auditupdate,
      //         rq.flag,
      //         vn.*
      //     FROM RankedQueue rq
      //     JOIN vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
      //     WHERE rq.rn = 1;
      //   `);
      this.errHandler.logDebug(
        `{ responseLuminix: ${JSON.stringify(response)}}`,
      );
      const tempWsCp = [];
      for (const notif of response) {
        const startDate = Date.now();
        if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
          this.errHandler.logDebug(
            `assigned vidiotron not found for lane ${notif.lane_name} ${notif.lane_id}`,
          );
          continue;
        }
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: notif.vidiotron_id,
          },
        });

        if (vidiotron) {
          this.errHandler.logDebug(
            `response notif lane ${JSON.stringify(notif)}`,
          );
          this.errHandler.logDebug(
            `sendLaneNotif notif to vidiotron_notif_id ${notif.notif_id}`,
          );
          const endDate = Date.now();
          let command = notif.command;
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendLaneNotif',
          );
          this.errHandler.logDebug(
            `{ UpdateStatusVidiotronNotif: ${notif.notif_id} }`,
          );
          await this.vidiotronNotifService.updateStatusNotif(notif.notif_id);

          tempWsCp.push({
            lane_name: notif.lane_name,
            status: notif.status,
            notif_id: notif.vidiotron_notif_id,
            notif_type: notif.notif_type,
            header: notif.header,
            body_description: notif.body_description,
            total_description: notif.total_description,
            type_truck_description: notif.type_truck_description,
            command: notif.command,
          });
        }
      }

      //const socketClient = SocketClientService.getInstance();
      const socketClient = this.socketClientService.getSocket();
      socketClient.emit('vidiotron_cp', {
        last_updated: Date.now(),
        data: tempWsCp,
      });
    } catch (error: any) {
      this.errHandler.logError('Ooops sendLaneNotif Error', error);
    }
  }
  async sendLaneNotifRefresh(): Promise<void> {
    try {
      this.errHandler.logDebug('Process Send Lane Notif Refresh Vidiotron');
      const response = await this.databaseService.query(`
        SELECT * FROM vidiotron_notif WHERE notif_type = 'REFRESH'
        ORDER BY created_at DESC LIMIT 1
        `);
      // const response = await this.databaseService.query(`
      //   WITH RankedQueue AS (
      //         SELECT
      //             qv.*,
      //             ROW_NUMBER() OVER (PARTITION BY qv.lane_id, qv.lane_name ORDER BY qv.id ASC) AS rn
      //         FROM queue_vidiotron qv
      //         WHERE qv.flag = 0
      //         AND qv.nomorlambung != '${VidiotronTypeEnum.STATIC}'
      //     )
      //     SELECT
      //         rq.lane_id,
      //         rq.lane_name,
      //         rq.nomorlambung,
      //         rq.created_at,
      //         rq.auditupdate,
      //         rq.flag,
      //         vn.*
      //     FROM RankedQueue rq
      //     JOIN vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
      //     WHERE rq.rn = 1;
      //   `);
      this.errHandler.logDebug(`{ responseLuminix: ${response}}`);
      for (const notif of response) {
        const startDate = Date.now();
        if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
          this.errHandler.logDebug(
            `assigned vidiotron not found for lane ${notif.lane_name} ${notif.lane_id}`,
          );
          continue;
        }
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: notif.vidiotron_id,
          },
        });

        if (vidiotron) {
          this.errHandler.logDebug(
            `response notif lane ${JSON.stringify(notif)}`,
          );
          this.errHandler.logDebug(
            `sendLaneNotif notif to vidiotron_notif_id ${notif.vidiotron_notif_id}`,
          );
          const endDate = Date.now();
          let command = notif.command;
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendLaneNotif',
          );
          this.errHandler.logDebug(
            `{ UpdateStatusVidiotronNotif: ${notif.vidiotron_notif_id}}`,
          );
          await this.vidiotronNotifService.updateStatusNotif(
            notif.vidiotron_notif_id,
          );
        }
      }
      this.errHandler.logDebug('Done Send Lane Notif Refresh Vidiotron');
    } catch (error: any) {
      this.errHandler.logError(
        'Ooops Send Lane Notif Refresh Vidiotron Error',
        error,
      );
    }
  }
  async sendLaneNotifIdle(): Promise<void> {
    try {
      this.errHandler.logDebug('Process Send Lane Notif Idle Vidiotron');
      const response = await this.databaseService.query(`
        SELECT * FROM vidiotron_notif WHERE notif_type = 'IDLE-LANE'
        ORDER BY created_at DESC LIMIT 1
        `);
      // const response = await this.databaseService.query(`
      //   WITH RankedQueue AS (
      //         SELECT
      //             qv.*,
      //             ROW_NUMBER() OVER (PARTITION BY qv.lane_id, qv.lane_name ORDER BY qv.id ASC) AS rn
      //         FROM queue_vidiotron qv
      //         WHERE qv.flag = 0
      //         AND qv.nomorlambung != '${VidiotronTypeEnum.STATIC}'
      //     )
      //     SELECT
      //         rq.lane_id,
      //         rq.lane_name,
      //         rq.nomorlambung,
      //         rq.created_at,
      //         rq.auditupdate,
      //         rq.flag,
      //         vn.*
      //     FROM RankedQueue rq
      //     JOIN vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
      //     WHERE rq.rn = 1;
      //   `);
      this.errHandler.logDebug(
        `{ responseLuminixIdle: ${JSON.stringify(response)}}`,
      );
      for (const notif of response) {
        const startDate = Date.now();
        if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
          this.errHandler.logDebug(
            `assigned vidiotron not found for lane ${notif.lane_name} ${notif.lane_id}`,
          );
          continue;
        }
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: notif.vidiotron_id,
          },
        });

        if (vidiotron) {
          console.info(`response notif lane idle ${JSON.stringify(notif)}`);
          console.info(
            `sendLaneNotifIdle notif to vidiotron_notif_id ${notif.vidiotron_notif_id}`,
          );
          const endDate = Date.now();
          let command = notif.command;
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendLaneNotif',
          );
          this.errHandler.logDebug(
            `{ UpdateStatusVidiotronNotif: ${notif.vidiotron_notif_id} }`,
          );
          await this.vidiotronNotifService.updateStatusNotif(
            notif.vidiotron_notif_id,
          );
        }
      }
      this.errHandler.logDebug('Done Send Lane Notif Idle Vidiotron');
    } catch (error: any) {
      this.errHandler.logError(
        'Ooops Send Lane Notif Idle Vidiotron Error',
        error,
      );
    }
  }
  async sendLaneNotifStatic(): Promise<void> {
    try {
      const response = await this.databaseService.query(`
        SELECT *, l.id lane_id, l.lane_code, l.lane_name, l.status, v.max_value, qv.vidiotron_notif_id notif_id FROM queue_vidiotron qv 
          LEFT JOIN lanes l ON l.id = qv.lane_id
          JOIN vidiotron_notif vn ON vn.vidiotron_notif_id = qv.vidiotron_notif_id
          JOIN vidiotron v ON v.id = vn.vidiotron_id 
        WHERE nomorlambung = 'STATIC' AND flag = 0;
        `);
      this.errHandler.logDebug(
        `{ responseLuminix: ${JSON.stringify(response)}}`,
      );
      const tempWsSb = [];
      // const tempWsCp = []
      for (const notif of response) {
        const startDate = Date.now();
        if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
          this.errHandler.logDebug(
            `assigned vidiotron not found for lane ${notif.lane_name} ${notif.lane_id}`,
          );
          continue;
        }
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: notif.vidiotron_id,
          },
        });

        if (vidiotron) {
          this.errHandler.logDebug(
            `response notif lane ${JSON.stringify(notif)}`,
          );
          this.errHandler.logDebug(
            `sendLaneNotifStatic notif to vidiotron_notif_id ${notif.notif_id}`,
          );
          const endDate = Date.now();
          let command = notif.command;
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendLaneNotif',
          );
          this.errHandler.logDebug(
            `{ UpdateStatusVidiotronNotif: ${notif.vidiotron_notif_id}}`,
          );
          await this.vidiotronNotifService.updateStatusNotif(
            notif.vidiotron_notif_id,
          );
          await this.databaseService.query(`
            UPDATE queue_vidiotron SET flag = 1 WHERE vidiotron_notif_id = ${notif.vidiotron_notif_id}
          `);

          // const commandNotifMap = await this.commandNotifMapping(notif);

          // if (commandNotifMap != null) {
          //   tempWsSb.push(commandNotifMap);
          // }
          // tempWsCp.push({
          //   lane_name: notif.lane_name,
          //   status: notif.status,
          //   notif_id: notif.vidiotron_notif_id,
          //   notif_type: notif.notif_type,
          //   header: notif.header,
          //   body_description: notif.body_description,
          //   total_description: notif.total_description,
          //   type_truck_description: notif.type_truck_description,
          //   command: notif.command
          // })
        }
        const getResponseVidiotron = await this.databaseService
          .query(`WITH RankedQueue AS (
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
                  rq.is_dynamic,
                  rq.max_value
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
              FinalResult.is_dynamic,
              FinalResult.max_value,
              vn.*
          FROM 
              FinalResult
          LEFT JOIN 
              vidiotron_notif vn ON FinalResult.vidiotron_notif_id = vn.vidiotron_notif_id
          ORDER BY 
              FinalResult.lane_name;
          `);
        this.errHandler.logDebug(
          `{ responseVidiotronSB: ${JSON.stringify(response)}}`,
        );
        for (const resVtron of getResponseVidiotron) {
          const commandNotifMap = await this.commandNotifMapping(resVtron);
          if (commandNotifMap != null) {
            tempWsSb.push(commandNotifMap);
          }
        }
        //const socketClient = SocketClientService.getInstance();
        const socketClient = this.socketClientService.getSocket();

        this.errHandler.logDebug(`"WEBSOCKET VIDIOTRON SB",${tempWsSb.length}`);
        // console.log("WEBSOCKET VIDIOTRON CP",tempWsCp.length);
        if (tempWsSb.length > 0) {
          socketClient.emit('vidiotron_sb', {
            last_updated: Date.now(),
            data: tempWsSb,
          });
        }

        // if (tempWsCp.length > 0) {
        //   socketClient.emit("vidiotron_cp", {
        //     vidiotron_cp: tempWsCp
        //   })
        // }
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops sendLaneNotifStatic Error ', error);
    }
  }
  async commandNotifMapping(entry: any): Promise<any> {
    try {
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
            this.errHandler.logDebug(`{commandsvtorn15: ${commands[15].text}}`);
            this.errHandler.logDebug(`{commandsvtron17: ${commands[17].text}}`);
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
        return commands;
      }
    } catch (err: any) {}
  }
  async sendLaneStaticNotif(): Promise<void> {
    try {
      // const response = await this.vidiotronNotifService.fetchNotifLane([false]);
      // if (response.statusCode == 200) {
      //   const data: NotifLaneResponseDto[] = response.data;

      //   for (const notif of data) {
      //     const startDate = Date.now();
      //     if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
      //       console.info(
      //         `assigned vidiotron not found for lane ${notif.lane_name}`,
      //       );
      //       continue;
      //     }
      //     const vidiotron = await this.vidiotronRepository.findOne({
      //       where: {
      //         id: notif.vidiotron_id,
      //       },
      //     });

      //     if (vidiotron) {
      //       console.info(`response notif lane ${JSON.stringify(notif)}`);
      //       console.info(`send notif fro vidiotron_notif_id ${notif.notif_id}`);
      //       const endDate = Date.now();
      //       await this.createComponent(
      //         notif.command,
      //         vidiotron.ip,
      //         `${endDate - startDate}`,
      //         'sendLaneNotif',
      //       );
      //       await this.vidiotronNotifService.updateStatusNotif(notif.notif_id);
      //     }
      //   }
      // }
      const response = await this.databaseService.query(`
        WITH RankedQueue AS (
              SELECT 
                  qv.*,
                  ROW_NUMBER() OVER (PARTITION BY qv.lane_id, qv.lane_name ORDER BY qv.id ASC) AS rn
              FROM queue_vidiotron qv
              WHERE qv.flag = 0
          )
          SELECT 
              rq.lane_id,
              rq.lane_name,
              rq.nomorlambung,
              rq.created_at,
              rq.auditupdate,
              rq.flag,
              vn.*
          FROM RankedQueue rq
          JOIN vidiotron_notif vn ON rq.vidiotron_notif_id = vn.vidiotron_notif_id
          WHERE rq.rn = 1;
        `);
      this.errHandler.logDebug(
        `{ responseLuminix: ${JSON.stringify(response)}}`,
      );
      for (const notif of response) {
        const startDate = Date.now();
        if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
          this.errHandler.logDebug(
            `assigned vidiotron not found for lane ${notif.lane_name} ${notif.lane_id}`,
          );
          continue;
        }
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: notif.vidiotron_id,
          },
        });

        if (vidiotron) {
          this.errHandler.logDebug(
            `response notif lane ${JSON.stringify(notif)}`,
          );
          this.errHandler.logDebug(
            `sendLaneStaticNotif notif to vidiotron_notif_id ${notif.notif_id}`,
          );
          const endDate = Date.now();
          let command = notif.command;
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendLaneNotif',
          );
          await this.vidiotronNotifService.updateStatusNotif(notif.notif_id);
        }
      }
      // if (response) {
      //   const data: N[] = response.data;

      //   for (const notif of data) {
      //     const startDate = Date.now();
      //     if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
      //       console.info(
      //         `assigned vidiotron not found for lane ${notif.lane_name}`,
      //       );
      //       continue;
      //     }
      //     const vidiotron = await this.vidiotronRepository.findOne({
      //       where: {
      //         id: notif.vidiotron_id,
      //       },
      //     });

      //     if (vidiotron) {
      //       console.info(`response notif lane ${JSON.stringify(notif)}`);
      //       console.info(`send notif fro vidiotron_notif_id ${notif.notif_id}`);
      //       const endDate = Date.now();
      //       await this.createComponent(
      //         notif.command,
      //         vidiotron.ip,
      //         `${endDate - startDate}`,
      //         'sendLaneNotif',
      //       );
      //       await this.vidiotronNotifService.updateStatusNotif(notif.notif_id);
      //     }
      //   }
      // }
    } catch (error: any) {
      this.errHandler.logError('Oops sendLaneStaticNotif Error:', error);
    }
  }

  public async sendCPNotif(): Promise<void> {
    try {
      const response = await this.vidiotronNotifService.fetchNotifcp([false]);
      if (response.statusCode == 200) {
        const data: NotifCPResponseDto[] = response.data;

        for (const notif of data) {
          const startDate = Date.now();
          if (notif.vidiotron_id == null || notif.vidiotron_id == 0) {
            this.errHandler.logDebug(
              `assigned vidiotron not found for cp ${notif.cp_name}`,
            );
            continue;
          }
          const vidiotron = await this.vidiotronRepository.findOne({
            where: {
              id: notif.vidiotron_id,
            },
          });

          if (vidiotron) {
            this.errHandler.logDebug(
              `response notif cp ${JSON.stringify(notif)}`,
            );
            this.errHandler.logDebug(
              `send notif for cp vidiotron_notif_id ${notif.notif_id}`,
            );

            const endDate = Date.now();
            let command = notif.command;
            if (vidiotron.is_show_ads && vidiotron.ads_command) {
              command = vidiotron.ads_command;
            }
            await this.createComponent(
              command,
              vidiotron.ip,
              `${endDate - startDate}`,
              'sendCPNotif',
            );
            await this.vidiotronNotifService.updateStatusNotif(notif.notif_id);
          }
        }

        //const socketClient = SocketClientService.getInstance();
        const socketClient = this.socketClientService.getSocket();
        socketClient.emit('vidiotron_cp', {
          last_updated: Date.now(),
          data: response.data,
        });
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops updateStatusNotif error : ', error);
    }
  }

  async sendNotifLaneOff() {
    try {
      const lanesOff = await this.databaseService.query(`
        SELECT vcl.vidiotron_id AS id, ql.lane_name
        FROM queue_lane ql
        JOIN vidiotron_config_lane vcl ON vcl.queue_lane_id = ql.id
        WHERE ql."status" = FALSE
        `);

      for (const lane of lanesOff) {
        const startDate = Date.now();
        let command =
          await this.videotroNotifMappingService.getNotificationQueueCPLaneOff(
            lane.lane_name,
          );
        // const vidiotronId =
        //   await this.vidiotronNotifService.getVidioTronIdByLaneId(lane.id);
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: lane.id,
          },
        });
        const endDate = Date.now();

        //const socketClient = SocketClientService.getInstance();
        const socketClient = this.socketClientService.getSocket();
        socketClient.emit('vidiotron_sb', {
          last_updated: Date.now(),
          data: [
            await this.commandNotifMapping(
              Object.assign(
                {
                  command: command,
                  is_dynamic: true,
                  max_value: vidiotron.max_value,
                },
                lane,
              ),
            ),
          ],
        });

        if (vidiotron.is_show_ads && vidiotron.ads_command) {
          command = vidiotron.ads_command;
        }
        await this.createComponent(
          command,
          vidiotron.ip,
          `${(endDate - startDate) / 1000}`,
          'sendNotifLaneOff',
        );
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops sendNotifLaneOff error : ', error);
    }
  }

  async sendNotifCpOff() {
    try {
      const cpsOff = await this.cpsRepository.find({
        where: {
          status: false,
        },
      });

      for (const cp of cpsOff) {
        const startDate = Date.now();
        let command =
          this.videotroNotifMappingService.getNotificationQueueCPLaneOff(
            cp.cp_name,
          );
        const vidiotronId =
          await this.vidiotronNotifService.getVidioTronIdByCpId(cp.cp_id);
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: vidiotronId,
          },
        });

        // get vidiotron notif for websocket listen
        if (vidiotron && vidiotron !== undefined) {
          const endDate = Date.now();
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendNotifCpOff',
          );
        }
      }
    } catch (error: any) {
      this.errHandler.throwBadRequestError(error, 'Ooops sendNotifCpOff Error');
    }
  }

  async sendRecentNotif(): Promise<any> {
    try {
      const startDate = Date.now();
      const response = await this.vidiotronNotifService.getRecentNotif();
      if (response.statusCode == 200) {
        const notif = response.data;
        const vidiotron = await this.vidiotronRepository.findOne({
          where: {
            id: notif.vidiotron_id,
          },
        });

        if (vidiotron) {
          const endDate = Date.now();
          let command = notif.command;
          if (vidiotron.is_show_ads && vidiotron.ads_command) {
            command = vidiotron.ads_command;
          }
          await this.createComponent(
            command,
            vidiotron.ip,
            `${endDate - startDate}`,
            'sendRecentNotif',
          );
          return {
            statusCode: 200,
            message: 'Success',
            data: response.data,
          };
        } else {
          return { statusCode: 400, message: 'Vidiotron not found' };
        }
      }
    } catch (error: any) {
      this.errHandler.throwBadRequestError(error, `Ooops Failed to send notif`);
    }
  }

  async createComponent(
    payload: any,
    ip: string,
    proccesDuration: string,
    type: string,
  ): Promise<void> {
    try {
      const requestUrl = ip.startsWith('http')
        ? `${ip}/components`
        : `http://${ip}/components`;

      // TODO: Remove
      const startDate = Date.now();
      const response = await this.postComponentLuminix(
        requestUrl,
        payload,
        ip,
      ).catch(async (err) => {
        if (err.response?.status === 403) {
          await this.saveLuminixAuthToken(ip);
          return this.postComponentLuminix(requestUrl, payload, ip);
        }
        throw err;
      });

      // TODO REMOVE
      const endDate = Date.now();
      const duration = (endDate - startDate) / 1000;

      this.errHandler.logDebug(
        `Type: ${type}; Videotron: ${ip}; Videotron Duration: ${duration}; App Duration: ${proccesDuration}`,
      );
      // TODO: End Remove

      this.errHandler.logDebug(
        `Component created with data: ${JSON.stringify(response.data)}`,
      );
    } catch (error: any) {
      this.errHandler.logError('Ooops createComponent error', error);
    }
  }

  async generateLuminixToken(): Promise<void> {
    try {
      this.errHandler.logDebug('start generate luminix token');
      const vidiotrons = await this.vidiotronRepository.findBy({
        status: true,
      });
      for (const vidiotron of vidiotrons) {
        await this.saveLuminixAuthToken(vidiotron.ip);
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops failed to get luminix token', error);
    }
  }

  async getLuminixToken(ip: string): Promise<string> {
    try {
      const responses: ExternalAuthTokenDto[] =
        await this.databaseService.query(
          'select code, auth_token, expired_at from external_api_token where code=$1 and host=$2' +
            ' order by created_at desc limit 1',
          ['VIDIOTRON', ip],
        );
      if (responses.length > 0) {
        const response = responses[0];
        if (response.expired_at != null) {
          if (response.expired_at > new Date()) {
            return response.auth_token;
          }
        } else {
          return response.auth_token;
        }
      }
    } catch (error: any) {
      this.errHandler.logError('Ooops failed to get luminix token', error);
    }
  }

  async saveLuminixAuthToken(ip: string) {
    try {
      const requestUrl = ip.startsWith('http')
        ? `${ip}/login`
        : `http://${ip}/login`;

      const request: LuminixLoginRequest = {
        userId: 'adminvms',
        password: 'adminVMS123',
      };

      const header = {
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const response = await axios.post(`${requestUrl}`, request, header);

      const token = response.data.token;
      if (token == null) {
        this.errHandler.logDebug('failed to generate token');
      }
      this.errHandler.logDebug(`token generated for ${ip}`);
      await this.databaseService.query(
        'insert into external_api_token (code, host, auth_token, auditupdate) values($1, $2, $3, $4)' +
          'ON CONFLICT (code, host) ' +
          'DO UPDATE SET ' +
          'auditupdate = EXCLUDED.auditupdate, ' +
          'expired_at = EXCLUDED.expired_at, ' +
          'auth_token = EXCLUDED.auth_token',
        ['VIDIOTRON', ip, token, new Date()],
      );

      await this.saveLogApi(
        ip,
        requestUrl,
        JSON.stringify(header),
        JSON.stringify(request),
        JSON.stringify(response.data),
        response.status,
      );
    } catch (error: any) {
      this.errHandler.logError('Ooops failed to get luminix token', error);
    }
  }

  async postComponentLuminix(
    requestUrl: string,
    payload: any,
    ip: string,
  ): Promise<AxiosResponse<any, any>> {
    const request = {
      data: `${JSON.stringify(payload)}`,
    };

    const header = {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${await this.getLuminixToken(ip)}`,
      },
    };
    const response = await axios.post(requestUrl, request, header);

    await this.saveLogApi(
      ip,
      requestUrl,
      JSON.stringify(header),
      JSON.stringify(request),
      JSON.stringify(response.data),
      response.status,
    );
    return response;
  }

  async saveLogApi(
    host: string,
    url: string,
    header: string,
    request: any,
    response: any,
    statusCode: number,
  ): Promise<void> {
    try {
      await this.databaseService.query(
        'insert into external_api_log("host", url, "header", "request", response, status_code) values($1, $2, $3, $4, $5, $6)',
        [host, url, header, request, response, statusCode],
      );
      this.errHandler.logDebug(`save api log for url ${url}`);
    } catch (error: any) {
      this.errHandler.logError('Ooops failed to insert api log, error', error);
    }
  }
}
