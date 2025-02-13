import { Injectable } from '@nestjs/common';
import { VidiotronNotifService } from '../vidiotron-notif/vidiotron-notif.service';
import { QueryLoaderService } from '@utils/query-loader.service';
import { VideoTronNotifDto } from 'src/jobs/dto/video-tron-notif.dto';
import { VidiotronService } from './vidiotron.service';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Injectable()
export class VideotroNotifMappingService {
  private queryLoader = new QueryLoaderService('queries.sql');
  constructor(
    private vidioTronNotifToDBService: VidiotronNotifService,
    private vidiotronService: VidiotronService,
    private errHandler: ErrorHandlerService,
  ) {}
  static AVAILABLE = '#FFFFFF';
  static FULL = '#ff0000';
  static ALMOST_FULL = '#DC6803';

  static TYPE_OF_NOTIF_LANE = 'LANE';
  static TYPE_OF_NOTIF_CP = 'CP';

  async sendNotificationLaneQueueToCp(
    lane: string,
    cpName: string,
    noLambung: string,
    truckType: string,
    maxQueue: number,
    currentQueue: number,
    laneId: number,
    cpId: number,
  ) {
    const vidiotron_id =
      await this.vidioTronNotifToDBService.getVidioTronIdByCpId(cpId);
    const saveNotif = {
      header: lane,
      body: `${noLambung} >>> ${cpName}`,
      typeTruck: `(${truckType})`,
      total: `(${currentQueue}/${maxQueue})`,
      cpId: cpId,
      laneId: laneId,
      status: false,
      type: VideotroNotifMappingService.TYPE_OF_NOTIF_CP,
      command: this.getCommandNotificationLaneQueueToCp(
        lane,
        noLambung,
        cpName,
        truckType,
        maxQueue,
        currentQueue,
      ),
      vidiotron_id: vidiotron_id,
    };
    await this.vidioTronNotifToDBService.saveNotif(saveNotif);
    this.errHandler.logDebug(`send notification ${JSON.stringify(saveNotif.command)}`);
  }

  async sendNotificationSimpangBayahToLane(
    lane: string,
    noLambung: string,
    truckType: string,
    maxQueue: number,
    currentQueue: number,
    laneId: number,
  ) {
    const vidiotron_id =
      await this.vidioTronNotifToDBService.getVidioTronIdByLaneId(laneId);
    const vidiotron =
      await this.vidiotronService.getVidiotronById(vidiotron_id);
    let command: VideoTronNotifDto[] = [];
    if (vidiotron && vidiotron.is_dynamic) {
      command = this.getNotificationSimpangBayahToLane(
        lane,
        noLambung,
        truckType,
        currentQueue,
        maxQueue,
      );
    } else {
      command = this.getNotificationSimpangBayahToLaneStatic(
        lane,
        truckType,
        currentQueue,
        maxQueue,
      );
    }
    const saveNotif = {
      header: lane,
      body: `${noLambung} >>> ${lane}`,
      typeTruck: `(${truckType})`,
      total: `(${currentQueue}/${maxQueue})`,
      cpId: null,
      laneId: laneId,
      status: false,
      type: VideotroNotifMappingService.TYPE_OF_NOTIF_LANE,
      command: command,
      vidiotron_id: vidiotron_id,
    };

    this.errHandler.logDebug(`{ insertNotifVidiotron: 'Insert Vidiotron Notif' }`);

    await this.vidioTronNotifToDBService.saveNotif(saveNotif, 'SIMPANG BAYAH');

    this.errHandler.logDebug(`send notification ${JSON.stringify(saveNotif.command)}`);
  }

  async sendNotificationSimpangBayahToLaneStatic(
    lane: string,
    truckType: string,
    maxQueue: number,
    currentQueue: number,
    laneId: number,
  ) {
    const vidiotron_id =
      await this.vidioTronNotifToDBService.getVidioTronIdByLaneId(laneId);
    const saveNotif = {
      header: lane,
      typeTruck: `(${truckType})`,
      total: `(${currentQueue}/${maxQueue})`,
      cpId: null,
      laneId: laneId,
      status: false,
      type: VideotroNotifMappingService.TYPE_OF_NOTIF_LANE,
      command: this.getNotificationSimpangBayahToLaneStatic(
        lane,
        truckType,
        currentQueue,
        maxQueue,
      ),
      vidiotron_id: vidiotron_id,
    };

    await this.vidioTronNotifToDBService.saveNotif(saveNotif);
    this.errHandler.logDebug(`send notification ${JSON.stringify(saveNotif.command)}`);
  }

