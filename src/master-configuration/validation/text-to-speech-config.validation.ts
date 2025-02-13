import { z, ZodType } from 'zod';

export class TextToSpeechConfigValidation {
  static readonly CREATE_UPDATE_TEXT_TO_SPEECH: ZodType = z.object({
    code: z.string({ message: `code is required`})
      .min(5, { message: 'minimum 3 characters for code'})
      .max(20, { message: 'maximum 20 characters for code'}),
    text_speech: z.string({message: 'text is required'}),
  });
}