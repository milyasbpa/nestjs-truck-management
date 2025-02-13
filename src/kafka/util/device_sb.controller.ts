import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DeviceSBService } from './device_sb.services';
import { DeviceSBDataPayload } from '../dto/device_sb.payload';
import { DevGuard } from '@utils/dev.guard';
import { TruckHistoryService } from 'src/history/truck_history_cp/truck_history_cp.service';

@Controller('sb')
export class DeviceSBController {
  constructor(
    private deviceSBService: DeviceSBService,
    private truckH: TruckHistoryService,
  ) {}

  @UseGuards(DevGuard)
  @Get('test')
  @HttpCode(HttpStatus.OK)
  async getTest(@Headers('x-access-token') headers: string): Promise<any> {
    const dataX = {
      message: 'Success',
      count: 1,
      data: [
        {
          id: 170,
          device_id: 1120,
          vendor_id: 20,
          name: 'RBT 0092',
          driver_name: null,
          tipe_truck: 'DT',
          contractor: 'AEK',
          lat: -3.6405083,
          lng: 115.651855,
          geofence: 'Antrian SB Lane 2',
          status: 'online',
          speed: 38,
          course: 81,
          gps_time: '2024-12-29T09:00:18.000Z',
        },
      ],
    };
    const payload: DeviceSBDataPayload = {
      data: dataX.data.map((item) => ({
        id: item.id,
        device_id: item.device_id, // Cast ke string karena interface meminta string
        vendor_id: item.vendor_id,
        name: item.name, // Typo di interface (harusnya string, bukan number)
        driver_name: item.driver_name || '', // Isi default jika null
        tipe_truck: item.tipe_truck,
        contractor: item.contractor,
        lat: item.lat,
        lng: item.lng,
        geofence: item.geofence,
        status: item.status,
        speed: item.speed,
        course: item.course,
        gps_time: item.gps_time,
      })),
    };
    return await this.deviceSBService.ProcessAssignment(payload.data);
  }
  @UseGuards(DevGuard)
  @Get('cop')
  @HttpCode(HttpStatus.OK)
  async getCOP(@Headers('x-access-token') headers: string): Promise<any> {
    const dataX = {
      message: 'Success',
      count: 1,
      data: [
        {
          id: 1234,
          device_id: 1120,
          vendor_id: 20,
          name: 'RBT 0092',
          driver_name: null,
          tipe_truck: 'DT',
          contractor: 'AEK',
          lat: -3.6405083,
          lng: 115.651855,
          geofence: 'Antrian SB Lane 2',
          status: 'online',
          speed: 38,
          course: 81,
          gps_time: '2024-12-29T09:00:18.000Z',
        },
      ],
    };
    const payload: DeviceSBDataPayload = {
      data: dataX.data.map((item) => ({
        id: item.id,
        device_id: item.device_id, // Cast ke string karena interface meminta string
        vendor_id: item.vendor_id,
        name: item.name, // Typo di interface (harusnya string, bukan number)
        driver_name: item.driver_name || '', // Isi default jika null
        tipe_truck: item.tipe_truck,
        contractor: item.contractor,
        lat: item.lat,
        lng: item.lng,
        geofence: item.geofence,
        status: item.status,
        speed: item.speed,
        course: item.course,
        gps_time: item.gps_time,
      })),
    };
    return await this.deviceSBService.ProcessCOP(payload.data);
  }
  async getMDTruck() {
    const dataX = {
      event_type: 'new_record',
      data: {
        id: 993,
        status: '1',
        manufactured_year: '2025',
        name: 'BIM 00155',
        device_id: 1188,
        dsm_id: null,
        adas_id: null,
        tablet_id: null,
        device_id2: null,
        model_id: 18,
        category_id: 2,
        type_id: 1,
        brand_id: 9,
        member_id: 2,
        vendor_id: 37,
        created_by: 950,
      },
    };
  }

  @UseGuards(DevGuard)
  @Get('test-cp-geofence')
  @HttpCode(HttpStatus.OK)
  async getUpdateCP(): Promise<any> {
    const dataX = {
      message: 'Success',
      count: 1,
      data: [
        {
          id: 1234,
          device_id: 1120,
          vendor_id: 20,
          name: 'RBT 0092',
          driver_name: null,
          tipe_truck: 'DT',
          contractor: 'AEK',
          lat: -3.6405083,
          lng: 115.651855,
          geofence: 'Antrian SB Lane CP 3',
          status: 'online',
          speed: 38,
          course: 81,
          gps_time: '2024-12-29T09:00:18.000Z',
        },
      ],
    };
    const payload: DeviceSBDataPayload = {
      data: dataX.data.map((item) => ({
        id: item.id,
        device_id: item.device_id, // Cast ke string karena interface meminta string
        vendor_id: item.vendor_id,
        name: item.name, // Typo di interface (harusnya string, bukan number)
        driver_name: item.driver_name || '', // Isi default jika null
        tipe_truck: item.tipe_truck,
        contractor: item.contractor,
        lat: item.lat,
        lng: item.lng,
        geofence: item.geofence,
        status: item.status,
        speed: item.speed,
        course: item.course,
        gps_time: item.gps_time,
      })),
    };
    return await this.deviceSBService.setCPQueueAssigmentByGeofence(
      payload.data,
    );
  }

  @UseGuards(DevGuard)
  @Get('/get-test3')
  async dosaveHistory(req: Request) {
    await this.truckH.saveTruckHistoryCPRFID(true, 818, 1, 'IN');
    return { message: 'Done', showCode: 200 };
  }
}
