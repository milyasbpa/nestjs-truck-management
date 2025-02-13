import { z, ZodType } from 'zod';

export class VidiotronCommandValidation {

  static readonly CREATE_UPDATE: ZodType = z.object({
    code: z.string({ message: `code is required`})
      .min(5, { message: 'minimum 3 characters for code'})
      .max(20, { message: 'maximum 20 characters for code'}),
    command_name: z.string({ message: `command_name is required`})
      .min(5, { message: 'minimum 3 characters for command_name'})
      .max(20, { message: 'maximum 20 characters for command_name'}),
    description: z.string({ message: `description is required`})
      .min(5, { message: 'minimum 3 characters for description'})
      .max(100, { message: 'maximum 100 characters for description'}),
    detail: z.array(z.object({
      line_id: z.number().int({ message: 'line_id is required'}),
      tipe: z.string({ message: `tipe is required`}),
      text: z.string({ message: 'text is required'}),
      pos_x: z.number({ message: 'pos_x is required' }),
      pos_y: z.number({ message: 'pos_y is required' }),
      absolute: z.boolean({ message: 'absolute is required' }),
      align: z.string({ message: 'align is required' }),
      size: z.number({ message: 'size is required' }),
      color: z.string({ message: 'color is required' }),
      speed: z.number({ message: 'speed is required' }),
      image: z.string({ message: 'image is required' }),
      padding: z.number({ message: 'padding is required' }),
      line_height: z.number({ message: 'line_height is required' }),
      width: z.number({ message: 'width is required' }),
      font: z.number({ message: 'font is required' }),
      style: z.string({ message: 'style is required' })
    })),
  });
}