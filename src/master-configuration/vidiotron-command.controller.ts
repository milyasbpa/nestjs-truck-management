import { VidiotronCommandService } from './vidiotron-command.service';
import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards } from '@nestjs/common';
import { VidioTronCommandDto } from './dto/vidiotron-command.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('/vidiotron-command')
export class VidiotronCommandController {
  constructor(private vidiotronCommandService: VidiotronCommandService) {}

  @Post('/create')
  @HttpCode(HttpStatus.OK)
  async createVidiotronCommand(@Body() request: VidioTronCommandDto) {
    return await this.vidiotronCommandService.createVidiotronCommand(request);
  }

  @Put('/update/:id')
  @HttpCode(HttpStatus.OK)
  async updateVidiotronCommand(@Param('id') id: string, @Body() request: VidioTronCommandDto) {
    return await this.vidiotronCommandService.updateVidiotronCommand(id, request);
  }

  @Delete('/delete/:id')
  @HttpCode(HttpStatus.OK)
  async deleteVidiotronCommand(@Param('id') id: string) {
    return await this.vidiotronCommandService.deleteVidiotronCommand(id);
  }

  @Get('/list')
  @HttpCode(HttpStatus.OK)
  async listVidiotronCommand() {
    return await this.vidiotronCommandService.fetchAll();
  }

  @Get('/code/:code')
  @HttpCode(HttpStatus.OK)
  async getVidiotronCommandByCode(@Param('code') code: string) {
    return await this.vidiotronCommandService.getByCode(code);
  }

  @Get('/id/:id')
  @HttpCode(HttpStatus.OK)
  async getVidiotronCommandById(@Param('id') id: string) {
    return await this.vidiotronCommandService.getById(id);
  }
}