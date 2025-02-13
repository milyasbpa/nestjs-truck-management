import { z, ZodType } from 'zod';

export class VidiotronValidation {

  static readonly CREATE_UPDATE_VIDIOTRON_CP: ZodType = z.object({
    cp_id: z.string({ message: `cp_id is required`}),
    code: z.string({ message: `code is required`}),
    ip: z.string({ message: `ip is required`}),
    description: z.string({ message: `description is required`}),
    status: z.boolean({ message: `status is required`}),
    is_dynamic: z.boolean({ message: `is_dynamic is required`}),
    ads_command: z.optional(
      z.array(z.object({
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
      }))
    ),
  });

  static readonly CREATE_UPDATE_VIDIOTRON_LANE: ZodType = z.object({
    lane_id: z.string({ message: `cp_id is required`}),
    code: z.string({ message: `code is required`}),
    ip: z.string({ message: `ip is required`}),
    description: z.string({ message: `description is required`}),
    status: z.boolean({ message: `status is required`}),
    is_dynamic: z.boolean({ message: `is_dynamic is required`}),
    vidiotron_commands: z.optional(
      z.array(z.object({
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
      }))
    ),
  });
}