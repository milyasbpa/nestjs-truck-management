export interface QueueLaneRulesDto {
  max_capacity: number;
  truck_type: string;
}

export interface QueueLaneRulesUpdateDto {
  id?: number;
  max_capacity: number;
  truck_type: string;
}

export interface CreateQueueLaneDto {
  lane_name: string;
  lane_code?: string;
  positioning: number;
  max_capacity: number;
  status: boolean;
  created_by: number;
  rules_type_truck: string[];
  rules: QueueLaneRulesDto[];
  rules_lanes?: string[];
}

export interface UpdateQueueLaneDto {
  lane_name?: string;
  lane_code?: string;
  positioning?: number;
  max_capacity?: number;
  status?: boolean;
  updated_by: number;
  reason_status?: string;
  rules_type_truck: string[];
  rules?: QueueLaneRulesUpdateDto[];
  rules_lanes?: string[];
}
