import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRoutesDto } from './dto/create-routes.dto';
import { UpdateRoutesDto } from './dto/update-routes.dto';

@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Get('test')
  getData(): string {
    return 'HellO';
  }
  @Post('create')
  create(@Body() createRoutesDto: CreateRoutesDto) {
    return this.routesService.create(createRoutesDto);
  }

  @Get('list')
  findAll(@Query('page') page: number) {
    return this.routesService.findAllPaginated(page || 1);
  }

  @Get('/get/:id')
  findOne(@Param('id') id: number) {
    return this.routesService.findOne(id);
  }

  @Put('/update/:id')
  update(@Param('id') id: number, @Body() updateRoutesDto: UpdateRoutesDto) {
    return this.routesService.update(id, updateRoutesDto);
  }

  @Delete('/delete/:id')
  remove(@Param('id') id: number) {
    return this.routesService.remove(id);
  }
}