  getNotificationQueueCPLaneOff(laneOrCp: string): VideoTronNotifDto[] {
    const notifConfig: VideoTronNotifDto[] = [];
    notifConfig.push({
      line_id: 1,
      tipe: 'image',
      text: '',
      pos_x: 172,
      pos_y: 68,
      absolute: true,
      align: 'center',
      size: 40,
      color: '#ff0000',
      speed: 0,
      image:
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAABQCAMAAAC5zwKfAAABVlBMVEXlOTUAAAD6+vrvmZflOTTkOTTlODXlOTXkODXlOTXkOTTlODXlOTXmOTTkOTXkOTXmOTXkNzflOTXlOTXlOTXmOTXlOTTjODX/AAD58PDmMzPMMzPlODPlODXlOTXlOTXlOTXkODTlOTXlOTXnOTb/MzPlOTXmOTXlOTXlOjXmOjXlOjXkOTXgMzPkODLkODTlOTXmMzPqaWbjODXoNjblNzTlODXkOTXhNTblPjXMMzPjODPkNjbnOTXnODDlODXjNzflOTXjOTXmOTbqNTXpYF3bNzfMMxr46uriNDTYJyfmODXlOjbhOTLpW1f/MzPyMzPlOTX/QEDfQDXhODTpNzflOzPjOjXkOTXrOzveOjHjOTnqQDXoODPrPTPmODXkNy7lOTTnODTiOjPjOzPfODjpNjbmOTTpOjfoODjkOTblOjbkNzTiNzTmOzbpOTXmOjXmOjRcYS87AAAAcnRSTlP/AP//+N3r5F/o0/78sIba/BzA76a12lIB/woFaFffqMS11ZlRCmOyz9jda64ZYZXsFP+kIV1NiyEdCmQTYCDiLpNcihj/HAr/LA3Mm0z/BRS4BBg7Fx5uQw0fCRg3GawcMUkjZCAvyEY3TMNUT2Q6XFOw8Mk5AAACj0lEQVR4nO3YV1fbMBQH8Evq7AlJWCEhCZAQklKgbCiU0r333nvQ9f1fWmgiS7It6+qah3L4P+pEvxMf2ZLuhb6AcwwePnj1xcZKdSZi5XJWpD6wM3v/EgXcbDfjICVafH/SEBxKJ2Wtm1ff8eB6u+WhHSTcKOHApUEVd0BOIsArRT9uP8UPumAsr+MBbP/QAtdP6XH7uT7lD96b1vcApvv9wK0ZjPd3bVbV4GoU5wFUnqrA1xWsB9ASPxwBnPJ9+9zybdQTnDDxAHa9wEdmHsAvd3ArYgrm37mCA6YeQNoNPGfuAew5wZLRCvdyja00A9sUD+CMDN4K08CsDO7RPIAbElijgqdF8CXVg9y8AI6Rwd6ydEGtQ0SdJg8+Q2+DzsR58CcbXjiBzAKbepYDZ9noSAiZy2zqBgfusFGsFwqxqRkOtDcaAjjOgfY9hgDWOXAuCDDCgVYQoMWB9kWQAKY4MBUEmDvMR7bPu4AWxb4hEcBE0C92gQN3g/70GmwUvTmMsKkxDvzCRi9gt6+bbCq/fT1xFEz4RIUjoEMHa0EfUr8FcN6rrNOOdV486NNUUDro+yap4Fv59pWleeGew0DSfbP3VvPgaILiJe46r8RlCviYMdylvWnu/TtBZfCiZpnsTHTNvfCJGXpJtiJyaYYovflM8IZYjVZNvE/D3uBzg1qgJRb1UgH+cBvrVRZFQW4RLCL/Y3ZTAhxNjH5UE+NOd9NStVmGEWX4irAeno2gMc3COe/WrXJtVa1pbbcFR89G0Uxb9t17ql/dZ3q1+0pLyuUeHHI2qXwbkssd+5YnJFn47D1L2TJ9UK45Sqx4p3xbNce3S/wmlhmvz1mplBVPFDKNj36////72EcQ/AOXyTgYtl+9lwAAAABJRU5ErkJggg==',
      padding: 0,
      line_height: 1.2,
      width: 30,
      font: 0,
      style: 'normal',
    });

    notifConfig.push({
      line_id: 2,
      tipe: 'text',
      text: `${laneOrCp} - OFF`,
      pos_x: 144,
      pos_y: 109,
      absolute: true,
      align: 'center',
      size: 22,
      color: '#ff0000',
      speed: 0,
      image: '',
      padding: 0,
      line_height: 1.2,
      width: 0,
      font: 0,
      style: 'bold',
    });

    this.errHandler.logDebug(
      `send notification ${JSON.stringify(notifConfig)}`,
    );
    return notifConfig;
  }

  getCommandNotificationLaneQueueToCp(
    lane: string,
    noLambung: string,
    cpName: string,
    truckType: string,
    maxQueue: number,
    currentQueue: number,
  ) {
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

    notifConfig.push({
      line_id: 5,
      tipe: 'text',
      text: `(${truckType})`,
      pos_x: 163,
      pos_y: 147,
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

    let color = VideotroNotifMappingService.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = VideotroNotifMappingService.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = VideotroNotifMappingService.ALMOST_FULL;
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

  getNotificationSimpangBayahToLane(
    lane: string,
    noLambung: string,
    truckType: string,
    currentQueue: number,
    maxQueue: number,
  ): VideoTronNotifDto[] {
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
      text: lane,
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

    notifConfig.push({
      line_id: 5,
      tipe: 'text',
      text: `(${truckType})`,
      pos_x: 163,
      pos_y: 147,
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

    let color = VideotroNotifMappingService.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = VideotroNotifMappingService.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = VideotroNotifMappingService.ALMOST_FULL;
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

  getNotificationSimpangBayahToLaneStatic(
    lane: string,
    truckType: string,
    currentQueue: number,
    maxQueue: number,
  ): VideoTronNotifDto[] {
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
      text: `(${truckType})`,
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

    let color = VideotroNotifMappingService.AVAILABLE;
    if (currentQueue >= maxQueue) {
      color = VideotroNotifMappingService.FULL;
    } else if (maxQueue - currentQueue <= 5) {
      color = VideotroNotifMappingService.ALMOST_FULL;
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
