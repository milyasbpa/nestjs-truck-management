import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  Param,
  Post,
  Put,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { MasterConfigurationService } from './master-configuration.service';
import {
  CreateRingtoneConfig,
  UpdateRingtoneConfig,
} from './dto/ringtone-config.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { createReadStream, existsSync } from 'fs';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('ringtone-config')
export class RingtoneConfigController {
  constructor(private masterConfigurationService: MasterConfigurationService) {}

  private UPLOAD_DIR = './uploads';

  @Get()
  async findAll(): Promise<any> {
    return await this.masterConfigurationService.getAllRingtone();
  }

  @Get(':id')
  async findOneById(@Param('id') id: string): Promise<any> {
    return await this.masterConfigurationService.getRingtoneById(Number(id));
  }

  @Get('/code/:code')
  async findOneByCode(@Param('code') code: string): Promise<any> {
    return await this.masterConfigurationService.getRingtoneByCode(code);
  }

  @Post('/create')
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file,
    @Body() request: CreateRingtoneConfig,
  ): Promise<any> {
    request.file = file;
    return await this.masterConfigurationService.createRingtone(request);
  }

  @Put('/update/:id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @UploadedFile() file,
    @Body() request: UpdateRingtoneConfig,
  ): Promise<any> {
    request.file = file;
    return await this.masterConfigurationService.updateRingtone(id, request);
  }

  @Delete('/delete/:id')
  async delete(@Param('id') id: string): Promise<any> {
    return await this.masterConfigurationService.deleteRingtone(id);
  }

  @Get('/stream/:filename')
  async streamRingtoneFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<any> {
    const filePath = this.UPLOAD_DIR + '/' + filename;

    // Check if the file exists
    if (!existsSync(filePath)) {
      throw new HttpException('File not found', 404);
    }

    // Set headers for the file download
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    // Stream the file to the response
    const fileStream = createReadStream(filePath);
    fileStream.pipe(res);
  }
}