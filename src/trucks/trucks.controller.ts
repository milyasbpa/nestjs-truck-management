import { VehiclesService } from 'src/vehicles/vehicles.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { CreateTrucksDto } from './dto/create-trucks.dto';
import { UpdateTrucksDto } from './dto/update-trucks.dto';
import { TrucksService } from './trucks.service';
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
import { DevGuard } from '@utils/dev.guard';

@Controller('trucks')
export class TrucksController {
  constructor(
    private readonly trucksService: TrucksService,
    private readonly vehiclesService: VehiclesService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createTrucksDto: CreateTrucksDto) {
    return this.trucksService.create(createTrucksDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list-by-page/:page')
  findAll(@Query('page') page: number) {
    return this.trucksService.findAllPaginated(page || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: number) {
    return this.trucksService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  update(@Param('id') id: number, @Body() updateTrucksDto: UpdateTrucksDto) {
    return this.trucksService.update(id, updateTrucksDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: number) {
    return this.trucksService.remove(id);
  }

  @UseGuards(DevGuard)
  @Get('test')
  async getTest(): Promise<any> {
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
