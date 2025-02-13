import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { KafkaService } from './kafka.service';

@Controller('kafka')
export class KafkaController {
  constructor(private readonly kafkaService: KafkaService) {}

  // Endpoint untuk mengirim pesan ke topik tertentu
  @Post('messages')
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Body() dto: { topic: string; message: string },
    @Res() res: Response,
  ): Promise<void> {
    try {
      if (!dto.topic || !dto.message) {
        res
          .status(HttpStatus.BAD_REQUEST)
          .json({ message: 'Topic and message are required.' });
        return;
      }

      await this.kafkaService.sendMessage(dto.topic, dto.message);
      res.status(HttpStatus.CREATED).json({
        message: `Message sent to topic "${dto.topic}" successfully.`,
      });
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to send message to Kafka topic',
        error: err.message,
      });
    }
  }

  // Endpoint untuk Restart
  @Get('restart')
  async restart(@Res() res: Response): Promise<void> {
    try {
      const messages = await this.kafkaService.restartConnection();
      res.status(HttpStatus.OK).json({ messages });
    } catch (err: any) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to read messages from Kafka topic',
        error: err.message,
      });
    }
  }
}
