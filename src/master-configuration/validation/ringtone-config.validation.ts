import { z, ZodType } from 'zod';

export class RingtoneConfigValidation {
  static readonly CREATE_UPDATE_RINGTONE: ZodType = z.object({
    code: z.string({ message: `code is required`})
      .min(5, { message: 'minimum 3 characters for code'})
      .max(20, { message: 'maximum 20 characters for code'}),
  });
}