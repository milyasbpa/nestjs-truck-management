import { HttpException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { VidiotronCommand } from './entity/vidiotron-command.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { VidiotronCommandDetail } from './entity/vidiotron-command-detail.entity';
import { VidioTronCommandDto } from './dto/vidiotron-command.dto';
import { ValidationService } from '@utils/validation-service';
import { VidiotronCommandValidation } from './validation/vidiotron-command.validation';

@Injectable()
export class VidiotronCommandService {
  constructor(
    @InjectRepository(VidiotronCommand)
    private vidiotronCommandRepository: Repository<VidiotronCommand>,
    @InjectRepository(VidiotronCommandDetail)
    private vidiotronCommandDetailRepository: Repository<VidiotronCommandDetail>,
    private validationService: ValidationService,
  ) {
  }

  async createVidiotronCommand(request: VidioTronCommandDto) : Promise<any> {
    this.validationService.validate(VidiotronCommandValidation.CREATE_UPDATE, request)

    let commandDetails : VidiotronCommandDetail[] = [];
    for (const detail of request.detail) {
      let commandDetail = new VidiotronCommandDetail();
      commandDetail.line_id = detail.line_id;
      commandDetail.tipe = detail.tipe;
      commandDetail.text = detail.text;
      commandDetail.pos_x = detail.pos_x;
      commandDetail.pos_y = detail.pos_y;
      commandDetail.absolute = detail.absolute;
      commandDetail.align = detail.align;
      commandDetail.size = detail.size;
      commandDetail.color = detail.color;
      commandDetail.speed = detail.speed;
      commandDetail.image = detail.image;
      commandDetail.padding = detail.padding;
      commandDetail.line_height = detail.line_height;
      commandDetail.width = detail.width;
      commandDetail.font = detail.font;
      commandDetail.style = detail.style;

      commandDetails.push(commandDetail)
    }

    const command = new VidiotronCommand();
    command.code = request.code;
    command.command_name = request.command_name;
    command.description = request.description;
    command.detail = commandDetails;

    await this.vidiotronCommandRepository.save(command);

    return {
      statusCode: 200,
      message: 'ok'
    }
  }

  async updateVidiotronCommand(id: string, request: VidioTronCommandDto) : Promise<any> {
    this.validationService.validate(VidiotronCommandValidation.CREATE_UPDATE, request)

    const command = await this.vidiotronCommandRepository.findOne({
      where: { id: Number(id) },
    });

    if (!command) {
      throw new HttpException('Vidiotron Command not found', 400);
    }

    command.code = request.code;
    command.command_name = request.command_name;
    command.description = request.description;
    command.detail = [];

    await this.vidiotronCommandDetailRepository.delete({ vidiotronCommand: { id: Number(id) } });

    for (const detail of request.detail) {
      let commandDetail = new VidiotronCommandDetail();
      commandDetail.line_id = detail.line_id;
      commandDetail.tipe = detail.tipe;
      commandDetail.text = detail.text;
      commandDetail.pos_x = detail.pos_x;
      commandDetail.pos_y = detail.pos_y;
      commandDetail.absolute = detail.absolute;
      commandDetail.align = detail.align;
      commandDetail.size = detail.size;
      commandDetail.color = detail.color;
      commandDetail.speed = detail.speed;
      commandDetail.image = detail.image;
      commandDetail.padding = detail.padding;
      commandDetail.line_height = detail.line_height;
      commandDetail.width = detail.width;
      commandDetail.font = detail.font;
      commandDetail.style = detail.style;

      command.detail.push(commandDetail)
    }

    await this.vidiotronCommandRepository.save(command);

    return {
      statusCode: 200,
      message: 'ok'
    }
  }

  async deleteVidiotronCommand(id: string) : Promise<any> {
    const command = await this.vidiotronCommandRepository.findOne({
      where: { id: Number(id) },
    });

    if (!command) {
      throw new HttpException('Vidiotron Command not found', 400);
    }

    await this.vidiotronCommandRepository.delete({ id: Number(id) });
    return {
      statusCode: 200,
      message: 'ok',
    };
  }

  async fetchAll() : Promise<any> {
    const commands = await this.vidiotronCommandRepository.find({
      relations: ['detail']
    });

    return {
      statusCode: 200,
      message: 'ok',
      data: commands
    }
  }

  async getByCode(code: string) : Promise<any> {
    const command = await this.vidiotronCommandRepository.findOne({
      where: { code: code },
      relations: ['detail']
    });
    return {
      statusCode: 200,
      message: 'ok',
      data: command,
    }
  }

  async getById(id: string) : Promise<any> {
    const command = await this.vidiotronCommandRepository.findOne({
      where: { id: Number(id) },
      relations: ['detail'],
    });

    if (!command) {
      throw new HttpException('Vidiotron Command not found', 400);
    }

    return {
      statusCode: 200,
      message: 'ok',
      data: command,
    }
  }
}