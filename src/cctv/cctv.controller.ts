import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CctvService } from './cctv.service';
import { Cctv } from './entities/cctv.entity';
import { CreateCctvDto } from './dto/create-cctv.dto';
import { UpdateCctvDto } from './dto/update-cctv.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('cctv')
export class CctvController {
  constructor(private readonly cctvService: CctvService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createCctvDto: CreateCctvDto): Promise<any> {
    return this.cctvService.create(createCctvDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  findAll(
    @Query('page') page: number,
  ): Promise<{ data: Cctv[]; total: number; page: number }> {
    return this.cctvService.findAll(page);
  }

  
  @UseGuards(JwtAuthGuard)
  @Get('/get/:id')
  findOne(@Param('id') id: number): Promise<Cctv> {
    return this.cctvService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update/:id')
  update(@Param('id') id: number, @Body() updateCctvDto: UpdateCctvDto) {
    return this.cctvService.update(id, updateCctvDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:id')
  remove(@Param('id') id: number): Promise<any> {
    return this.cctvService.remove(id);
  }
}
