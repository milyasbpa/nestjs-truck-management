import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from './entity/user';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { HttpModule } from '@nestjs/axios';
import { AuthModule } from './auth/auth.module';

import { CctvModule } from './cctv/cctv.module';
import { DriversModule } from './drivers/drivers.module';
import { LaneModule } from './lane/lane.module';
import { PortModule } from './port/port.module';
import { RoutesModule } from './routes/routes.module';
import { TrucksModule } from './trucks/trucks.module';
import { ReroutePlanModule } from './reroute-plan/reroute-plan.module';
import { MonitoringLogModule } from './monitoring-log/monitoring-log.module';
import { ServicesModule } from './services/services.module';
import { StreetsModule } from './streets/streets.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { JobModule } from './jobs/job.module';
import { CronSchedule } from './jobs/entities/cronschedule.entity';
import { Driver } from './drivers/entities/driver.entity';
import { Lanes } from './lane/entities/lane.entity';
import { Trucks } from './trucks/entities/trucks.entity';
import { RfidModule } from './rfid/rfid.module';
import { CpModule } from './cp/cp.module';
import { Cps } from './jobs/entities/cps.entity';
import { CpUnits } from './cp/entities/cp_units.entity';
import { CpDevices } from './cp/entities/cp_devices.entity';
import { RulesOfSimpangbayahModule } from './ruleofsimpangbayahlane/rulesofsimpangbayahlane.module';
import { RulesOfSimpangBayah } from './ruleofsimpangbayahlane/entities/rulesofsimpangbayahlane.entity';
import { RfidReaderIn } from './rfid/entities/rfid-reader-in.entity';
import { RfidReaderOut } from './rfid/entities/rfid-reader-out.entity';
import { RfidTransaction } from './rfid/entities/rfid-transaction.entity';
import { CpQueueAssignment } from './jobs/entities/cpqueueassignments.entity';
import { QueueLaneModule } from './queue_lane/queue.module';
import { QueueLane } from './queue_lane/entities/queue_lane.entity';
import { QueueLaneRules } from './queue_lane/entities/queue_lane_rule.entity';
import { RuleOfCp } from './cp/entities/cp_rule.entity';
import { CpDetail } from './jobs/entities/cp_details.entity';
import { VidiotronNotifModule } from './vidiotron-notif/vidiotron-notif.module';
import { VidiotronNotif } from './vidiotron-notif/entities/vidiotron-notif.entity';
//import { KafkaModule } from './kafka/kafka.module';
import { RuleLaneCp } from './cp/entities/cp_rule_lane.entity';
import { UsersModule } from './users/users.module';
import { CpDevicesLog } from './cp/entities/cp_devices_log';
import { ConsumerLogs } from './kafka/entities/consumer-logs';
import { RfidAnomaly } from './rfid/entities/rfid-anomaly.entity';
import { RfidThreshold } from './rfid/entities/rfid-threshold.entity';
import { Vidiotron } from './vidiotron-notif/entities/vidiotron.entity';
import { LuminixModule } from './luminix/luminix.module';
import { TruckLogModule } from './trucklog/truck-logs.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CPStatusModule } from './jobs/cpstatus.module.';
import { CustomCacheModule } from '@utils/castom-cache.module';
import { CpStatusLog } from './cp/entities/cp_status_log.entity';
import { CpQueues } from './jobs/entities/cp_queues.entity';
import { UcanModule } from './ucan/ucan.module';
import { Ucan } from './ucan/entities/ucan.entities';
import { CpTonages } from './cp/entities/cp_tonages';
import { CpTonagesLog } from './cp/entities/cp_tonages_log';
import { RfidTransactionArchieve } from './rfid/entities/rfid-transaction-archive.entity';
import { DeviceSBModule } from './kafka/util/device_sb.module';
import { QueueVidiotron } from './vidiotron-notif/entities/vidiotron-queue.entity';
import { QueueVidiotronModule } from './queue_vidiotron/queue_vidiotron.module';
import { Cctv } from './cctv/entities/cctv.entity';
import { VidiotronLane } from './vidiotron-notif/entities/vidiotron-lane.entity';
import { RfidCpQueue } from './rfid/entities/rfid-cp-queue.entity';
import { kafkaDTTruckCountLocation } from './entity/kafka-dt-truck-count-location.entity';
import { CpEntranceType } from './cp/entities/cp_entrance_type.entity';
import { CpExitType } from './cp/entities/cp_exit_type.entity';
import { GeofenceModule } from './geofence/geofence.module';
import { Geofence } from './geofence/entities/geofences.entity';
import { CpDetailGeofence } from './cp/entities/cp_detail_geofence.entity';
import { CpEntranceDetail } from './cp/entities/cp_entrance_detail.entity';
import { CpExitDetail } from './cp/entities/cp_exit_detail.entity';
import { MasterConfigurationModule } from './master-configuration/master-configuration.module';
import { TextToSpeechConfig } from './master-configuration/entity/text-to-speech-config.entity';
import { RingtoneConfig } from './master-configuration/entity/ringtone-config.entity';
import { LanesActivityLog } from './lane/entities/lanes_activity_log.entity';
import { QueueLanesActivityLog } from './queue_lane/entities/queue_lanes_activity_log.entity';
import { DatabaseModule } from '@utils/database.module';
import { RulesLaneQueueLane } from './queue_lane/entities/rule_lane_queue_lane.entity';
import { VidiotronCommandDetail } from './master-configuration/entity/vidiotron-command-detail.entity';
import { VidiotronCommand } from './master-configuration/entity/vidiotron-command.entity';
import { CpQueueAssignmentsLogModule } from './cp-queue-assignments-log/cpQueueAssignmentsLog.module';
import { CpQueueAssignmentsLogEntity } from './cp-queue-assignments-log/entities/cp_queue_assignments_log';

