import { EncryptionService } from '../utils/crypto.service';
import { Request } from 'express';
import {
  Controller,
  Param,
  Put,
  Body,
  Get,
  UseGuards,
  Req,
  Post,
  Query,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt.guard';
import { RulesOfSimpangBayahService } from './rulesofsimpangbayahlane.service';
import { CreateRuleOfSimpangBayahLaneDto } from './dto/create-ruleofsimpanglane.dto';
import { decryptJSAES, getMetaData } from '@utils/functions.service';
import { UpdateRuleOfSimpangBayahLaneDto } from './dto/update-ruleofsimpanglane.dto';
@Controller('rulesofsimpangbayahlane')
export class RulesOfSimpangBayahController {
  constructor(
    private readonly encryptionService: EncryptionService,
    private readonly rulesOfSimpangBayahService: RulesOfSimpangBayahService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async create(
    @Body() createDto: CreateRuleOfSimpangBayahLaneDto,
    @Req() req: Request,
  ) {
    const metadata = getMetaData(req);
    return await this.rulesOfSimpangBayahService.create(createDto, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list')
  async findAll(@Req() req: Request) {
    const metadata = getMetaData(req);
    return await this.rulesOfSimpangBayahService.findAll(metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Get('list/lane/:id')
  async findByLaneId(@Param('id') id: string, @Req() req: Request) {
    const metadata = getMetaData(req);
    const decryptId = Number(decryptJSAES(id));
    return await this.rulesOfSimpangBayahService.findByLaneId(
      decryptId,
      metadata,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Get('list/page')
  async findAllPagination(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Req() req: Request,
  ) {
    const metadata = getMetaData(req);
    return await this.rulesOfSimpangBayahService.findAllPaginated(
      page || 1,
      limit || 10,
      metadata,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('/get/:id')
  async findOne(@Param('id') id: number, @Req() req: Request) {
    const metadata = getMetaData(req);
    return await this.rulesOfSimpangBayahService.findOne(id, metadata);
  }

  @UseGuards(JwtAuthGuard)
  @Put('/update/:id')
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRuleOfSimpangBayahLaneDto,
    @Req() req: Request,
  ) {
    const metadata = getMetaData(req);
    const decryptId = Number(decryptJSAES(id));
    return await this.rulesOfSimpangBayahService.update(
      decryptId,
      updateDto,
      metadata,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:id')
  async remove(@Param('id') id: number, @Req() req: Request) {
    const metadata = getMetaData(req);
    return await this.rulesOfSimpangBayahService.remove(id, metadata);
  }
}
