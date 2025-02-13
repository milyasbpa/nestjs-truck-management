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
import { ReroutePlanService } from './reroute-plan.service';
import { CreateReroutePlanDto } from './dto/create-rerouteplan.dto';
import { UpdateReroutePlanDto } from './dto/update-rerouteplan.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('reroute-plan')
export class ReroutePlanController {
  constructor(private readonly reroutePlanService: ReroutePlanService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createReroutePlanDto: CreateReroutePlanDto) {
    return this.reroutePlanService.create(createReroutePlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(@Query('page') page: number) {
    return this.reroutePlanService.findAllPaginated(page || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('get/:id')
  findOne(@Param('id') id: number) {
    return this.reroutePlanService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update/:id')
  update(
    @Param('id') id: number,
    @Body() updateReroutePlanDto: UpdateReroutePlanDto,
  ) {
    return this.reroutePlanService.update(id, updateReroutePlanDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: number) {
    return this.reroutePlanService.remove(id);
  }
}
