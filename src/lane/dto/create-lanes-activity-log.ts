import { LanesActivityLogStatus } from '../entities/lanes_activity_log.entity';

export interface createLaneActivityLog {
  lane_id: number;
  previous_lane_name: string | null;
  current_lane_name: string | null;
  previous_status: LanesActivityLogStatus | null;
  current_status: LanesActivityLogStatus | null;
  previous_positioning: number | null;
  current_positioning: number | null;
  reason: string;
  updated_by: string;
}
