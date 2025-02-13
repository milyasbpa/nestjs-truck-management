import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { VidiotronNotifService } from './vidiotron-notif.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('vidiotron-notif')
export class VidiotronNotifController {
  constructor(private vidiotronService: VidiotronNotifService) {}

  @UseGuards(JwtAuthGuard)
  @Get('/fetch-notif-lane')
  @HttpCode(HttpStatus.OK)
  async fetchNotifLane(): Promise<any> {
    return this.vidiotronService.fetchNotifLane();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/fetch-notif-cp')
  @HttpCode(HttpStatus.OK)
  async fetchNotifCP(): Promise<any> {
    return this.vidiotronService.fetchNotifcp([true, false]);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/recent-notif')
  @HttpCode(HttpStatus.OK)
  async getRecentNotif(): Promise<any> {
    return this.vidiotronService.getRecentNotif();
  }
}
