import { z, ZodType } from 'zod';

export class LaneRequestValidation {
  static readonly ACTIVATE: ZodType = z.object({
    id: z.number({ message: 'id is required' }),
    is_active: z.boolean({ message: 'is_active is required' }),
  });
}