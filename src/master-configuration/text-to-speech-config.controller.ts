import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { MasterConfigurationService } from './master-configuration.service';
import { CreateTextToSpeechConfig, UpdateTextToSpeechConfig } from './dto/text-to-speech-config.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('/text-to-speech')
export class TextToSpeechConfigController {
    constructor(
      private masterConfigurationService: MasterConfigurationService,
    ) {}

    @Get()
    async findAll() {
        return await this.masterConfigurationService.getAllTextToSpeech();
    }

    @Get(':id')
    async findOneById(@Param('id') id: string) {
        return await this.masterConfigurationService.getTextToSpeechById(Number(id));
    }

    @Get('/code/:code')
    async findOne(@Param('code') code: string) {
        return await this.masterConfigurationService.getTextToSpeechByCode(code);
    }

    @Post('/create')
    async create(@Body() createDto: CreateTextToSpeechConfig) {
        return await this.masterConfigurationService.createTextToSpeech(createDto);
    }

    @Put('/update/:id')
    async update(@Param('id') id: string, @Body() updateDto: UpdateTextToSpeechConfig) {
        return await this.masterConfigurationService.updateTextToSpeech(id, updateDto);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        return await this.masterConfigurationService.deleteTextToSpeech(id);
    }
}