@Module({
  imports: [
    AuthModule,
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          inject: [ConfigService],
          type: 'postgres',
          host: configService.get<string>('DB_HOST'),
          port: parseInt(configService.get<string>('DB_PORT'), 10),
          username: configService.get<string>('DB_USERNAME'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          extra: {
            application_name: configService.get<string>('APP_NAME', 'rppj'),
          },
          entities: [
            Vidiotron,
            User,
            CronSchedule,
            Driver,
            Lanes,
            Trucks,
            RulesOfSimpangBayah,
            RfidReaderIn,
            RfidReaderOut,
            RfidTransaction,
            RfidTransactionArchieve,
            RfidAnomaly,
            RfidThreshold,
            CpQueueAssignment,
            Cps,
            CpDetail,
            CpUnits,
            CpDevices,
            QueueLane,
            QueueLaneRules,
            RuleOfCp,
            VidiotronNotif,
            RuleLaneCp,
            CpDevicesLog,
            ConsumerLogs,
            CpStatusLog,
            CpQueues,
            Ucan,
            CpTonages,
            CpTonagesLog,
            QueueVidiotron,
            Cctv,
            VidiotronLane,
            kafkaDTTruckCountLocation,
            RfidCpQueue,
            CpEntranceType,
            CpExitType,
            Geofence,
            CpDetailGeofence,
            CpEntranceDetail,
            CpExitDetail,
            TextToSpeechConfig,
            RingtoneConfig,
            LanesActivityLog,
            QueueLanesActivityLog,
            RulesLaneQueueLane,
            VidiotronCommandDetail,
            VidiotronCommand,
            CpQueueAssignmentsLogEntity,
          ],
          // entities: ['dist/**/*.entity{.ts,.js}'],
          synchronize: false, // be careful opening this before push to prod, dev or local only
          logging: false,
          autoLoadEntities: false,
        };
      },
      inject: [ConfigService],
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_AUTH_KEY,
        signOptions: { expiresIn: process.env.JWT_AUTH_EXPIRED },
      }),
    }),
    HttpModule,
    DriversModule,
    ServicesModule,
    TrucksModule,
    ReroutePlanModule,
    CctvModule,
    LaneModule,
    PortModule,
    RoutesModule,
    MonitoringLogModule,
    JobModule,
    StreetsModule,
    VehiclesModule,
    RfidModule,
    RulesOfSimpangbayahModule,
    CpModule,
    QueueLaneModule,
    VidiotronNotifModule,
    LuminixModule,
    UsersModule,
    // KafkaModule,
    TruckLogModule,
    CPStatusModule,
    CustomCacheModule,
    UcanModule,
    // EventModule,
    DeviceSBModule,
    QueueVidiotronModule,
    GeofenceModule,
    MasterConfigurationModule,
    DatabaseModule,
    CpQueueAssignmentsLogModule,
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class AppModule {}
