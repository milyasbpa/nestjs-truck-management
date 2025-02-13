import { Express } from 'express';

export interface CreateRingtoneConfig {
  code: string;
  description: string;
  file: Express.Multer.File;
}

export interface UpdateRingtoneConfig {
  code: string;
  description: string;
  file: Express.Multer.File;
}