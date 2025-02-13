export interface DataLanePayload {
  data: LanesPayload[];
}
export interface LanesPayload {
  lane_id: number;
  current_data: number;
}
