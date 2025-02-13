import { SimpangBayahService } from './../services/simpangbayah.service';
import { VehiclesService } from 'src/vehicles/vehicles.service';
import { ManagementTruckService } from './../services/management_truck.service';
import { TruckMonitoringService } from 'src/jobs/trucksmonitor.service';
import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { Consumer, Kafka, Producer, ProducerRecord } from 'kafkajs';
import { TruckMovementPayload } from './dto/truck-movement.payload';
import { TruckMovementUtil } from './util/truck-movement.util';
import { InjectRepository } from '@nestjs/typeorm';
import { ConsumerLogs } from './entities/consumer-logs';
import { Repository } from 'typeorm';
import { CacheService } from '@utils/cache.service';
import { MutexService } from '@utils/mutex.service';
import { ErrorHandlerService } from '@utils/error-handler.service';
import { DeviceSBDataPayload } from './dto/device_sb.payload';
import { DeviceSBService } from './util/device_sb.services';
import { QueueVidiotronService } from 'src/queue_vidiotron/queue_vidiotron.service';
import { DeviceCPDataPayload } from './dto/device_cp.payload';
import { LuminixService } from 'src/luminix/luminix.service';
import { DatabaseService } from '@utils/database.service';
import { LuminixUtil } from 'src/luminix/luminix.util';
import { VidiotronNotifService } from 'src/vidiotron-notif/vidiotron-notif.service';
import { VidiotronTypeEnum } from '@utils/enums';
import { TruckMasterPayLoad } from './dto/trucks_master.payload';
import { kafkaDTTruckCountLocation } from 'src/entity/kafka-dt-truck-count-location.entity';

