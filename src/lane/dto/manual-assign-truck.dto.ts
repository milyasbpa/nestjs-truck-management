export interface ManualAssignCPToCPRequest {
  nomor_lambung: string;
  from_cp_id: string;
  to_cp_id: string;
  user_id: string;
}
export interface ManualAssignUndetecetdToCPRequest {
  nomor_lambung: string;
  to_cp_id: string;
  user_id: string;
}

export interface AssignResponse {
  statusCode: number;
  message: string;
}

export interface ManualAssignLaneToCpRequest {
  nomor_lambung: string;
  from_lane_id: string;
  to_cp_id: string;
  truck_id: string;
  user_id: string;
}

export interface ManualAssignCPToLaneRequest {
  truck_id: string;
  from_cp_id: string;
  to_lane_id: string;
  user_id: string;
}
