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
import { PortService } from './port.service';
import { CreatePortDto } from './dto/create-port.dto';
import { UpdatePortDto } from './dto/update-port.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('port')
export class PortController {
  constructor(private readonly portService: PortService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createPortDto: CreatePortDto) {
    return this.portService.create(createPortDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(@Query('page') page: number) {
    return this.portService.findAllPaginated(page || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: number) {
    return this.portService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  update(@Param('id') id: number, @Body() updatePortDto: UpdatePortDto) {
    return this.portService.update(id, updatePortDto);
  }
  
  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: number) {
    return this.portService.remove(id);
  }
}
