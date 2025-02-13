import { ManagementTruckService } from './management_truck.service';
import { CpQueueAssignmentService } from './cpQueueAssignmet.service';
import { SimpangBayahService } from './simpangbayah.service';
import { EncryptionService } from './../utils/crypto.service';
import {
  Controller,
  Param,
  Put,
  Body,
  Get,
  UseGuards,
  Query,
  Req,
  Post,
  Request,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { DevGuard } from 'src/utils/dev.guard';
import {
  decryptJSAES,
  encryptJSAES,
  getMetaData,
} from '@utils/functions.service';
import { SaveRerouteCPQueueDTO } from './dto/create_cp_assignment.dto';
import { CreateCpQueueAssignmentDTO } from './dto/cp-queue-assigntmentDto';
import { ExitCPDTO } from './dto/cpexitDto';
import { CacheService } from '@utils/cache.service';
import { DragDropPayLoadDto } from './dto/dragdrop';
import { CpQAssigmentNomorLambungDto } from './dto/cp-nomorlambung.dto';
import { ErrorHandlerService } from '@utils/error-handler.service';

@Controller()
export class ServicesController {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly simpangBayahService: SimpangBayahService,
    private readonly cpQueueAssignmentService: CpQueueAssignmentService,
    private readonly managementTruckService: ManagementTruckService,
    private readonly cacheServce: CacheService,
    private readonly errHandler: ErrorHandlerService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Put('encrypt/:id')
  //@UseGuards(DevGuard)
  doEncrypt(@Param('id') id: string): string {
    return encryptJSAES(id);
  }

  @Put('decrypt2')
  @UseGuards(DevGuard)
  doDecrypt(@Body() body: any): Promise<any> {
    debugger;
    const { id } = body;
    this.errHandler.logDebug(body);
    const result = this.encryptionService.decryptFromDB(id);
    return result[0];
  }

  @UseGuards(JwtAuthGuard)
  @Get('simpang-bayah/location')
  async getSimpangBayahLocation(): Promise<any> {
    return await this.simpangBayahService.getLocation();
  }
  @UseGuards(JwtAuthGuard)
  @Get('cp-queue/list')
  async getListOfCPQueueAssignment(
    @Query('search') search: string,
    @Query('status') status: string,
  ): Promise<any> {
    return await this.simpangBayahService.getSummaryCPQueue(search, status);
  }
  @UseGuards(JwtAuthGuard)
  @Get('management-truck/list')
  async getListOfTruckManagement(
    @Query('search') search: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('sort') sort: string = `case when geofence ilike '%bib cp%' then 1 when geofence ilike '%antrian cp%' then 2 when geofence ilike '%simpang bayah%' then 3 else 4 end, tm.gps_time`,
    @Query('order') order: 'ASC' | 'DESC' = 'DESC',
    @Req() req: Request,
  ) {
    if (Number.isNaN(limit) || Number.isNaN(page)) {
      return { message: 'limit & page is required', statuCode: 200 };
    }
    const metadata = getMetaData(req);
    return await this.managementTruckService.getListTruck(
      {
        search,
        page,
        limit,
        sort,
        order,
      },
      metadata,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Get('management-truck/detail/id')
  async getDetailTruck(
    @Query('q') q: string,
    @Req() req: Request,
  ): Promise<any> {
    const truck_id = Number(decryptJSAES(q));
    const metadata = getMetaData(req);
    return await this.managementTruckService.detailTruck(truck_id, metadata);
  }
  @UseGuards(JwtAuthGuard)
  @Put('cp-queue/save')
  async saveCpQueue(
    @Body() body: SaveRerouteCPQueueDTO,
    @Req() req: Request,
  ): Promise<any> {
    const metadata = getMetaData(req);
    return await this.simpangBayahService.saveCpAqueueAssignment(
      body,
      metadata,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post('cp-queue/assign')
  async setCpAqueueAssignment(
    @Body() createCPQAssignment: CreateCpQueueAssignmentDTO,
  ): Promise<any> {
    return await this.cpQueueAssignmentService.saveBulkByNomorLambung(
      createCPQAssignment,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post('cp-queue/exit')
  async setExitCP(@Body() exitcpDTO: ExitCPDTO): Promise<any> {
    return await this.cpQueueAssignmentService.exitCP(exitcpDTO);
  }
  @UseGuards(JwtAuthGuard)
  @Get('cache/set')
  async setCache(@Param('q') q: number): Promise<any> {
    return await this.cacheServce.setCache('dtolastlocation', 1, q);
  }

  @UseGuards(JwtAuthGuard)
  @Post('cp-queue/assign-by-user')
  async DoAssigenment(@Body() dragDrop: DragDropPayLoadDto): Promise<any> {
    return await this.simpangBayahService.saveCpAqueueAssignmentV2(dragDrop);
  }

  @UseGuards(JwtAuthGuard)
  @Get('cp-queue/nomor-lambung/show/:assignment_id')
  async ShowNomorLambung(
    @Param("assignment_id") assignment_id:string):
    Promise<any> {
    return await this.cpQueueAssignmentService.ShowNomorLambung(assignment_id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('cp-queue/nomor-lambung/save')
  @HttpCode(200)
  async SaveNomorLambung(
    @Body() payload: CpQAssigmentNomorLambungDto,
    @Req() q: Request
  ): Promise<any> {
    debugger;
    const metadata = getMetaData(q);
    return await this.cpQueueAssignmentService.saveEditNomorlambung(
      payload,
      metadata,
    );
  }
}
