import { LocalGuard } from './../auth/guards/local.guard';
import { CPStatusService } from './cpstatus.services';
import { ManagementTruckService } from './../services/management_truck.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { GeofencesService } from './geofences.services';
import { TruckMonitoringService } from './trucksmonitor.service';
import { UpdateCronScheduleDto } from './dto/update-cronsechedule.dto';
import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CronJob } from 'cron';
import { InjectRepository } from '@nestjs/typeorm';
import { CronSchedule } from './entities/cronschedule.entity';
import { DeepPartial, Repository } from 'typeorm';
import { StreetsService } from 'src/streets/streets.service';
import { encryptJSAES, sleep } from '@utils/functions.service';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { ConfigService } from '@nestjs/config';
import { Process, Processor } from '@nestjs/bull';
import { TrucksToCPService } from './trucksToCP.service';
import { CustomLogger } from '@utils/custom-logger.service';
import { logger } from '@utils/logger';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CpService } from 'src/cp/cp.service';
import { LuminixService } from '../luminix/luminix.service';
import { SimpangBayahService } from 'src/services/simpangbayah.service';
import { MutexService } from '@utils/mutex.service';
import { TrucksToCOPService } from './trucksToCOP.service';
import { CacheService } from '@utils/cache.service';
import { DatabaseService } from '@utils/database.service';
import { VidiotronNotifService } from 'src/vidiotron-notif/vidiotron-notif.service';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';

