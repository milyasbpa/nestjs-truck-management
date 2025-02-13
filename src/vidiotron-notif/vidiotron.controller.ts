import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { VidiotronService } from './vidiotron.service';
import {
  CreateVidiotronCP,
  CreateVidiotronLane,
  UpdateCountingVidiotronLane,
  UpdateStatusVidiotronLane,
  UpdateVidiotronStaticLane,
} from './dto/vidiotron-master.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('vidiotron')
export class VidiotronController {
  constructor(private vidiotronService: VidiotronService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create-cp')
  async createVidiotronCP(@Body() request: CreateVidiotronCP): Promise<any> {
    return this.vidiotronService.createVidiotronCP(request);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/create-lane')
  async createVidiotronLane(
    @Body() request: CreateVidiotronLane,
  ): Promise<any> {
    return this.vidiotronService.createVidiotronLane(request);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-cp/:id')
  async updateVidiotronCP(
    @Param('id') id: number,
    @Body() request: CreateVidiotronCP,
  ): Promise<any> {
    return this.vidiotronService.updateVidiotronCP(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-lane/:id')
  async updateVidiotronLane(
    @Param('id') id: number,
    @Body() request: CreateVidiotronLane,
  ): Promise<any> {
    return this.vidiotronService.updateVidiotronLane(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-static-lane/:id')
  async updateVidiotronStaticLane(
    @Param('id') id: number,
    @Body() request: UpdateVidiotronStaticLane,
  ): Promise<any> {
    return this.vidiotronService.changeStaticVidiotron(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update-status-lane/:id')
  async updateStatusVidiotronLane(
    @Param('id') id: number,
    @Body() request: UpdateStatusVidiotronLane,
  ): Promise<any> {
    return this.vidiotronService.updateStatusVidiotronLane(id, request);
  }
  @UseGuards(JwtAuthGuard)
  @Put('/update-count-lane/:id')
  async updateCountingVidiotronLane(
    @Param('id') id: number,
    @Body() request: UpdateCountingVidiotronLane,
  ): Promise<any> {
    return this.vidiotronService.updateCountingVidiotronLane(id, request);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-vidiotron-cp')
  async getVidiotronCP(): Promise<any> {
    return this.vidiotronService.getVidiotronCP();
  }

  @UseGuards(JwtAuthGuard)
  @Get('get-vidiotron-lane')
  async getVidiotronLane(): Promise<any> {
    return this.vidiotronService.getVidiotronLane();
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-vidiotron-cp/:id')
  async deleteVidiotronCP(@Param('id') id: number): Promise<any> {
    return this.vidiotronService.deleteVidiotronCP(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete-vidiotron-lane/:id')
  async deleteVidiotronLane(@Param('id') id: number): Promise<any> {
    return this.vidiotronService.deleteVidiotronLane(id);
  }
}
