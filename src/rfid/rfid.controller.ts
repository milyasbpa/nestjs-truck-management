import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RfidService } from './rfid.service';
import {
  archiveDataDTO,
  detailRfidTransactionDTO,
  DtCountLocationDTO,
  getThresholdDTO,
  listAnomalyDTO,
  listRfidTransactionDTO,
  removeAnomaliesDTO,
  removeListTransactionWithouRfidOutDTO,
  rfidAnomalyDTO,
  RfidCheckTruckOutIn,
  RfidCpQueueDTO,
  RfidNotifIn,
  RfidNotifOut,
  rfidUpdateAnomalyQueryDTO,
  updateThresholdDTO,
} from './dto/rfid-notif';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { SocketClientService } from 'src/websocket/websocket-client.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { error } from 'console';

@Controller('rfid')
export class RfidController {
  constructor(
    private readonly rfidService: RfidService,
    private readonly errHandler: ErrorHandlerService,
    private readonly socketClientService: SocketClientService,
  ) {}

  @Post('notify-in')
  async notifFromRfidIn(@Body() request: RfidNotifIn): Promise<any> {
    try {
      return this.rfidService.notifFromRfidIn(request);
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops notifFromRfidIn error.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('truck-check')
  async CheckTruckInOut(@Query() request: RfidCheckTruckOutIn): Promise<any> {
    try {
      return await this.rfidService.checkTruckOutIn(
        request.nomor_lambung,
        request.date_truck,
      );
    } catch (err: any) {
      this.errHandler.throwBadRequestError(error, 'Ooops Check truck in error');
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Post('notify-out')
  async notifFromRfidOut(@Body() request: RfidNotifOut): Promise<any> {
    try {
      const returnNotifOut = await this.rfidService.notifFromRfidOut(request);
      //this flow already included in notifFromRfidOut function on new adjustment
      // await this.laneService.removeTruckFromCP(
      //   returnNotifOut.responseData.nomor_lambung,
      // );
      return returnNotifOut.responseHttp;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(
        err,
        'Ooops notifFromRfidOut error.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status-list')
  async rfidStatusList(): Promise<any> {
    try {
      const data = await this.rfidService.rfidStatusList();
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops rfidStatusList error.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list-rfid-transaction')
  async listRfidTransaction(
    @Query() request: listRfidTransactionDTO,
  ): Promise<any> {
    try {
      const data = await this.rfidService.listRfidTransaction(request);
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(
        err,
        'Ooops listRfidTransaction error.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('detail-rfid-transaction')
  async detailRfidTransaction(
    @Query() request: detailRfidTransactionDTO,
  ): Promise<any> {
    try {
      const data = await this.rfidService.detailRfidTranaction(request);
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(
        err,
        'Ooops detailRfidTransaction error.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('export-list-rfid-transaction')
  async exportListRfidTransaction(
    @Res() res: Response,
    @Query() request: listRfidTransactionDTO,
  ): Promise<any> {
    try {
      const data = await this.rfidService.exportListRfidTransaction(
        res,
        request,
      );
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(
        err,
        'Ooops exportListRfidTransaction error.',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove-list-transaction-without-rfidout')
  async removeListTransactionWithouRfidOut(
    @Query() request: removeListTransactionWithouRfidOutDTO,
  ): Promise<any> {
    try {
      const data =
        await this.rfidService.removeListTransactionWithouRfidOut(request);
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(
        err,
        'Ooops removeListTransactionWithouRfidOut error.',
      );
    }
  }

  @Post('create-anomaly')
  async createAnomaly(@Body() data: rfidAnomalyDTO): Promise<any> {
    try {
      await this.rfidService.createAnomaly(data);
      return {
        success: true,
      };
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops createAnomaly error.');
    }
  }

  @Get('test-ws')
  async testws(): Promise<any> {
    try {
      //const socketClient = SocketClientService.getInstance();
      const socketClient = this.socketClientService.getSocket();
      await socketClient.emit('queue-cp-videotron', {});
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops testws error.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-threshold')
  async updateThreshold(@Body() data: updateThresholdDTO): Promise<any> {
    try {
      await this.rfidService.updateThreshold(data);
      return {
        success: true,
      };
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops updateThreshold error.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-threshold')
  async getThreshold(@Query() q: getThresholdDTO): Promise<any> {
    try {
      const [data, total] = await this.rfidService.getThreshold(q.page, q.size);

      return {
        data: data,
        total: total,
        page: q.page,
        totalPages: Math.ceil(total / q.size),
      };
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops getThreshold error.');
    }
  }

  @Put('update-anomaly')
  async updateAnomaly(
    @Query() query: rfidUpdateAnomalyQueryDTO,
    @Body() data: rfidAnomalyDTO,
  ): Promise<any> {
    try {
      await this.rfidService.updateAnomaly(query.id, data);
      return {
        success: true,
      };
    } catch (err: any) {
      this.errHandler.throwBadRequestError(error, 'Ooops updateAnomaly Error');
    }
  }

  @Post('cron-job-anomaly')
  async cronJobAnomaly(): Promise<any> {
    try {
      await this.rfidService.cronJobAnomalyValidation();
      return {
        success: true,
      };
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops cronJobAnomaly error.');
    }
  }

  @Get('dt-count-location')
  async dtCountLocation(@Query() request: DtCountLocationDTO): Promise<any> {
    try {
      return await this.rfidService.dtCountLocation(request);
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops dtCountLocation error.');
    }
  }

  @Post('cp-queue-rfid')
  async cpQueueRfid(@Body() request: RfidCpQueueDTO): Promise<any> {
    try {
      await this.rfidService.CPQueueRFID(request);
      return {
        success: true,
      };
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops cpQueueRfid error.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list-anomaly')
  async listAnomaly(@Query() request: listAnomalyDTO): Promise<any> {
    try {
      const data = await this.rfidService.listAnomaly(request);
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops listAnomaly error.');
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('remove-anomaly')
  async removeAnomaly(@Query() request: removeAnomaliesDTO): Promise<any> {
    try {
      const data = await this.rfidService.removeAnomalies(request);
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(err, 'Ooops removeAnomaly error.');
    }
  }

  @Post('archive-data')
  async achieveDataTransaction(@Query() request: archiveDataDTO): Promise<any> {
    try {
      const data = await this.rfidService.archiveData(request);
      return data;
    } catch (err: any) {
      this.errHandler.throwBadRequestError(
        err,
        'Ooops achieveDataTransaction error.',
      );
    }
  }
}