@Injectable()
@Processor('job-queue')
export class JobService implements OnModuleInit {
  private jobName: string;
  private jobs: Record<number, CronJob> = {};
  private count = 0;
  private isStreetJobRunning = false;
  private isVehicleJobRunning = false;
  private isMonitoringVehicleJobRunning = false;
  private isTruckToCPJobRunning = false;
  private isTruckToCOPJobRunning = false;
  private isGeoFencesRunning = false;
  private isSimpangBayahRunning = false;
  private isMaterializedViewRunning = false;
  private isStatusCpRunning = false;
  private isMonitorCpRunning = false;
  private isLuminixJobRunning = false;
  private isGenerateExternalAPITokenJobRunning = false;
  private isMonitorTruckDemo = false;
  private isRemoveQueueVidiotron = false;
  private isObserveTruckInSb = false;
  constructor(
    @InjectRepository(CronSchedule)
    private readonly jobRepository: Repository<CronSchedule>,
    @Inject(forwardRef(() => StreetsService))
    private readonly streetsService: StreetsService,
    @Inject(forwardRef(() => VehiclesService))
    private readonly vechiclesService: VehiclesService,
    @Inject(forwardRef(() => TruckMonitoringService))
    private readonly truckMonitoringService: TruckMonitoringService,
    @Inject(forwardRef(() => TrucksToCPService))
    private readonly trucksToCPService: TrucksToCPService,
    @Inject(forwardRef(() => TrucksToCOPService))
    private readonly trucksToCOPService: TrucksToCOPService,
    @Inject(forwardRef(() => GeofencesService))
    private readonly geofencesService: GeofencesService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => CPStatusService))
    private readonly cpStatusService: CPStatusService,
    @Inject(forwardRef(() => CustomLogger))
    private logger: CustomLogger,
    @Inject(forwardRef(() => ErrorHandlerService))
    private readonly errorHandler: ErrorHandlerService,
    @Inject(forwardRef(() => ManagementTruckService))
    private readonly managementTruckService: ManagementTruckService,
    @Inject(forwardRef(() => CpService))
    private readonly cpService: CpService,
    @Inject(forwardRef(() => LuminixService))
    private readonly luminixService: LuminixService,
    @Inject(forwardRef(() => SimpangBayahService))
    private readonly simpangBayahService: SimpangBayahService,
    @Inject(forwardRef(() => MutexService))
    private readonly lockedService: MutexService,
    @Inject(forwardRef(() => CacheService))
    private readonly cacheService: CacheService,
    private readonly databaseService: DatabaseService,
    private readonly vidiotronNotifService: VidiotronNotifService,
    private readonly queueVidiotronService: QueueVidiotronService,
  ) {}

  async onModuleInit() {
    // Load all active jobs from the database on startup
    const activeJobs = await this.jobRepository.find({
      where: { is_active: true },
    });
    activeJobs.forEach((job) => this.startJob(job));
  }

  async addJob(cron_name: string, schedule: string, is_active: boolean) {
    const newJob = await this.jobRepository.save({
      cron_name,
      schedule,
      is_active,
    });
    if (is_active) {
      this.startJob(newJob);
    }
    return newJob;
  }

  async updateJob(
    id: number,
    updateCronScheduleDto: UpdateCronScheduleDto,
  ): Promise<{ message: string; code: number }> {
    // Update the job in the database
    try {
      await this.jobRepository.update(
        id,
        updateCronScheduleDto as DeepPartial<CronSchedule>,
      );
      const result = await this.jobRepository.findOne({ where: { id: id } });
      if (result) {
        if (result.is_active) {
          this.stopJob(result.id);
          this.startJob(result);
        }
      }
      return {
        message: 'Changes of job was saved successfully',
        code: 200,
      };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Changes was failed ot save.',
      );
    }
  }

  async deleteJob(id: number): Promise<any> {
    try {
      this.stopJob(id);
      // await this.jobRepository.delete(id);
      const job = await this.jobRepository.findOneBy({ id });
      if (job) {
        job.is_active = false;
        await this.jobRepository.save(job);
      }
      return { message: 'Job was deleted successfully', statusCode: 200 };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Delete or Disactivated was failed.',
      );
    }
  }

  async getJobs(): Promise<any> {
    try {
      const results = await this.jobRepository.query(
        `select id ,cron_name,schedule,is_active,changes_by,created_at,auditupdate from cron_schedule`,
      );
      const list = results.map((row) => ({
        ...row,
        id: encryptJSAES(String(row.id)),
      }));
      return { statusCode: 200, data: list };
    } catch (error) {
      this.errorHandler.throwBadRequestError(
        error,
        'Data was failed to query.',
      );
    }
  }

  @Process({ name: 'AnyJobs', concurrency: 1 })
  private async startJob(job: CronSchedule) {
    if (this.jobs[job.id]) {
      this.errorHandler.logDebug(`Job with id ${job.id} is already running`);
      return ;
      //throw new Error(`Job with id ${job.id} is already running`);
    }

    const cronJob = new CronJob(job.schedule, () => {
      if (job.cron_name === 'ApiGetGeohauling') {
        this.ApiGetGeohauling();
        return;
      } else if (job.cron_name === 'ApiGetVehicles') {
        this.ApiGetVehicles();
        return;
      } else if (job.cron_name === 'ApiGetMonitoringDevice') {
        this.ApiGetMonitoringDevice();
        return;
      } else if (job.cron_name === 'ApiGetGeofences') {
        this.ApiGetGeofences(job);
        return;
      } else if (job.cron_name === 'ApiGetMonitoringSimpangBayah') {
        this.scheduleMonitoringSimpangBayah(job);
        return;
      } else if (job.cron_name === 'RefreshMaterializedView') {
        this.doRefreshMaterializedView(job);
        return;
      } else if (job.cron_name === 'ApiChekCPStatus') {
        // this.checkStatusCP(job);
        // this.MonitorCpDevice(job);
      } else if (job.cron_name === 'ApiCheckStatusCPDevices') {
        // this.MonitorCpDevice(job);
      } else if (job.cron_name === 'ApiGetLuminix') {
        this.ApiGetLuminix();
      } else if (job.cron_name === 'ApiGenerateExternalToken') {
        this.ApiGenerateExternalAPIToken();
      } else if (job.cron_name === 'ApiMonitorTruckDemo') {
        ///this.MonitoringTruckDEMO(job);
      } else if (job.cron_name === 'ApiGetLastmovementTruck') {
        this.errorHandler.logDebug(
          'started processing api last movement truck',
        );
        this.ApiGetMonitoringDevice();
      } else if (job.cron_name === 'ApiGetAssignFromLaneToCPQueue') {
        this.errorHandler.logDebug(
          `{ ProcessAssignment: 'process assignment truck' }`,
        );
        this.ApiGetTruckToCp();
      } else if (job.cron_name === 'ApiCheckTonagesCp') {
        // this.MonitorTonagesCp(job);
      } else if (job.cron_name === 'ApiCheckCOPStatus') {
        this.ApiGetTruckInCOP();
      } else if (job.cron_name === 'ApiRemoveQueueVidiotron') {
        this.removeQueueVidiotron(job);
      } else if (job.cron_name === 'ApiCheckActualGeofenceTruckSbayah') {
        this.ObserveInvalidGeofence(job);
      }
    });
    cronJob.start();
    this.jobs[job.id] = cronJob;
    this.errorHandler.logDebug(
      `Job "${job.cron_name}" started with schedule: ${job.schedule}`,
    );
  }

  private stopJob(id: number) {
    const job = this.jobs[id];
    if (job) {
      job.stop();
      delete this.jobs[id];
      this.errorHandler.logDebug(`Job with id ${id} stopped.`);
    }
  }
  async ApiGetGeohauling() {
    await this.lockedService.runLocked(async () => {
      if (!this.isStreetJobRunning) {
        this.isStreetJobRunning = true;
        await this.streetsService.fetchAndInsertData();
        this.isStreetJobRunning = false;
        sleep(5000);
      }
    });
  }

  async ApiGetVehicles() {
    await this.lockedService.runLocked(async () => {
      if (!this.isVehicleJobRunning) {
        this.isVehicleJobRunning = true;
        await this.vechiclesService.fetchAndInsertTrucks(1);
        this.isVehicleJobRunning = false;
        sleep(5000);
      }
    });
  }

  async ApiGetMonitoringDevice() {
    await this.lockedService.runLocked(async () => {
      if (!this.isMonitoringVehicleJobRunning) {
        this.isMonitoringVehicleJobRunning = true;
        await this.vechiclesService.fetchAndInsertLastTrucksMovement();
        this.isMonitoringVehicleJobRunning = false;
        sleep(5000);
      }
    });
  }

  async ApiGetLuminix() {
    await this.lockedService.runLocked(async () => {
      if (!this.isLuminixJobRunning) {
        this.isLuminixJobRunning = true;
        await this.luminixService.initNotif();
        this.isLuminixJobRunning = false;
        // TODO: ubah sleep ke sleep(5000);
        sleep(1000);
      }
    });
  }

  async ApiGenerateExternalAPIToken() {
    await this.lockedService.runLocked(async () => {
      if (!this.isGenerateExternalAPITokenJobRunning) {
        this.isGenerateExternalAPITokenJobRunning = true;
        await this.luminixService.generateLuminixToken();
        this.isGenerateExternalAPITokenJobRunning = false;
        sleep(5000);
      }
    });
  }

  async ApiGetTruckToCp() {
    // console.log({ StartProcess: 'Start Processs Get Vidiotron Static' });
    // const vidiotronQueue = await this.databaseService
    //   .query(`SELECT ql.id, ql.lane_name, v.is_dynamic
    //         FROM queue_lane ql
    //         LEFT JOIN vidiotron_cp vc ON vc.cp_id = ql.id
    //         JOIN vidiotron v ON vc.vidiotron_id = v.id
    //         WHERE v.is_dynamic = false`);
    // console.log({ EndProcess: 'End Processs Get Vidiotron Static' });

    // console.log({ VidiotronStatic: vidiotronQueue });
    // if (vidiotronQueue.length > 0) {
    //   for (const vidiotron of vidiotronQueue) {
    //     console.log({
    //       ProcessSaveNotifLaneStatic: 'Process Saving lane static',
    //     });
    //     await this.vidiotronNotifService.saveNotifCpQueue(
    //       vidiotron.id,
    //       vidiotron.id,
    //     );
    //   }
    //   await this.luminixService.sendCPNotif();
    // }
    await this.lockedService.runLocked(async () => {
      this.errorHandler.logDebug(
        `{ isTruckToCPJobRunning: ${this.isTruckToCPJobRunning}}`,
      );
      if (!this.isTruckToCPJobRunning) {
        this.isTruckToCPJobRunning = true;
        await this.trucksToCPService.observStatusAssignCpInRfidStatus();
        await this.trucksToCPService.updateQueueCPtoCP();
        this.isTruckToCPJobRunning = false;
        sleep(5000);
      }
    });
  }

  async ApiGetTruckInCOP() {
    await this.lockedService.runLocked(async () => {
      if (!this.isTruckToCOPJobRunning) {
        this.isTruckToCOPJobRunning = true;
        await this.trucksToCOPService.completedByGeofence();
        this.isTruckToCPJobRunning = false;
        sleep(5000);
      }
    });
  }

  //@Cron(CronExpression.EVERY_MINUTE)
  @Process({ name: 'MonitoringSimpahBayah', concurrency: 1 })
  async scheduleMonitoringSimpangBayah(job: any) {
    await this.lockedService.runLocked(async () => {
      if (!this.isSimpangBayahRunning) {
        this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
        this.isSimpangBayahRunning = true;
        const isCache = await this.cacheService.getCache('dtolastlocation');
        if (isCache) {
          return;
        }
        await this.truckMonitoringService.monitorTrucks();
        this.isSimpangBayahRunning = false;
      }
    });
  }

  @Process({ name: 'Api-Geofences', concurrency: 1 })
  async ApiGetGeofences(job: any): Promise<void> {
    await this.lockedService.runLocked(async () => {
      if (!this.isGeoFencesRunning) {
        this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
        this.isGeoFencesRunning = true;
        await this.geofencesService.getGeofences();
        this.isGeoFencesRunning = false;
      }
    });
  }
  @Process({ name: 'Refresh-MaterializedView', concurrency: 1 })
  async doRefreshMaterializedView(job: any): Promise<void> {
    await this.lockedService.runLocked(async () => {
      if (!this.isMaterializedViewRunning) {
        this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
        this.isMaterializedViewRunning = true;
        await this.managementTruckService.refreshMaterializedView();
        this.isMaterializedViewRunning = false;
      }
    });
  }

  @Process({ name: 'Api-Check-Status CP', concurrency: 1 })
  async checkStatusCP(job: any): Promise<void> {
    /*if (!this.isStatusCpRunning) {
          logger.debug(`Starting job ${job.cron_name}`);
          this.isStatusCpRunning = true;
          // this.cpStatusService.cpStatus();
          this.isStatusCpRunning = false;
        }*/
  }
  @Process({ name: 'Monitoring-Cp-Device', concurrency: 1 })
  async MonitorCpDevice(job: any) {
    if (!this.isMonitorCpRunning) {
      this.errorHandler.logDebug(`${job.cron_name}`);
      this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
      this.isMonitorCpRunning = true;
      await this.cpService.checkStatusAllDevices();
      this.isMonitorCpRunning = false;
      sleep(10000);
    }
  }
  @Process({ name: 'Monitoring-Tonages-Cp', concurrency: 1 })
  async MonitorTonagesCp(job: any) {
    if (!this.isMonitorCpRunning) {
      this.errorHandler.logDebug(`${job.cron_name}`);
      this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
      this.isMonitorCpRunning = true;
      await this.cpService.checkValueTonagesAllCp();
      this.isMonitorCpRunning = false;
      sleep(10000);
    }
  }
  @Process({ name: 'Remove-Queue-Vidiotron', concurrency: 1 })
  async removeQueueVidiotron(job: any) {
    if (!this.isRemoveQueueVidiotron) {
      this.errorHandler.logDebug(`${job.cron_name}`);
      this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
      this.isRemoveQueueVidiotron = true;
      await this.queueVidiotronService.removeSuccessQueue();
      this.isRemoveQueueVidiotron = false;
      sleep(600000);
    }
  }
  @Process({ name: 'Observer-Invalid-Geofence', concurrency: 1 })
  async ObserveInvalidGeofence(job: any) {
    if (!this.isObserveTruckInSb) {
      this.errorHandler.logDebug(`${job.cron_name}`);
      this.errorHandler.logDebug(`Starting job ${job.cron_name}`);
      this.isObserveTruckInSb = true;
      await this.queueVidiotronService.ObserveInvalidGeofence();
      this.isObserveTruckInSb = false;
      sleep(30000);
    }
  }
}
