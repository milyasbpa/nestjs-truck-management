import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { CreateMonitoringLogDto } from './dto/create-monitoringlog.dto';
import { MonitoringLogService } from './monitoring-log.service';
import { UpdateMonitoringLogDto } from './dto/update-monitoringlog.dto';

@Controller('monitoring-log')
export class MonitoringLogController {
  constructor(private readonly monitoringLogService: MonitoringLogService) {}

  @Get('test')
  getData(): string {
    return 'HellO';
  }

  @Post('create')
  create(@Body() createMonitoringLogDto: CreateMonitoringLogDto) {
    return this.monitoringLogService.create(createMonitoringLogDto);
  }

  @Get('list')
  findAll(@Query('page') page: number) {
    return this.monitoringLogService.findAllPaginated(page || 1);
  }

  @Get('/get/:id')
  findOne(@Param('id') id: string) {
    return this.monitoringLogService.findOne(id);
  }

  @Put('/update/:id')
  update(
    @Param('id') id: string,
    @Body() updateMonitoringLogDto: UpdateMonitoringLogDto,
  ) {
    return this.monitoringLogService.update(id, updateMonitoringLogDto);
  }

  @Delete('/delete/:id')
  remove(@Param('id') id: string) {
    return this.monitoringLogService.remove(id);
  }
}
