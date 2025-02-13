import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
 // UseGuards,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
//import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('drivers')
export class DriversController {
  constructor(private readonly driverService: DriversService) {}
  
  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createDriverDto: CreateDriverDto) {
    return this.driverService.create(createDriverDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(@Query('page') page: number) {
    return this.driverService.findAllPaginated(page || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get/:id')
  findOne(@Param('id') id: number) {
    return this.driverService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put("/update/:id")
  update(@Param('id') id: number, @Body() updateDriverDto: UpdateDriverDto) {
    return this.driverService.update(id, updateDriverDto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:id')
  remove(@Param('id') id: number) {
    return this.driverService.remove(id);
  }
 
}
