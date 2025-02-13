import { z, ZodType } from 'zod';

export class ManualAssignTruckValidation {
  static readonly ASSIGN_FROM_CP_TO_CP: ZodType = z.object({
    nomor_lambung: z.string({ message: 'nomor_lambung is required' }),
    from_cp_id: z.string({ message: 'from_cp_id is required' }),
    to_cp_id: z.string({ message: 'to_cp_id is required' }),
    user_id: z.string({ message: 'user_id is required' }),
  });

  static readonly ASSIGN_FROM_UNDETECTED_TO_CP: ZodType = z.object({
    nomor_lambung: z.string({ message: 'nomor_lambung is required' }),
    to_cp_id: z.string({ message: 'to_cp_id is required' }),
    user_id: z.string({ message: 'user_id is required' }),
  });

  static readonly ASSIGN_FROM_LANE_TO_CP: ZodType = z.object({
    nomor_lambung: z.string({ message: 'nomor_lambung is required' }),
    to_cp_id: z.string({ message: 'to_cp_id is required' }),
    user_id: z.string({ message: 'user_id is required' }),
  });

  static readonly ASSIGN_FROM_CP_TO_LANE: ZodType = z.object({
    truck_id: z.string({ message: 'nomor_lambung is required' }),
    from_cp_id: z.string({ message: 'from_cp_id is required' }),
    to_lane_id: z.string({ message: 'to_lane_id is required' }),
    user_id: z.string({ message: 'user_id is required' }),
  });
}