@Injectable()
export class KafkaService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private isProducerConnected = false;
  private isConsumerConnected = false;
  constructor(
    private truckMovementUtil: TruckMovementUtil,
    private truckML: TruckMonitoringService,
    private managementTruckService: ManagementTruckService,
    private lumixService: LuminixService,
    @Inject(forwardRef(() => MutexService))
    private readonly lockedService: MutexService,
    @Inject(forwardRef(() => CacheService))
    private readonly cacheService: CacheService,
    @InjectRepository(ConsumerLogs)
    private readonly consumerAuditRepository: Repository<ConsumerLogs>,
    private readonly errHandler: ErrorHandlerService,
    private readonly deviceSBService: DeviceSBService,
    private readonly queueVidiotronService: QueueVidiotronService,
    private readonly databaseService: DatabaseService,
    private readonly luminixUtils: LuminixUtil,
    private readonly vidiotronNotifService: VidiotronNotifService,
    private readonly vehiclesService: VehiclesService,
    @InjectRepository(kafkaDTTruckCountLocation)
    private readonly kaftaDTTruckCountLocation: Repository<kafkaDTTruckCountLocation>,
  ) {
    this.initializeKafka();
  }

  private async initializeKafka() {
    try {
      const brokerUrl = process.env.KAFKA_BROKER_URL;
      if (!brokerUrl) {
        throw new Error(
          'KAFKA_BROKER_URL is not defined in environment variables',
        );
      }

      this.kafka = new Kafka({
        clientId: 'dev-assign-truck-service',
        brokers: [brokerUrl],
      });

      this.producer = this.kafka.producer();

    } catch (error) {
      this.errHandler.logError('Proble connect to kafka', error);
    }
  }

  async onModuleInit() {
    this.logger.log('Initializing Kafka connections...');
    try {
      //await this.connectProducer();
      //await this.connectConsumer();
      Promise.all([this.connectProducer(),this.connectConsumer()]);
      
      this.logger.log('Kafka connections established successfully.');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Kafka connections: ${error.message}`,
        error.stack,
      );
    }
  }
  private async connectProducer() {
    try {
      if (!this.isProducerConnected) {
        await this.producer.connect();
        this.isProducerConnected = true;
        this.logger.log('Kafka producer connected');
      }
    } catch (error) {
      this.logger.error(
        `Error connecting Kafka producer: ${error.message}`,
        error.stack,
      );
    }
  }
  // private async connectConsumer() {;
  //   // }
  //   const topic1 = 'dev-rppj-geofence-sb';
  //   const topic2 = 'dev-rppj-geofence-cp';
  //   const topic3 = 'dev-rppj-geofence-cop';
  //   const topic4 = 'md_trucks';
  //   const topic6 = 'dev-rppj-geofence-exit-sb';
  //   const topic7 = 'dt-count-location';
  //   const topic8 = 'dev-rppj-geofence-on-cp';

  //   const topics = [topic1, topic2, topic3, topic4, topic6, topic7];

  //   console.log({ TopicsKafka: topics });
  //   for (const topic of topics) {
  //     console.log('Subscribing to topic:', topic);
  //     this.logger.log('Subscribing to topic:', topic);
  //     await this.consumer.subscribe({ topic });
  //   }

  //   // Run the consumer
  //   await this.consumer.run({
  //     eachMessage: async ({ topic, partition, message }) => {
  //       if (topic === topic1) {
  //         console.log({ SubscribeSB: 'subscribe topic sb' });
  //         await this.subscribeAntrianSB(topic, message, async (value) => {
  //           this.logger.log('Message received:', value);
  //         });
  //       } else if (topic === topic2) {
  //         console.log({ SubscribeCP: 'subscribe topic CP' });
  //         await this.subscribeAntrianCp(topic, message, async (value) => {
  //           this.logger.log('Message received:', value);
  //         });
  //       } else if (topic === topic3) {
  //         console.log({ SubscribeCOP: 'subscribe topic Exit-CP' });
  //         await this.subscribeCOP(topic, message, async (value) => {
  //           this.logger.log('Message received:', value);
  //         });
  //       } else if (topic === topic4) {
  //         console.log({ SubscribeCP: 'subscribe topic MD-Trucks' });
  //         await this.subscribeMDTrucks(topic, message, async (value) => {
  //           this.logger.log('Message received:', value);
  //         });
  //       } else if (topic === topic6) {
  //         console.log({
  //           SubscribeTopicExitSB: 'subscribe topic dev-rppj-geofence-exit-sb',
  //         });
  //         await this.subscribeExitSB(topic, message, async (value) => {
  //           this.logger.log('Message received:', value);
  //         });
  //       } else if (topic === topic7) {
  //         console.log({ SubscribeCP: 'subscribe topic MD-Trucks' });
  //         console.log('message', message.value.toString());
  //         await this.subscribeDTTruckLocation(topic, message);
  //       } else if (topic === topic8) {
  //         console.log({ SubscribeCP: 'subscribe topic MD-Trucks' });
  //         console.log('message', message.value.toString());
  //         await this.subscribeUpdateCPQueueAssigmentFromCP(
  //           topic,
  //           message,
  //           async (value) => {
  //             this.logger.log('Message received:', value);
  //           },
  //         );
  //       }
  //     },
  //   });

  //   this.logger.log('Kafka consumer is running');
  // }

  private consumers: Map<string, Consumer> = new Map();
  async topics(): Promise<any> {
    const topics = [
      'dev-rppj-geofence-sb',
      'md_trucks',
      'dev-rppj-geofence-cp',
      'dev-rppj-geofence-cop',
      'dev-rppj-geofence-exit-sb',
      'dev-rppj-geofence-on-cp',
    ];
    return topics;
  }

  private async connectConsumer() {
    // try {
    //   const topics = await this.topics();
    //   this.errHandler.logDebug(`{ TopicsKafka: ${topics} }`);

    //   for (const topic of topics) {
    //     this.createConsumer(topic);
    //   }
    // } catch (error) {
    //   this.errHandler.logError('connectConsumer error', error);
    // }
    
    //Non Blocking
    try {
      const topics = await this.topics();
      this.errHandler.logDebug(`{ TopicsKafka: ${topics} }`);
  
      // Use Promise.all to initiate the creation of all consumers concurrently
      const consumerPromises = topics.map((topic) => this.createConsumer(topic));
  
      // Wait for all consumer creation tasks to complete
      await Promise.all(consumerPromises);
    } catch (error) {
      this.errHandler.logError('connectConsumer error', error);
    }
  }

  private async createConsumer(topic: string) {
    const consumer = this.kafka.consumer({
      groupId: `rppj-dev-group-id`,
      heartbeatInterval: 5000,
      sessionTimeout: 50000,
      rebalanceTimeout: 100000,
    });

    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    this.errHandler.logDebug(
      `Consumer connected and subscribed to topic: ${topic}`,
    );
    this.consumers.set(topic, consumer);
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try{
        this.errHandler.logDebug(`Message received on topic: ${topic}`);
        switch (topic) {
          case 'dev-rppj-geofence-sb':
            await this.subscribeAntrianSB(topic, message, async (value) => {
              this.errHandler.logDebug(`Processed message:${value}`);
            });
            break;
          case 'dev-rppj-geofence-cp':
            await this.subscribeAntrianCp(topic, message, async (value) => {
              this.errHandler.logDebug(`Processed message:${value}`);
            });
            break;
          case 'dev-rppj-geofence-cop':
            await this.subscribeCOP(topic, message, async (value) => {
              this.errHandler.logDebug(`Processed message:${value}`);
            });
            break;
          case 'md_trucks':
            await this.subscribeMDTrucks(topic, message, async (value) => {
              this.errHandler.logDebug(`Processed message:${value}`);
            });
            break;
          case 'dev-rppj-geofence-exit-sb':
            await this.subscribeExitSB(topic, message, async (value) => {
              this.errHandler.logDebug(`Processed message:${value}`);
            });
            break;
          case 'dev-rppj-geofence-on-cp':
            this.errHandler.logDebug(`message: ${message.value.toString()}`);
            await this.subscribeUpdateCPQueueAssigmentFromCP(
              topic,
              message,
              async (value) => {
                this.logger.log('Message received:', value);
              },
            );
            break;

          default:
            this.errHandler.logDebug(`No handler found for topic: ${topic}`);
        }}catch(e){
          this.errHandler.logError('Ooops consumer.run error',e);
        }
      },
    });
  }

  async restartConnection() {
    await this.disconnect();
    this.initializeKafka();
    await this.onModuleInit();
  }

  async sendMessage(topic: string, message: any) {
    try {
      const serializedMessage = JSON.stringify(message);
      const record: ProducerRecord = {
        topic,
        messages: [{ value: serializedMessage }],
      };

      await this.producer.send(record);
      this.logger.log(`Message sent to topic "${topic}": ${serializedMessage}`);
    } catch (error) {
      this.logger.error(
        `Error sending message to topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }

  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application is shutting down (signal: ${signal})`);
    await this.disconnect();
    await this.consumer.disconnect();
    await this.producer.disconnect();
    for (const [topic, consumer] of this.consumers.entries()) {
      try {
        this.logger.log(`Disconnecting consumer for topic: ${topic}`);
        await consumer.disconnect();
      } catch (error) {
        this.logger.error(
          `Error disconnecting consumer for topic "${topic}": ${error.message}`,
          error.stack,
        );
      }
    }
    this.consumers.clear();
  }

  private async disconnect() {
    try {
      if (this.consumer && this.isConsumerConnected) {
        await this.consumer.disconnect();
        this.isConsumerConnected = false;
        this.logger.log('Kafka consumer disconnected');
      }
      if (this.producer && this.isProducerConnected) {
        await this.producer.disconnect();
        this.isProducerConnected = false;
        this.logger.log('Kafka producer disconnected');
      }
    } catch (error) {
      this.logger.error(
        `Error during Kafka disconnect: ${error.message}`,
        error.stack,
      );
    }
  }

  async subscribeDTTruckLocation(topic: string, message: any) {
    try {
      const response = JSON.parse(message.value.toString());
      const newInstanceKaftaDTTruckCountLocation =
        new kafkaDTTruckCountLocation();
      newInstanceKaftaDTTruckCountLocation.groups = response.groups;
      newInstanceKaftaDTTruckCountLocation.total_kosongan =
        response.totalKosongan;
      newInstanceKaftaDTTruckCountLocation.total_muatan = response.totalMuatan;
      newInstanceKaftaDTTruckCountLocation.created_at = new Date();

      this.kaftaDTTruckCountLocation.save(newInstanceKaftaDTTruckCountLocation);
    } catch (error: any) {}
  }

  // Subscribe to Kafka topic and process messages
  /*async subscribeSharingDeviceFamous(onMessage: (value: any) => Promise<void>) {
    const topic =
      process.env.KAFKA_TOPIC_SHARING_DEVICE_FAMOUS || 'dt-last-location';

    try {
      this.logger.log('Subscribing to topic:', topic);
      await this.consumer.subscribe({ topic });
      await this.consumer.run({
        eachMessage: async ({ message }) => {
          try {
            //Improvement to protect overlapping
            await this.lockedService.runLocked(async () => {
              const startTime = Date.now();
              await this.cacheService.setCache('dtolastlocation', 1, 15);
              const value: TruckMovementPayload = JSON.parse(
                message.value.toString(),
              );
              await this.truckMovementUtil.updateTruckMovement(value.data);
              await this.managementTruckService.refreshMaterializedView();
              await onMessage(value);
              await this.consumerAuditRepository.save({
                topic_name: topic,
                source: 'kafka',
                payload: message.value.toString(),
              });
              const endTime = Date.now();
              const executionTime = endTime - startTime;
              this.errHandler.logDebug(
                `Kafka of dtlastlocation was processed in ${executionTime} ms`,
              );
              this.logger.log(`Message processed from topic "${topic}"`);
            });
          } catch (error) {
            this.logger.error(
              `Error processing message from topic "${topic}": ${error.message}`,
              error.stack,
            );
          }
        },
      });
      this.logger.log(`Subscribed to topic: ${topic}`);
    } catch (error) {
      this.logger.error(
        `Error subscribing to topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }*/
  async subscribeAntrianSB(
    topic: string,
    message: any,
    onMessage: (value: any) => Promise<void>,
  ) {
    try {
      //Improvement to protect overlapping

      const value: DeviceSBDataPayload = JSON.parse(message.value.toString());
      const startTime = Date.now();

      this.errHandler.logDebug(
        `N-SB :,
        ${value.data.length > 0 ? value.data[0]?.name : ''}`,
      );

      const dataVidiotronStaticLaneTrue = await this.databaseService
        .query(`SELECT 
                    v.id, 
                    vl.lane_id
                FROM 
                    vidiotron v
                JOIN 
                    vidiotron_lane vl ON v.id = vl.vidiotron_id
                WHERE 
                    v.is_dynamic = FALSE 
                    AND v.status = TRUE`);
      if (dataVidiotronStaticLaneTrue.length > 0) {
        // set flag 1 for previous static vidiotron

        this.errHandler.logDebug(
          `{ vidiotronStaticData: ${JSON.stringify(dataVidiotronStaticLaneTrue)}}`,
        );
        for (const vidiotron of dataVidiotronStaticLaneTrue) {
          this.errHandler.logDebug(`{
            ProcessSaveNotifLaneStatic: 'Process Saving lane static'
          }`);
          await this.vidiotronNotifService.saveNotifLane(
            0,
            0,
            VidiotronTypeEnum.STATIC,
            VidiotronTypeEnum.STATIC,
            vidiotron.lane_id,
            VidiotronTypeEnum.STATIC,
          );
        }
        await this.lumixService.sendLaneNotifStatic();
      }
      // if (dataVidiotronStaticLaneFalse.length > 0) {
      //   console.log({ vidiotronStaticData: dataVidiotronStaticLaneFalse });
      //   for (const vidiotron of dataVidiotronStaticLaneFalse) {
      //     await this.vidiotronNotifService.saveNotifOffStaticLane(
      //       0,
      //       VidiotronTypeEnum.STATIC,
      //       VidiotronTypeEnum.STATIC,
      //       vidiotron.lane_id,
      //       VidiotronTypeEnum.STATIC,
      //       vidiotron.lane_id
      //     );
      //   }
      //   await this.lumixService.sendLaneNotif();
      //   await this.queueVidiotronService.update(value);
      // }
      await this.deviceSBService.ProcessAssignment(value.data);
      await this.lumixService.sendLaneNotif();
      await onMessage(value);
      await this.consumerAuditRepository.save({
        topic_name: topic,
        source: 'kafka',
        payload: message.value.toString(),
      });
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.errHandler.logDebug(
        `Kafka of ${topic} was processed in ${executionTime} ms`,
      );
      this.logger.log(`Message processed from topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }
  async subscribeExitSB(
    topic: string,
    message: any,
    onMessage: (value: any) => Promise<void>,
  ) {
    try {
      //Improvement to protect overlapping
      const value: DeviceCPDataPayload = JSON.parse(message.value.toString());
      const startTime = Date.now();
      this.errHandler.logDebug(
        `EXIT-SB : ${value.data.length > 0 ? value.data[0]?.name : ''}`,
      );
      // proses refresh vidiotron
      await this.vidiotronNotifService.saveNotifRefreshSbayah(value);
      await this.lumixService.sendLaneNotifRefresh();
      await this.queueVidiotronService.update(value);
      await this.lumixService.sendLaneNotif();
      await this.deviceSBService.setWaitingStatusInCp_queue_Assignments(
        value.data,
        false,
      );
      const dataVidiotronDinamisLaneTrue = await this.databaseService
        .query(`SELECT 
                    v.id, 
                    vl.lane_id
                FROM 
                    vidiotron v
                JOIN 
                    vidiotron_lane vl ON v.id = vl.vidiotron_id
                WHERE 
                    v.is_dynamic = TRUE 
                    AND v.status = TRUE`);
      if (dataVidiotronDinamisLaneTrue.length > 0) {
        await this.vidiotronNotifService.saveNotifIdleScreen(value);
        await this.lumixService.sendLaneNotifIdle();
      }
      await onMessage(value);
      await this.consumerAuditRepository.save({
        topic_name: topic,
        source: 'kafka',
        payload: message.value.toString(),
      });
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.errHandler.logDebug(
        `Kafka of ${topic} was processed in ${executionTime} ms`,
      );
      this.logger.log(`Message processed from topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }
  async subscribeAntrianCp(
    topic: string,
    message: any,
    onMessage: (value: any) => Promise<void>,
  ) {
    try {
      //   //Improvement to protect overlapping
      const value: DeviceCPDataPayload = JSON.parse(message.value.toString());
      const startTime = Date.now();
      await this.queueVidiotronService.update(value);
      //   await this.lumixService.sendLaneNotif();
      await this.deviceSBService.setWaitingStatusInCp_queue_Assignments(
        value.data,
        true,
      );
      await onMessage(value);
      await this.consumerAuditRepository.save({
        topic_name: topic,
        source: 'kafka',
        payload: message.value.toString(),
      });
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.errHandler.logDebug(
        `Kafka of ${topic} was processed in ${executionTime} ms`,
      );
      this.logger.log(`Message processed from topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }

  async subscribeCOP(
    topic: string,
    message: any,
    onMessage: (value: any) => Promise<void>,
  ) {
    try {
      //Improvement to protect overlapping
      const value: DeviceSBDataPayload = JSON.parse(message.value.toString());
      const startTime = Date.now();
      await this.deviceSBService.ProcessCOP(value.data);
      await onMessage(value);
      await this.consumerAuditRepository.save({
        topic_name: topic,
        source: 'kafka',
        payload: message.value.toString(),
      });
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.errHandler.logDebug(
        `Kafka of ${topic} was processed in ${executionTime} ms`,
      );
      this.logger.log(`Message processed from topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }
  async subscribeMDTrucks(
    topic: string,
    message: any,
    onMessage: (value: any) => Promise<void>,
  ) {
    try {
      //Improvement to protect overlapping
      const value: TruckMasterPayLoad = JSON.parse(message.value.toString());
      const startTime = Date.now();
      await this.vehiclesService.setSaveTruck(value);
      await onMessage(value);
      await this.consumerAuditRepository.save({
        topic_name: topic,
        source: 'kafka',
        payload: message.value.toString(),
      });
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      this.errHandler.logDebug(
        `Kafka of ${topic} was processed in ${executionTime} ms`,
      );
      this.logger.log(`Message processed from topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }
  async subscribeUpdateCPQueueAssigmentFromCP(
    topic: string,
    message: any,
    onMessage: (value: any) => Promise<void>,
  ) {
    try {
      //Improvement to protect overlapping
      const value: DeviceSBDataPayload = JSON.parse(message.value.toString());
      const startTime = performance.now();
      await this.deviceSBService.setCPQueueAssigmentByGeofence(value.data);
      await onMessage(value);
      await this.consumerAuditRepository.save({
        topic_name: topic,
        source: 'kafka',
        payload: message.value.toString(),
      });
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      this.errHandler.logDebug(
        `Kafka of ${topic} was processed in ${executionTime} ms`,
      );
      this.logger.log(`Message processed from topic "${topic}"`);
    } catch (error) {
      this.logger.error(
        `Error processing message from topic "${topic}": ${error.message}`,
        error.stack,
      );
    }
  }
}
