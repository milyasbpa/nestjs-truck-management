import { EncryptionService } from './../utils/crypto.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  
  UseGuards,
} from '@nestjs/common';
import { JobService } from './job.service';
import { TruckMonitoringService } from './trucksmonitor.service';
import { UpdateCronScheduleDto } from './dto/update-cronsechedule.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { decryptJSAES } from '@utils/functions.service';
@Controller('job')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    private readonly truckMonitoringService: TruckMonitoringService,
    private readonly encryptionService: EncryptionService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('edit/:id')
  async scheduleJob(
    @Param('id') id: string,
    @Body() updateCronScheduleDTO: UpdateCronScheduleDto,
  ): Promise<{ message: string; code: number }> {
    const decryptId = decryptJSAES(id);
    return this.jobService.updateJob(Number(decryptId), updateCronScheduleDTO);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async getListJob(): Promise<any> {
    return await this.jobService.getJobs();
  }

  
  @UseGuards(JwtAuthGuard)
  @Delete('schedule/:id')
  async removeJob(
    @Param('id') id: string,
  ): Promise<{ message: string; code: number }> {
    const decryptId = decryptJSAES(id);
    return this.jobService.deleteJob(Number(decryptId));
  }
  @UseGuards(JwtAuthGuard)
  @Get('monitoring-truck')
  async monitortingtruck(
  ): Promise<any> {
    return this.truckMonitoringService.monitorTrucks();
  }
}
