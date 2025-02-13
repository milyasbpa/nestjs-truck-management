import { VehiclesService } from 'src/vehicles/vehicles.service';
import {
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { DevGuard } from '@utils/dev.guard';

@Controller('truck')
export class MasterTrucksController {
  constructor(private vehiclesService: VehiclesService) {}
  @UseGuards(DevGuard)
  @Get('savetruck')
  @HttpCode(HttpStatus.OK)
  async getTest(@Headers('x-access-token') headers: string): Promise<any> {
    const dataX = {
      data: {
        id: 16,
        name: 'KMB 5118',
        vendor: 'KMB',
        brand: 'Shacman',
        type: 'Dump Truck',
        model: 'Motor Sight XJ420D',
        capacity: 40,
        status: 1,
        created_at: '2023-03-15T21:29:45.000Z',
        updated_at: '2024-12-30T22:07:12.000Z',
      },
    };
    await this.vehiclesService.setSaveTruck(dataX.data);
  }
}
