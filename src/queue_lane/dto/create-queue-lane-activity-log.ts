import { QueueLanesActivityLogStatus } from '../entities/queue_lanes_activity_log.entity';

export interface createQueueLaneActivityLog {
  queue_lane_id: number;
  previous_queue_lane_name: string | null;
  current_queue_lane_name: string | null;
  previous_status: QueueLanesActivityLogStatus | null;
  current_status: QueueLanesActivityLogStatus | null;
  previous_positioning: number | null;
  current_positioning: number | null;
  reason: string;
  updated_by: string;
}
