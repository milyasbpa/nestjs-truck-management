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
import { LaneService } from './lane.service';
import { CreateLaneDto } from './dto/create-lane.dto';
import { UpdateLaneDto } from './dto/update-lane.dto';
import { GetAuthInfo, JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import {
  encryptJSAES,
  getMetaData,
  stringToBoolean,
} from '@utils/functions.service';
import { ActiveInactiveDto } from './dto/active-inactive.dto';
import {
  AssignResponse,
  ManualAssignCPToCPRequest,
  ManualAssignCPToLaneRequest,
  ManualAssignLaneToCpRequest,
  ManualAssignUndetecetdToCPRequest,
} from './dto/manual-assign-truck.dto';
import { QueryParamsCp } from './dto/query-list-cp.dto';
import { dtoStatusCP } from 'src/cp/dto/status.dto';
import { reorderingPosition } from 'src/cp/dto/checkStatusCp.dto';
import { JwtAuthResponse } from 'src/auth/dto/auth.dto';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Controller('lane')
export class LaneController {
  constructor(
    private readonly laneService: LaneService,
    private readonly errHandler: ErrorHandlerService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(
    @Body() createLaneDto: CreateLaneDto,
    @GetAuthInfo authInfo: JwtAuthResponse,
  ): Promise<any> {
    try {
      return this.laneService.create(createLaneDto, authInfo);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller Create',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAllAll(
    @Query('status') q: string,
    @Req() req: Request,
  ): Promise<any> {
    try {
      const metadata = getMetaData(req);
      return await this.laneService.findAll(q, metadata);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller findAllAll',
      );

    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('list-by-page/:page')
  findAllPerPage(@Query('page') page: number) {
    try {
      return this.laneService.findAllPaginated(page || 1);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller findAllPerPage',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: string) {
    try {
      return this.laneService.findOne(id);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller findOne',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  update(
    @Param('id') id: string,
    @Body() updateLaneDto: UpdateLaneDto,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    try {
      return this.laneService.update(id, updateLaneDto, authInfo);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller update',
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Put('update-status/:id')
  updateStatusLane(
    @Param('id') id: string,
    @Body() updateLaneDto: dtoStatusCP,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    try {
      return this.laneService.updateStatusLane(id, updateLaneDto, authInfo);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller update Status',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: string, @GetAuthInfo authInfo: JwtAuthResponse) {
    try {
      return this.laneService.remove(id, authInfo);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller update Status',
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @Put('complete/assignment/:id')
  removeAssignment(@Param('id') id: string) {
    try {
      return this.laneService.removeTruckFromCP(id);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller update assignment',
      );

    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('re-ordering/:id')
  reOrdering(
    @Param('id') id: string,
    @Body() reordering: reorderingPosition,
    @GetAuthInfo() authInfo: JwtAuthResponse,
  ): Promise<any> {
    try {
      return this.laneService.updatePositioningMaster(reordering, id, authInfo);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller reOrdering',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/unit-on-cp')
  @HttpCode(HttpStatus.OK)
  async unitOnCpList(
    @Query('search') search: string,
    @Query('status') status: string,
  ): Promise<any> {
    try {
      return await this.laneService.getSummaryCPV2(search, status);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller unitOnCpList',
      );
    }
    //return await this.laneService.unitOnCpList(dtoRequest)
  }

  //deprecated
  @UseGuards(JwtAuthGuard)
  @Get('/unit-on-cp-queue')
  @HttpCode(HttpStatus.OK)
  async unitOnCpQueue(@Query() dto: QueryParamsCp): Promise<any> {
    try {
      return await this.laneService.unitOnCpQueue(dto);
    } catch (error) {
     this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller unitOnCpQueue',
      );

    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/unit-on-cp-queues')
  @HttpCode(HttpStatus.OK)
  async unitOnCpQueues(@Query() dto: QueryParamsCp): Promise<any> {
    try {
      return await this.laneService.unitOnCpQueues(dto);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller unitOnCpQueues',
      );


    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/unit-on-lane-queue')
  @HttpCode(HttpStatus.OK)
  async unitOnLaneQueue(@Query() dto: QueryParamsCp): Promise<any> {
    try {
      return await this.laneService.unitOnCpQueue(dto);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller unitOnLaneQueue',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('/lane-list')
  @HttpCode(HttpStatus.OK)
  async laneList(): Promise<any> {
    try {
      return await this.laneService.laneList();
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller laneList',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/activate-cp')
  @HttpCode(HttpStatus.OK)
  async activateCP(@Body() request: ActiveInactiveDto): Promise<any> {
    try {
      return await this.laneService.activateCP(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller activateCP',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/activate-cp-queue')
  @HttpCode(HttpStatus.OK)
  async activateCPQueue(@Body() request: ActiveInactiveDto): Promise<any> {
    try {
      return await this.laneService.activateCP(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller activateCPQueue',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('/activate-lane')
  @HttpCode(HttpStatus.OK)
  async activateLane(@Body() request: ActiveInactiveDto): Promise<any> {
    try {
      return await this.laneService.activateLane(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller activateLane',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/assign/lane-to-cp')
  async assignTruckFromLaneToCP(
    @Body() request: ManualAssignLaneToCpRequest,
  ): Promise<AssignResponse> {
    try {
      this.errHandler.logDebug(`request lane_to_cp ${JSON.stringify(request)}`);
      return await this.laneService.assignTruckFromLaneToCP(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller assignTruckFromLaneToCP',
      );
    }
  }

  //@UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/assign/cp-to-cp')
  async assignTruckFromCPToCP(
    @Body() request: ManualAssignCPToCPRequest,
  ): Promise<AssignResponse> {
    try {
      return await this.laneService.assignTruckFromCPToCP(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller assignTruckFromCPToCP',
      );
    }
  }
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/assign/truck-to-cp')
  async assignTruckFromUndetectedToCP(
    @Body() request: ManualAssignUndetecetdToCPRequest,
  ): Promise<AssignResponse> {
    try {
      return await this.laneService.assignTruckFromUndetectedToCP(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller assignTruckFromUndetectedToCP',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('/assign/cp-to-lane')
  async assignTruckFromCPToLane(
    @Body() request: ManualAssignCPToLaneRequest,
  ): Promise<AssignResponse> {
    try {
      return await this.laneService.assignTruckFromCPToLane(request);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller assignTruckFromCPToLane',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('undetected-trucks')
  undetectedTrucks(@Query('status') status: string) {
    try {
      return this.laneService.undetectedTrucks(status);
    } catch (error) {
      this.errHandler.throwBadRequestError(
        error,
        'Ooops Error Lane Controller undetectedTrucks',
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-log')
  lanesActivityLog(@Query('page') page: number, @Query('limit') limit: number) {
    return this.laneService.lanesActivityLog(page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('activity-log/:laneId')
  lanesActivityLogByLaneId(
    @Param('laneId') laneId: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.laneService.lanesActivityLogByLaneId(laneId, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @Get('count-truck-km-simpangbayah')
  async getCountTruckOfSimpangBayahKM() {
    return await this.laneService.getCountTruckOfSimpangBayahKM();
  }
}
