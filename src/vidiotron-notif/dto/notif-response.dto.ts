export interface NotifLaneResponseDto {
  notif_id: number;
  lane_id?: string;
  lane_code?: string;
  lane_name?: string;
  status?: string;
  notif_type?: string;
  header?: string;
  body_description?: string;
  total_description?: string;
  type_truck_description?: string;
  command?: any;
  vidiotron_id?: number;
}

export interface NotifCPResponseDto {
  notif_id: number;
  cp_id?: string;
  cp_name?: string;
  status?: string;
  notif_type?: string;
  header?: string;
  body_description?: string;
  total_description?: string;
  type_truck_description?: string;
  command?: any;
  vidiotron_id? : number;
}

export interface NotifRecentReponseDto {
  lane_id?: string;
  lane_name?: string;
  cp_id?: string;
  cp_name?: string;
  status?: string;
  notif_type?: string;
  header?: string;
  body_description?: string;
  total_description?: string;
  type_truck_description?: string;
  command?: any;
  vidiotron_id? : number;
}

