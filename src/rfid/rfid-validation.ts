import { ZodType, z } from 'zod';
import { TypeOfRFIDSubmitionEnum } from '@utils/enums';

export class rfidNotifValidation {
  static dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]) (?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;

  static readonly NOTIFYIN: ZodType = z.object({
    no_lambung: z.string({ message: `no_lambung is required`})
      .min(5, { message: 'minimum 3 characters for no_lambung'})
      .max(10, { message: 'maximum 10 characters for no_lambung'}),
    device_id: z.string({message: 'device_id is required'}),
    date: z.string({ message: 'date is required'})
      .regex(this.dateRegex, 'dates format is not valid')
  });

  static readonly NOTIFYOUT: ZodType = z.object({
    no_lambung: z.string({ message: `no_lambung is required`})
      .min(5, { message: 'minimum 3 characters for no_lambung'})
      .max(10, { message: 'maximum 10 characters for no_lambung'}),
    device_id: z.string({message: 'device_id is required'}),    
    date: z.string({ message: 'date is required'})
      .regex(this.dateRegex, 'dates format is not valid')
  });
}