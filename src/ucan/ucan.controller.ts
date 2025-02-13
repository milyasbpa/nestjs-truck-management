import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Ucan } from './entities/ucan.entities';
import { CreateUcanDTO } from './dto/create-ucan.dto';
import { UcanService } from './ucan.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';

@Controller('ucan')
export class UcanController {
  constructor(private readonly ucanService: UcanService) {}

  // @UseGuards(JwtAuthGuard)
  @Post()
  async postRppjTruck(
    @Body() createUcanBodyPayload: CreateUcanDTO,
  ): Promise<Ucan> {
    return this.ucanService.createUcan(createUcanBodyPayload);
  }
}
