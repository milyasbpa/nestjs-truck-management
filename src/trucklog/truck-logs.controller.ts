import { TruckLogService } from './truck-logs.services';
import { Body, Controller, Get, Req, Request, UseGuards } from '@nestjs/common';
import { getMetaData } from '@utils/functions.service';
import { TruckLogsPayloadDto } from './truck-logs-payload.Dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('logs')
export class TruckLogsController {
  constructor(private readonly truckLogs: TruckLogService) {}

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getTruckLogs(
    @Body() dataPL: TruckLogsPayloadDto,
    @Req() req: Request,
  ): Promise<any> {
    const metadata = getMetaData(req);
    return await this.truckLogs.getLogs(dataPL, metadata);
  }
}
