import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { QueueVidiotronService } from './queue_vidiotron.service';
import { DeviceCPDataPayload } from 'src/kafka/dto/device_cp.payload';

@Controller('queue-vidiotron')
export class QueueVidiotronController {
  constructor(private readonly queueVidiotronService: QueueVidiotronService) {}

  @UseGuards(JwtAuthGuard)
  @Put('update')
  update(@Body() updateQueueVidiotron: DeviceCPDataPayload): Promise<any> {
    return this.queueVidiotronService.update(updateQueueVidiotron);
  }
}
