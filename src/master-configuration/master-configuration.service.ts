import { HttpException, Injectable } from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { TextToSpeechConfig } from './entity/text-to-speech-config.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateTextToSpeechConfig,
  UpdateTextToSpeechConfig,
} from './dto/text-to-speech-config.dto';
import { ValidationService } from '@utils/validation-service';
import { TextToSpeechConfigValidation } from './validation/text-to-speech-config.validation';
import { RingtoneConfig } from './entity/ringtone-config.entity';
import { CreateRingtoneConfig } from './dto/ringtone-config.dto';
import { RingtoneConfigValidation } from './validation/ringtone-config.validation';
import { createWriteStream } from 'fs';
import * as fs from 'fs';

@Injectable()
export class MasterConfigurationService {
  constructor(
    @InjectRepository(TextToSpeechConfig)
    private readonly textToSpeechRepository: Repository<TextToSpeechConfig>,
    @InjectRepository(RingtoneConfig)
    private readonly ringtoneRepository: Repository<RingtoneConfig>,
    private validationService: ValidationService,
  ) {}

  private UPLOAD_DIR = './uploads';

  async getTextToSpeechByCode(code: string): Promise<any> {
    const data  = await this.textToSpeechRepository.findOne({ where: { code: code } });
    return {
      data: data,
      code: 200,
      message: 'Success',
    }
  }

  async getTextToSpeechById(id: number): Promise<TextToSpeechConfig> {
    return await this.textToSpeechRepository.findOne({ where: { id: id } });
  }

  async createTextToSpeech(request: CreateTextToSpeechConfig): Promise<any> {
    this.validationService.validate(
      TextToSpeechConfigValidation.CREATE_UPDATE_TEXT_TO_SPEECH,
      request,
    );

    const existingTextToSpeech = await this.textToSpeechRepository.findOne({
      where: { code: request.code },
    });
    if (existingTextToSpeech) {
      throw new HttpException(`Text to speech whit code ${request.code} already exists`, 400);
    }
    const textToSpeech = new TextToSpeechConfig();
    textToSpeech.code = request.code;
    textToSpeech.text_speech = request.text_speech;
    textToSpeech.description = request.description;
    await this.textToSpeechRepository.save(textToSpeech);
    return {
      code: 200,
      message: 'Success',
    };
  }

  async updateTextToSpeech(
    id: string,
    request: UpdateTextToSpeechConfig,
  ): Promise<any> {
    this.validationService.validate(
      TextToSpeechConfigValidation.CREATE_UPDATE_TEXT_TO_SPEECH,
      request,
    );
    const textToSpeech = await this.getTextToSpeechById(Number(id));
    if (!textToSpeech) {
      throw new HttpException('Text to speech not found', 404);
    }

    textToSpeech.code = request.code;
    textToSpeech.text_speech = request.text_speech;
    textToSpeech.description = request.description;
    await this.textToSpeechRepository.save(textToSpeech);
    return {
      code: 200,
      message: 'Success',
    };
  }

  async getAllTextToSpeech(): Promise<any> {
    const data = await this.textToSpeechRepository.find();
    return {
      data: data,
      code: 200,
      message: 'Success',
    };
  }

  async deleteTextToSpeech(id: string): Promise<any> {
    const textToSpeech = await this.getTextToSpeechById(Number(id));
    if (!textToSpeech) {
      throw new HttpException('Text to speech not found', 404);
    }
    await this.textToSpeechRepository.delete(Number(id));
    return {
      code: 200,
      message: 'Success',
    };
  }

  async getAllRingtone(): Promise<any> {
    const data = await this.ringtoneRepository.find();
    return {
      data: data,
      code: 200,
      message: 'Success',
    };
  }

  async getRingtoneById(id: number): Promise<RingtoneConfig> {
    return await this.ringtoneRepository.findOne({ where: { id: id } });
  }

  async getRingtoneByCode(code: string): Promise<any> {
    const data = await this.ringtoneRepository.findOne({ where: { code: code } });
    return {
      data: data,
      code: 200,
      message: 'Success',
    };
  }

  async createRingtone(request: CreateRingtoneConfig): Promise<any> {

    this.validationService.validate(RingtoneConfigValidation.CREATE_UPDATE_RINGTONE, request)
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR);
    }

    const filePath = `${this.UPLOAD_DIR}/${request.file.originalname}`;
    const ws = createWriteStream(filePath);
    ws.write(request.file.buffer)

    await fs.promises.writeFile(filePath, request.file.buffer);
    const ringtone = new RingtoneConfig();
    ringtone.code = request.code;
    ringtone.description = request.description;
    ringtone.url = `/api/ringtone-config/stream/${request.file.originalname}`;
    await this.ringtoneRepository.save(ringtone);
    return {
      code: 200,
      message: 'Success',
    };
  }

  async updateRingtone(id: string, request: CreateRingtoneConfig): Promise<any> {
    this.validationService.validate(RingtoneConfigValidation.CREATE_UPDATE_RINGTONE, request)
    const ringtone = await this.getRingtoneById(Number(id));
    if (!ringtone) {
      throw new HttpException('Ringtone not found', 404);
    }

    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR);
    }

    const filePath = `${this.UPLOAD_DIR}/${request.file.originalname}`;
    const ws = createWriteStream(filePath);
    ws.write(request.file.buffer)
    await fs.promises.writeFile(filePath, request.file.buffer);
    ringtone.code = request.code;
    ringtone.description = request.description;
    ringtone.url = `/api/ringtone-config/stream/${request.file.originalname}`;
    await this.ringtoneRepository.save(ringtone);
    return {
      code: 200,
      message: 'Success',
    };
  }

  async deleteRingtone(id: string): Promise<any> {
    const ringtone = await this.getRingtoneById(Number(id));
    if (!ringtone) {
      throw new HttpException('Ringtone not found', 404);
    }
    await this.ringtoneRepository.delete(Number(id));
    return {
      code: 200,
      message: 'Success',
    };
  }

  async streamRingtone(filename: string): Promise<any> {
    const filePath = `${this.UPLOAD_DIR}/${filename}`;
    if (!fs.existsSync(filePath)) {
      throw new HttpException('File not found', 404);
    }
    const stream = fs.createReadStream(filePath);
    return stream;
  }

}