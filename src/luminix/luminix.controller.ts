import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { LuminixService } from './luminix.service';
import { LuminixUtil } from './luminix.util';

@Controller('luminix')
export class LuminixController {
  constructor(
    private luminixService: LuminixService,
    private luminixUtil: LuminixUtil,
  ) {
  }

  @Get('/send-recent-notif')
  @HttpCode(HttpStatus.OK)
  async sendRecentNotif() {
    return await this.luminixService.sendRecentNotif();
  }

  @Get('/test-get-command-lane/:laneId/:truckId')
  @HttpCode(HttpStatus.OK)
  async testGetCommand(@Param('laneId') laneId: number, @Param('truckId') truckId) {
    return await this.luminixUtil.getCommandLane(laneId, truckId);
  }

  @Get('/test-get-command-cp/:laneId/:cpId/:truckId')
  @HttpCode(HttpStatus.OK)
  async testGetCommandCP(@Param('laneId') laneId: number, @Param('cpId') cpId: number, @Param('truckId') truckId) {
    return await this.luminixUtil.getCommandCP(laneId, cpId, truckId);
  }

  @Get('/test-get-command-cp-queue/:laneId/:cpId/:truckId')
  @HttpCode(HttpStatus.OK)
  async testGetCommandCPQueue(@Param('laneId') laneId: number, @Param('cpId') cpId: number, @Param('truckId') truckId) {
    return await this.luminixUtil.getCommandCPQueue(laneId, cpId, truckId);
  }
}