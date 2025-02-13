import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CpService } from './cp.service';
import { CreateCpDto } from './dto/create-cp.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import {
  checkStatusDevicesCp,
  dtoListLogCp,
  insertDeviceAndItemsCp,
  reorderingPosition,
  UpdateAllPriorityCpDTO,
} from './dto/checkStatusCp.dto';
import { dtoStatusCP, priorityUpdate } from './dto/status.dto';

@Controller('cp')
export class CpController {
  constructor(private readonly cpService: CpService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() CreateCpDto: CreateCpDto): Promise<any> {
    return this.cpService.create(CreateCpDto);
  }
  @UseGuards(JwtAuthGuard)
  @Post('insert-devices')
  insertDevices(@Body() dto: insertDeviceAndItemsCp): Promise<any> {
    return this.cpService.insertDeviceAndItems(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('re-ordering/:id')
  reordering(
    @Param('id') id: string,
    @Body() dto: reorderingPosition,
  ): Promise<any> {
    return this.cpService.updatePositioningMaster(dto, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('check-device-cp')
  checkDeviceCp(@Body() dto: checkStatusDevicesCp): Promise<any> {
    return this.cpService.checkStatusDevices(dto);
  }

  @Post('check-tonages-cp')
  checkTonages(@Body() dto: checkStatusDevicesCp): Promise<any> {
    return this.cpService.checkValueTonagesCp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-all-priority')
  updateAllPriorityCP(@Body() dto: UpdateAllPriorityCpDTO): Promise<any> {
    return this.cpService.updateAllPriorityCp(dto);
  }

  @Get('check-all-device-cp')
  checkAllDeviceCp(): Promise<any> {
    return this.cpService.checkStatusAllDevices();
  }

  @Get('check-all-tonages-cp')
  checkTonagesCp(): Promise<any> {
    return this.cpService.checkValueTonagesAllCp();
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAllAll(): Promise<any> {
    return await this.cpService.findAll();
  }
  @UseGuards(JwtAuthGuard)
  @Get('list-rules-cp')
  async findAllRules(): Promise<any> {
    return await this.cpService.findAllRulesCp();
  }

  @UseGuards(JwtAuthGuard)
  @Get('list-by-page/:page')
  findAllPerPage(@Query('page') page: number) {
    return this.cpService.findAllPaginated(page || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('log-cp')
  findLogLatestAllCp(@Query() dto: dtoListLogCp) {
    return this.cpService.findLogAllLatestCp(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('log/:id/')
  findLogCp(@Param('id') id: string, @Query() dto: dtoListLogCp) {
    return this.cpService.findLogCp(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('device-log/:id/')
  findLogDeviceCp(@Param('id') id: string, @Query() dto: dtoListLogCp) {
    return this.cpService.findLogDeviceCp(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('tonages-log/:id/')
  findLogTonagesCp(@Param('id') id: string, @Query() dto: dtoListLogCp) {
    return this.cpService.findLogTonagesCp(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.cpService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateDto: CreateCpDto,
  ): Promise<any> {
    return this.cpService.update(id, updateDto);
  }
  @UseGuards(JwtAuthGuard)
  @Put('update-status-cp/:id')
  updateStatusCp(
    @Param('id') id: string,
    @Body() updateDto: dtoStatusCP,
  ): Promise<any> {
    return this.cpService.updateStatusCP(id, updateDto);
  }
  @UseGuards(JwtAuthGuard)
  @Put('priority-update-cp/:id')
  priorityStatusCp(
    @Param('id') id: string,
    @Body() updateDto: priorityUpdate,
  ): Promise<any> {
    return this.cpService.priotiryStatusCP(id, updateDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: string) {
    return this.cpService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('entrance-option/list')
  getCpEntranceOptionList(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.cpService.getCpEntranceOptionList({
      page: page ?? 1,
      limit: limit ?? 5,
      search: search,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('exit-option/list')
  getCpExitOptionList(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('search') search: string,
  ) {
    return this.cpService.getCpExitOptionList({
      page: page ?? 1,
      limit: limit ?? 5,
      search: search,
    });
  }
}
