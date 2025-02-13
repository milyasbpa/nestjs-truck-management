import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { QueueLaneService } from './queue_lane.service';
import { GetAuthInfo, JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { getMetaData } from '@utils/functions.service';
import { CreateQueueLaneDto, UpdateQueueLaneDto } from './dto';
import { JwtAuthResponse } from 'src/auth/dto/auth.dto';
import { dtoStatusCP } from 'src/cp/dto/status.dto';
import { reorderingPosition } from 'src/cp/dto/checkStatusCp.dto';

@Controller('queue-lane')
export class QueueLaneController {
  constructor(private readonly queueLaneService: QueueLaneService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(
    @Body() createLaneDto: CreateQueueLaneDto,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    return this.queueLaneService.create(createLaneDto, authInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAllAll(@Query('q') q: string, @Req() req: Request): Promise<any> {
    const metadata = getMetaData(req);
    return await this.queueLaneService.findAll(q, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list-by-page/:page')
  findAllPerPage(@Query('page') page: number) {
    return this.queueLaneService.findAllPaginated(page || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: string) {
    return this.queueLaneService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateLaneDto: UpdateQueueLaneDto,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    return this.queueLaneService.update(id, updateLaneDto, authInfo);
  }
  @UseGuards(JwtAuthGuard)
  @Put('re-ordering/:id')
  reOrdering(
    @Param('id') id: string,
    @Body() reordering: reorderingPosition,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    return this.queueLaneService.updatePositioningMaster(
      reordering,
      id,
      authInfo,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Put('update-status/:id')
  updateStatusLane(
    @Param('id') id: string,
    @Body() updateLaneDto: dtoStatusCP,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    return this.queueLaneService.updateStatusLane(id, updateLaneDto, authInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: string, @GetAuthInfo() authInfo: JwtAuthResponse) {
    return this.queueLaneService.remove(id, authInfo);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-log')
  lanesActivityLog(@Query('page') page: number, @Query('limit') limit: number) {
    return this.queueLaneService.queueLanesActivityLog(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-log/:queueLaneId')
  lanesActivityLogByLaneId(
    @Param('queueLaneId') queueLaneId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.queueLaneService.queueLanesActivityLogByQueueLaneId(
      queueLaneId,
      page,
      limit,
    );
  }
}
